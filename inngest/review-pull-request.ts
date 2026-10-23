import { generatePrReview } from "@/lib/pr-review";
import prisma from "@/lib/db";
import { embedTexts } from "@/lib/openai";
import { index } from "@/lib/pinecone";
import { inngest } from "./client";
import { getInstallationOctokit } from "@/features/github/github-app";

// ============================================================================
// Inngest Background Function: Automates AI Code Review for Pull Requests
// Triggered by GitHub webhook when a PR is opened, reopened, or updated (synchronized).
// ============================================================================
export const reviewPullRequest = inngest.createFunction(
  {
    id: "review-pull-request",
    triggers: { event: "pr/review.requested" },
    // If any step in the review process fails permanently, update database status to "FAILED"
    onFailure: async ({ event }) => {
      const data = event.data.event.data;

      await prisma.pullRequestReview.updateMany({
        where: {
          githubRepositoryId: data.githubRepositoryId,
          githubPrNumber: data.prNumber,
        },
        data: { status: "FAILED" },
      });
    },
  },
  async ({ event, step }) => {
    // Extract pull request metadata sent from the GitHub webhook
    const {
      installationId,
      owner,
      repo,
      prNumber,
      prTitle,
      prAuthor,
      prUrl,
      githubRepositoryId,
      prBody,
    } = event.data;

    // STEP 1: Create or update a review record in Prisma database
    // Marks status as "REVIEWING" so the dashboard UI immediately displays a pending state
    const reviewRecord = await step.run("create-review-record", async () => {
      const repository = await prisma.gitHubRepository.findUnique({
        where: { githubRepositoryId },
      });

      return prisma.pullRequestReview.upsert({
        where: {
          githubRepositoryId_githubPrNumber: {
            githubRepositoryId,
            githubPrNumber: prNumber,
          },
        },
        create: {
          githubPrNumber: prNumber,
          githubRepositoryId,
          repositoryId: repository?.id,
          owner,
          repoName: repo,
          fullName: `${owner}/${repo}`,
          title: prTitle,
          author: prAuthor,
          prUrl,
          status: "REVIEWING",
        },
        update: {
          title: prTitle,
          author: prAuthor,
          prUrl,
          status: "REVIEWING",
          reviewBody: null, // Reset previous review body when a new commit is pushed
        },
      });
    });

    // STEP 2: Fetch the PR diff and changed files from GitHub
    const pr = await step.run("fetch-pr-diff", async () => {
      const octokit = await getInstallationOctokit(installationId);

      // List all files modified, added, or removed in this pull request
      const { data: files } = await octokit.rest.pulls.listFiles({
        owner,
        repo,
        pull_number: prNumber,
        per_page: 100,
      });

      // Format a high-level file summary (filename, status, additions/deletions)
      const fileList = files
        .map(
          (file) =>
            `${file.filename} [${file.status}] +${file.additions}/-${file.deletions}`,
        )
        .join("\n");

      // Assemble unified diff patches across files, capped to stay within LLM context limits
      const diff = files
        .map((file) => {
          const patch =
            file.patch?.slice(0, 6000) ?? "(no text diff: binary or too large)";
          return `--- ${file.filename} [${file.status}]\n${patch}`;
        })
        .join("\n\n")
        .slice(0, 60000);

      return { fileList, diff };
    });

    // STEP 3: RAG Retrieval - Find relevant codebase context using Pinecone vector search
    // Searches previously indexed files so the AI understands surrounding architecture and dependencies
    const codebaseContext = await step.run("fetch-codebase-context", async () => {
      // If the repository hasn't been indexed into Pinecone yet, proceed without extra context
      if (!reviewRecord.repositoryId) return "";

      // Generate an embedding for the PR diff using OpenAI
      const [queryEmbedding] = await embedTexts([pr.diff.slice(0, 6000)]);

      // Query Pinecone for the top 8 most semantically relevant code chunks from this repo
      const results = await index.query({
        vector: queryEmbedding,
        topK: 8,
        includeMetadata: true,
        filter: { repositoryId: reviewRecord.repositoryId },
      });

      // Combine matching code snippets into a formatted context block
      return results.matches
        .map((match) => `--- ${match.metadata?.path}\n${match.metadata?.content}`)
        .join("\n\n");
    });

    // STEP 4: Generate the AI Code Review using Anthropic Claude
    const reviewBody = await step.run("generate-review", async () => {
      return generatePrReview({
        title: prTitle,
        body: prBody ?? "",
        author: prAuthor,
        files: pr.fileList,
        diff: pr.diff,
        codebaseContext,
      });
    });

    // STEP 5: Post the AI review as a comment directly on the GitHub Pull Request
    await step.run("post-github-comment", async () => {
      const octokit = await getInstallationOctokit(installationId);

      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: `## Prowl Review\n\n${reviewBody}\n\n---\n<sub>Generated by Prowl using the Claude Agent SDK.</sub>`,
      });
    });

    // STEP 6: Save the completed review in our database and update status to "COMPLETED"
    await step.run("save-review", async () => {
      await prisma.pullRequestReview.update({
        where: { id: reviewRecord.id },
        data: {
          status: "COMPLETED",
          reviewBody,
        },
      });
    });

    // Return summary data for Inngest execution logs
    return {
      prNumber,
      fullName: `${owner}/${repo}`,
      reviewId: reviewRecord.id,
    };
  },
);