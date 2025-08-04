"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import { ToastContainer, Bounce } from "react-toastify";

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
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss={false}
        pauseOnHover={false}
        draggable
        theme="light"
        transition={Bounce}
      />

      <Header activeTab={getActiveTab()} />
      {children}
    </>
  );
}
