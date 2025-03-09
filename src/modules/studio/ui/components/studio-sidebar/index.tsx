"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { LogOutIcon, VideoIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SidebarStudioHeader } from "./studio-sidebar-header";

export const StudioSidebar = () => {
  const pathname = usePathname();
  return (
    <Sidebar className="pt-16 z-40 " collapsible="icon">
      <SidebarContent className="bg-background">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarStudioHeader />
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === "/studio"}
                  tooltip="Content"
                  asChild
                >
                  <Link href="/studio" className="flex items-center gap-4">
                    <VideoIcon size={5} />
                    <span className="text-sm">Content</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <Separator />
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Exit Studio" asChild>
                  <Link href="/" className="flex items-center gap-4">
                    <LogOutIcon size={5} />
                    <span className="text-sm">Exit Studio</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
