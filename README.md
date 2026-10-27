Live app: https://prowl-rho.vercel.app/

# Prowl

Prowl is an AI-powered GitHub pull request reviewer. Sign in with GitHub, install the Prowl GitHub App on your repositories, and Prowl reviews pull requests automatically when they are opened or updated.

## Project summary

Code review is slow, and reviewers often miss context about the rest of the codebase. Prowl acts as an always-on reviewer that knows your repository. It reads each pull request the way a senior engineer would: it checks that the diff matches the PR's intent, looks for bugs, security problems and edge cases, and replies with a short, structured review.

What makes the reviews useful is retrieval. Prowl indexes your repository's code as embeddings in Pinecone. For every PR it pulls the most relevant existing code and gives it to the model as context, so feedback can say whether a change fits the patterns already in the codebase instead of judging the diff in isolation.

What you get:

- Automatic reviews on every opened, reopened or updated pull request, posted as a comment on the PR itself and saved in the dashboard.
- A fixed review format: Overview, Changes, Suggestions and Verdict. Each finding is tagged Blocker, Major, Minor or Nit, and a clean PR gets a short approving review.
- A dashboard with an Overview tab (including a contribution graph), a Repositories tab, a Pull Requests tab that shows each review as it moves from reviewing to completed or failed, and a Settings tab for managing the GitHub installation.
- Per-account limits on connected repositories and PR reviews, to keep costs under control.
- Prompt-injection protection: PR titles, descriptions and diffs are treated as untrusted text to review, never as instructions.

## How it works

1. Sign in with GitHub and install the Prowl GitHub App on your account or organization.
2. Prowl syncs the repositories you granted access to. A background job splits their files into chunks, embeds them with OpenAI and stores them in Pinecone.
3. When a pull request is opened, reopened or updated, GitHub sends a webhook to Prowl, which queues an Inngest job.
4. The job runs these steps:
   1. Create or update a review record and mark it as reviewing, so the dashboard shows it right away.
   2. Fetch the changed files and diff from GitHub (diff size is capped to fit the model's context).
   3. Embed the diff and query Pinecone for the 8 most relevant code chunks from that repository.
   4. Ask the model to write the review from the PR details, diff and retrieved context.
   5. Post the review as a comment on the pull request.
   6. Save the review and mark it completed. If any step fails for good, the review is marked failed.
5. Reviews appear in the dashboard under Pull Requests.

## Tech stack

- Next.js 16 and React 19
- Tailwind CSS and shadcn/ui
- better-auth for GitHub sign-in
- Prisma 7 with PostgreSQL
- Inngest for background jobs
- Octokit for the GitHub App and API
- OpenAI for reviews, Pinecone for vector search
- Deployed on Vercel

## Getting started

Requirements: Node.js, pnpm, a PostgreSQL database, a GitHub App, an OpenAI API key and a Pinecone index.

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000.

## Environment variables

Create a `.env` file in the project root:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_URL` | Base URL used by better-auth |
| `NEXT_PUBLIC_APP_URL` | Public base URL of the app |
| `GITHUB_APP_ID` | GitHub App ID |
| `GITHUB_APP_SLUG` | GitHub App slug, used for the install link |
| `GITHUB_APP_CLIENT_ID` | GitHub App client ID (sign-in) |
| `GITHUB_APP_CLIENT_SECRET` | GitHub App client secret (sign-in) |
| `GITHUB_WEBHOOK_SECRET` | Secret used to verify GitHub webhooks |
| `GITHUB_APP_PRIVATE_KEY` | GitHub App private key (PEM contents), used on Vercel |
| `GITHUB_APP_PRIVATE_KEY_PATH` | Path to the private key file, used locally |
| `OPENAI_API_KEY` | OpenAI API key |
| `PINECONE_API_KEY` | Pinecone API key |
| `PINECONE_INDEX_NAME` | Pinecone index name |

Never commit your GitHub App private key.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm build` | Generate the Prisma client and build for production |
| `pnpm start` | Run the production build |
| `pnpm lint` | Run ESLint |
