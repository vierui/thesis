"use client"
import React, { useState } from "react";
import SidebarPrompt from "@/components/prompt/sidebar-prompt";

const PromptLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen w-full justify-center items-center overflow-hidden">
      <SidebarPrompt/>
      <div className="w-full h-full">{children}</div>
    </div>
  );
};

export default PromptLayout;
