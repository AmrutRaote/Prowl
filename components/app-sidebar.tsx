"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import Image from "next/image"
import { ContactLinks } from "@/components/contact-links"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  DashboardSquare01Icon,
  GitBranchIcon,
  RepositoryIcon,
  Settings05Icon,
} from "@hugeicons/core-free-icons"

const navItems = [
  {
    id: "overview",
    title: "Overview",
    icon: DashboardSquare01Icon,
  },
  {
    id: "repositories",
    title: "Repositories",
    icon: RepositoryIcon,
  },
  {
    id: "pull-requests",
    title: "Pull Requests",
    icon: GitBranchIcon,
  },
  {
    id: "settings",
    title: "Settings",
    icon: Settings05Icon,
  },
] as const

export type DashboardTab = (typeof navItems)[number]["id"]

export function AppSidebar({
  activeTab,
  onTabChange,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  activeTab: DashboardTab
  onTabChange: (tab: DashboardTab) => void
}) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <Image
                src="/prowl-logo.png"
                alt="Prowl"
                width={32}
                height={32}
                className="size-10 object-contain"
              />
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-medium">Prowl</span>
                <span className="text-xs">Dashboard</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeTab === item.id}
                    onClick={() => onTabChange(item.id)}
                  >
                    <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <ContactLinks />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
