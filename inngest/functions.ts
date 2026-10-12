import { index } from "@/lib/pinecone";
import { inngest } from "./client";
import prisma from "@/lib/db";
import { getInstallationOctokit } from "@/features/github/github-app";
import { embedTexts } from "@/lib/openai";

// 1. Allowed file types: only index code and text files that are useful for AI review
const CODE_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".py",
  ".go",
  ".rs",
  ".md",
  ".json",
  ".css",
  ".html",
]; 

// 2. Folders to ignore: avoid indexing dependencies, build outputs, or git metadata
const SKIP_DIRS = ["node_modules", ".next", "dist", "build", ".git"];

// Helper: Split long file content into smaller pieces (2000 chars each) for AI embeddings
function chunkText(text: string) {
  const chunkSize = 2000;
  const chunks = [];

  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }

  return chunks;
}

// Helper: Check if a file is inside one of the skipped folders (e.g. node_modules/...)
function shouldSkipPath(path: string) {
  return SKIP_DIRS.some(
    (dir) => path.startsWith(`${dir}/`) || path.includes(`/${dir}/`),
  );
}


// ============================================================================
// Inngest Function: Indexes a GitHub repository for vector search / AI context
// Triggered when an event named "repo/index.requested" is sent.
// ============================================================================
export const indexRepository = inngest.createFunction(
  {
    id: "index-repository",
    triggers: { event: "repo/index.requested" },
    // If any step fails completely after retries, update database status to "FAILED"
    onFailure: async ({ event }) => {
      const repositoryId = event.data.event.data.repositoryId as string;

      await prisma.gitHubRepository.update({
        where: { id: repositoryId },
        data: { indexStatus: "FAILED" },
      });
    },
  },
    
  async ({ event, step }) => { 
    const repositoryId = event.data.repositoryId as string;

    // STEP 1: Mark repository as "INDEXING" in the database so the UI shows a progress indicator
    await step.run("mark-indexing", async () => {
      await prisma.gitHubRepository.update({
        where: { id: repositoryId },
        data: { indexStatus: "INDEXING", indexedAt: null },
      });
    });

    // STEP 2: Retrieve repository information and GitHub App credentials from our database
    const repo = await step.run("load-repository", async () => {
      return prisma.gitHubRepository.findUnique({
        where: { id: repositoryId },
        include: { installation: true },
      });
    });
        
    if (!repo) {
      return { error: "Repository not found" };
    }

    // STEP 3: Connect to GitHub and fetch the list of files from the default branch
    const files = await step.run("fetch-files", async () => {
      // Authenticate as the GitHub App for this specific installation
      const octokit = await getInstallationOctokit(
        Number(repo.installation.githubInstallationId),
      );

      // Get the latest commit SHA on the default branch (e.g., main or master)
      const { data: ref } = await octokit.rest.git.getRef({
        owner: repo.owner,
        repo: repo.name,
        ref: `heads/${repo.defaultBranch}`,
      });

      // Get the full file tree of the repository recursively
      const { data: tree } = await octokit.rest.git.getTree({
        owner: repo.owner,
        repo: repo.name,
        tree_sha: ref.object.sha,
        recursive: "true",
      });

      // Filter down to only keep valid code files:
      // - Must be a file ("blob"), not a folder ("tree")
      // - Not in an ignored directory (e.g., node_modules)
      // - Must have an allowed code extension (.ts, .js, .py, etc.)
      // - Size must be under 100 KB to avoid indexing huge generated files
      return tree.tree.filter(
        (item) =>
          item.type === "blob" &&
          item.path &&
          !shouldSkipPath(item.path) &&
          CODE_EXTENSIONS.some((ext) => item.path!.endsWith(ext)) &&
          (item.size ?? 0) < 100_000,
      );
    });
      
    // STEP 4: Process files in batches to stay within API rate limits and memory limits
    let indexedChunks = 0;
    const batchSize = 20; // Process 20 files per batch
    
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);

      // Each batch runs as its own Inngest step (retriable and tracked independently)
      const chunksIndexed = await step.run(`index-batch-${i}`, async () => {
        const octokit = await getInstallationOctokit(
          Number(repo.installation.githubInstallationId),
        );
          
        // 4a. Download the raw code content for each file in the batch from GitHub
        const fileContents = await Promise.all(
          batch.map(async (file) => {
            const { data } = await octokit.rest.repos.getContent({
              owner: repo.owner,
              repo: repo.name,
              path: file.path!,
            });

            // Ensure it is a single file, not a directory or submodule
            if (Array.isArray(data) || data.type !== "file") {
              return null;
            }

            // GitHub returns file content as Base64; decode it to standard UTF-8 text
            return {
              path: file.path!,
              content: Buffer.from(data.content, "base64").toString("utf8"),
            };
          }),
        );
          
        // 4b. Split the downloaded code files into smaller text chunks (2000 chars each)
        const allChunks: { path: string; chunk: string; chunkIndex: number }[] = [];

        for (const file of fileContents) {
          if (!file) continue;

          const chunks = chunkText(file.content);

          chunks.forEach((chunk, chunkIndex) => {
            allChunks.push({
              path: file.path,
              chunk,
              chunkIndex,
            });
          });
        }
          
        // If there are no chunks to index in this batch, finish early
        if (allChunks.length === 0) {
          return 0;
        }

        // 4c. Generate vector embeddings for all code chunks using OpenAI
        const embeddings = await embedTexts(allChunks.map((item) => item.chunk));

        // 4d. Format chunks into Pinecone vector records with metadata for semantic search
        const records = allChunks.map((item, index) => ({
          id: `${repositoryId}-${item.path}-${item.chunkIndex}`,
          values: embeddings[index],
          metadata: {
            repositoryId,
            fullName: repo.fullName,
            path: item.path,
            chunk: item.chunkIndex,
            content: item.chunk.slice(0, 1000), // Preview snippet for fast reference
          },
        }));

        // 4e. Upsert vectors into Pinecone database
        await index.upsert({ records });

        return allChunks.length;
      });
      
      indexedChunks += chunksIndexed;
    }

    // STEP 5: Mark the repository as successfully "INDEXED" with the current timestamp
    await step.run("mark-indexed", async () => {
      await prisma.gitHubRepository.update({
        where: { id: repositoryId },
        data: {
          indexStatus: "INDEXED",
          indexedAt: new Date(),
        },
      });
    });
      
    // Return summary statistics about the indexing run
    return {
      repositoryId,
      fullName: repo.fullName,
      files: files.length,
      chunks: indexedChunks,
    };
  }
);