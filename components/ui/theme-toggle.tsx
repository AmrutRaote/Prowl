"use client";

import { Button } from "@/components/ui/button";
import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Button variant="outline" size="icon-sm" aria-label="Toggle theme" />;
  }

  const isDark = theme === "dark";

  return (
    <Button
      variant="outline"
      size="icon-sm"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? (
        <HugeiconsIcon icon={Sun03Icon} strokeWidth={2} />
      ) : (
        <HugeiconsIcon icon={Moon02Icon} strokeWidth={2} />
      )}
    </Button>
  );
}
