import {App} from "@octokit/app";
import {Octokit} from "@octokit/rest";
import { readFileSync } from "fs";
import { resolve } from "path";

const privateKeyPath = resolve(
  /* turbopackIgnore: true */ process.cwd(),
  process.env.GITHUB_APP_PRIVATE_KEY_PATH!,
);

export const githubApp = new App({
  appId: process.env.GITHUB_APP_ID!,
  privateKey: readFileSync(privateKeyPath, "utf8"),
  Octokit,
  webhooks: {
    secret: process.env.GITHUB_WEBHOOK_SECRET!,
  },
});

export function getInstallationOctokit(installationId: number) {
  return githubApp.getInstallationOctokit(installationId);
}
