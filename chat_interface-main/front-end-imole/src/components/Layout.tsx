import React from "react";


interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {

  return (
    <div className="flex h-screen bg-light">
      <main className="w-full">{children}</main>
    </div>
  );
};

export default Layout;
