import { ThemeToggle } from "@/components/ui/theme-toggle";


export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative flex flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-black">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>
            <div className="w-full max-w-sm rounded-2xl border border-border bg-white p-8 dark:bg-zinc-950">
                {children}
            </div>
        </div>
    );
}
