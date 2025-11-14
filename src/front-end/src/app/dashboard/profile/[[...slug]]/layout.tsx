import React from "react";
import { Toaster } from "@/components/ui/toaster";

const PromptLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-screen w-screen overflow-auto">
      {children}
      <Toaster />
    </div>
  );
};

export default PromptLayout;
