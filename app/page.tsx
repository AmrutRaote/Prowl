import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { authClient } from "@/lib/auth-client";

export default function Home() {
  const { data: session } = authClient.useSession
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <ThemeToggle />
      <Button onClick={() => authClient.signOut()}>
        Signout
      </Button>
    </div>
  );
}
