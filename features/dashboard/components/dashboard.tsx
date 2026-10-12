"use client";

import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { OverviewTab } from "@/features/dashboard/components/overview-tab";
import { PullRequestsTab } from "@/features/dashboard/components/pull-requests-tab";
import { RepositoriesTab } from "@/features/dashboard/components/repositories-tab";
import { SettingsTab } from "@/features/dashboard/components/settings-tab";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { useState } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AppSidebar, type DashboardTab, } from "@/components/app-sidebar";

const tabLabels: Record<DashboardTab, string> = {
    overview: "Overview",
    repositories: "Repositories",
    "pull-requests": "Pull Requests",
    settings: "Settings",
};

type User = {
    name: string;
    email: string;
    image?: string | null;
};

type Installation = {
    id: string;
    githubInstallationId: string;
    targetLogin: string;
    targetType: string;
    status: string;
    repositorySelection: string;
    repoCount: number;
};

export function Dashboard({
    user,
    installations,
}: {
    user: User;
    installations: Installation[];
}) {
    const [activeTab, setActiveTab] = useState<DashboardTab>("overview");

    return (
        <SidebarProvider>
            <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator
                        orientation="vertical"
                        className="mr-2 data-vertical:h-4 data-vertical:self-auto"
                    />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbPage>{tabLabels[activeTab]}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <div className="ml-auto flex items-center gap-2">
                        <ThemeToggle />
                        <SignOutButton />
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4">
                    {activeTab === "overview" && <OverviewTab user={user} />}
                    {activeTab === "repositories" && <RepositoriesTab />}
                    {activeTab === "pull-requests" && <PullRequestsTab />}
                    {activeTab === "settings" && (
                        <SettingsTab user={user} installations={installations} />
                    )}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
