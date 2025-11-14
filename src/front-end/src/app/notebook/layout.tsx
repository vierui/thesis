import React from "react";

const NotebookLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-screen overflow-hidden bg-gray-50">
      {children}
    </div>
  );
};

export default NotebookLayout; 