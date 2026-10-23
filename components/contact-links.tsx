import { HugeiconsIcon } from "@hugeicons/react"
import { GithubIcon, Linkedin01Icon, Mail01Icon } from "@hugeicons/core-free-icons"

const links = [
  { label: "GitHub", icon: GithubIcon, href: "https://github.com/AmrutRaote" },
  { label: "LinkedIn", icon: Linkedin01Icon, href: "https://www.linkedin.com/in/amrutraote" },
  { label: "Email", icon: Mail01Icon, href: "mailto:amrutclg@gmail.com" },
]

export function ContactLinks({ className = "" }: { className?: string }) {
  return (
    <nav
      aria-label="Contact"
      className={`flex items-center justify-center gap-4 text-xs text-muted-foreground ${className}`}
    >
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target={l.href.startsWith("http") ? "_blank" : undefined}
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:text-foreground hover:underline"
        >
          <HugeiconsIcon icon={l.icon} strokeWidth={2} className="size-4" />
          {l.label}
        </a>
      ))}
    </nav>
  )
}
