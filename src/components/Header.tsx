"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface HeaderProps {
  activeTab?: string;
}

export default function Header({ activeTab }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsMenuOpen(false); // Đóng menu mobile sau khi navigate
  };

  return (
    <nav className="bg-blue-600 shadow-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          {/* Mobile menu button */}
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="relative inline-flex items-center justify-center rounded-md p-2 text-white hover:bg-blue-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-colors duration-200"
            >
              <span className="sr-only">Open main menu</span>
              {!isMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Brand name and navigation */}
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            {/* Brand name */}
            <div className="flex shrink-0 items-center">
              <h1 className="text-xl font-bold text-white">NỘI THẤT YOTECH</h1>
            </div>

            {/* Desktop navigation */}
            <div className="hidden sm:ml-6 sm:block">
              <div className="flex space-x-4">
                <button
                  className={`rounded-md px-3 py-2 text-sm font-medium text-gray-200 hover:bg-blue-800 hover:text-white hover:cursor-pointer transition-colors duration-300 ease-in-out ${
                    activeTab === "home" ? "bg-blue-900" : ""
                  }`}
                  onClick={() => handleNavigation("/")}
                >
                  Trang chủ
                </button>
                <button
                  className={`rounded-md px-3 py-2 text-sm font-medium text-gray-200 hover:bg-blue-800 hover:text-white hover:cursor-pointer transition-colors duration-300 ease-in-out ${
                    activeTab === "categories" ? "bg-blue-900" : ""
                  }`}
                  onClick={() => handleNavigation("/categories")}
                >
                  Danh mục
                </button>
              </div>
            </div>
          </div>

          {/* Right side buttons */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            {/* Notification button */}
            <button
              type="button"
              className="relative rounded-full bg-white p-1 text-black hover:bg-gray-100 hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 transition-colors duration-200"
            >
              <span className="sr-only">View notifications</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                />
              </svg>
            </button>

            {/* Profile button */}
            <div className="relative ml-3">
              <button
                type="button"
                className="relative flex rounded-full bg-gray-800 text-sm hover:bg-gray-700 hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 transition-colors duration-200"
              >
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center">
                  <span className="text-sm font-medium text-black">U</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`sm:hidden transition-all duration-300 ease-in-out ${
          isMenuOpen
            ? "block opacity-100 transform translate-y-0"
            : "hidden opacity-0 transform -translate-y-2"
        } bg-blue-600`}
      >
        <div className="space-y-1 px-2 pb-3 pt-2">
          <button
            onClick={() => handleNavigation("/")}
            className={`block w-full text-left rounded-md px-3 py-2 text-base font-medium text-white hover:bg-blue-800 transition-colors duration-200 ${
              activeTab === "home" ? "bg-blue-900" : ""
            }`}
          >
            Trang chủ
          </button>
          <button
            onClick={() => handleNavigation("/categories")}
            className={`block w-full text-left rounded-md px-3 py-2 text-base font-medium text-white hover:bg-blue-800 transition-colors duration-200 ${
              activeTab === "categories" ? "bg-blue-900" : ""
            }`}
          >
            Danh mục
          </button>
        </div>
      </div>
    </nav>
  );
}
