import React from "react";
import SidebarDashboard from "@/components/dashboard/sidebar-dashboard";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex items-center h-screen overflow-hidden">
      <div className="absolute top-0 left-0 z-10">
        <SidebarDashboard />
      </div>
      <div className="relative w-full h-full z-0">{children}</div>
    </div>
  );
};

export default DashboardLayout;
