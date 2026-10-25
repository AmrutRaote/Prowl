import {App} from "@octokit/app";
import {Octokit} from "@octokit/rest";
import { readFileSync } from "fs";
import { resolve } from "path";

// Vercel: key contents in GITHUB_APP_PRIVATE_KEY. Local: .pem file via GITHUB_APP_PRIVATE_KEY_PATH.
const privateKey =
  process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, "\n") ??
  readFileSync(
    resolve(
      /* turbopackIgnore: true */ process.cwd(),
      process.env.GITHUB_APP_PRIVATE_KEY_PATH!,
    ),
    "utf8",
  );

export const githubApp = new App({
  appId: process.env.GITHUB_APP_ID!,
  privateKey,
  Octokit,
  webhooks: {
    secret: process.env.GITHUB_WEBHOOK_SECRET!,
  },
});

export function getInstallationOctokit(installationId: number) {
  return githubApp.getInstallationOctokit(installationId);
}
