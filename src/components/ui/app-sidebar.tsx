import {
  ShoppingCart,
  Microscope,
  Syringe,
  Dna,
  Package,
  Stethoscope,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
  {
    title: "Pathology",
    url: "#",
    icon: Microscope,
  },
  {
    title: "Immunology",
    url: "#",
    icon: Syringe,
  },
  {
    title: "Microbiology",
    url: "#",
    icon: Dna,
  },
  {
    title: "Purchase Order",
    url: "#",
    icon: ShoppingCart,
  },
  {
    title: "Stock Levels",
    url: "#",
    icon: Package,
  },
  {
    title: "Disposition",
    url: "#",
    icon: Stethoscope,
  },
];

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-base">
            [icon] ALIMS
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="h-10">
              {items.map((item) => (
                <SidebarMenuItem key={item.title} className="h-10 text-xl">
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
