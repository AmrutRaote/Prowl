
import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { processTask } from "@/inngest/functions";
// import { indexRepository } from "../../../inngest/functions";
// import { reviewPullRequest } from "../../../inngest/review-pull-request";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processTask],
});