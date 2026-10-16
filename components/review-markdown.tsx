"use client";

import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import "streamdown/styles.css";

export function ReviewMarkdown({
    content,
    isAnimating = false,
}: {
    content: string;
    isAnimating?: boolean;
}) {
    return (
        <Streamdown
            mode={isAnimating ? undefined : "static"}
            plugins={{ code }}
            isAnimating={isAnimating}
            className="text-sm leading-relaxed [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_code]:text-[0.9em]"
        >
            {content}
        </Streamdown>
    );
}
