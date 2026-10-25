import {App} from "@octokit/app";
import {Octokit} from "@octokit/rest";
import { readFileSync } from "fs";
import { resolve } from "path";

// Vercel: key contents in GITHUB_APP_PRIVATE_KEY. Local: .pem file via GITHUB_APP_PRIVATE_KEY_PATH.
// Env UIs often mangle PEM line breaks (spaces, literal \n, quotes); rebuild a clean PEM.
function normalizePem(raw: string) {
  const text = raw.replace(/\\n/g, "\n").replace(/^["']|["']$/g, "").trim();
  const match = text.match(/-----BEGIN ([A-Z ]+)-----([\s\S]*?)-----END \1-----/);
  if (!match) return text;
  const body = match[2].replace(/\s+/g, "");
  return `-----BEGIN ${match[1]}-----\n${body.match(/.{1,64}/g)!.join("\n")}\n-----END ${match[1]}-----\n`;
}

// Either variable may hold the key itself (PEM text) or, locally, a path to the .pem file.
const keyOrPath =
  process.env.GITHUB_APP_PRIVATE_KEY ?? process.env.GITHUB_APP_PRIVATE_KEY_PATH!;

const privateKey = keyOrPath.includes("BEGIN")
  ? normalizePem(keyOrPath)
  : readFileSync(
      resolve(/* turbopackIgnore: true */ process.cwd(), keyOrPath),
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
