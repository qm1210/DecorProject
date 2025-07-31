"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // map route path → tab name
  const getActiveTab = () => {
    if (pathname === "/") return "home";
    if (pathname.startsWith("/categories")) return "categories";
    return "";
  };

  return (
    <>
      <Header activeTab={getActiveTab()} />
      {children}
    </>
  );
}
