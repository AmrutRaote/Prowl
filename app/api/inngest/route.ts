
import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { indexRepository } from "@/inngest/functions";
import { reviewPullRequest } from "@/inngest/review-pull-request";

// The AI review step can take up to 5 minutes (Hobby max is 300, Pro allows up to 800).
export const maxDuration = 300;

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [indexRepository, reviewPullRequest],
});
