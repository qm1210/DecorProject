"use client";

import Table from "@/components/Table";
import CategoriesContainer from "@/components/CategoriesContainer";
import { useState } from "react";

const Categories = () => {
  const [tab, setTab] = useState<string>("search");

  const handleExportPDF = () => {
    console.log("Export PDF clicked");
    // TODO: Implement PDF export functionality
  };

  return (
    <div className="bg-white min-h-screen py-8 px-2 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Categories</h1>
        <button
          onClick={handleExportPDF}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-white font-semibold shadow-md hover:bg-red-700 hover:cursor-pointer transition-all duration-300 ease-in-out"
        >
          Export PDF
        </button>
      </div>
      <div>
        <ul className="flex space-x-2 mb-6 border border-gray-200 rounded-lg p-1 bg-gray-50 shadow-inner">
          <li
            onClick={() => setTab("search")}
            className={`px-5 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer ${
              tab === "search"
                ? "bg-blue-600 text-white shadow"
                : "text-gray-700 hover:bg-blue-100"
            }`}
          >
            🔍 Tìm kiếm
          </li>
          <li
            onClick={() => setTab("table")}
            className={`px-5 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer ${
              tab === "table"
                ? "bg-blue-600 text-white shadow"
                : "text-gray-700 hover:bg-blue-100"
            }`}
          >
            📊 Bảng
          </li>
        </ul>
      </div>
      {tab === "search" ? <CategoriesContainer /> : <Table />}
    </div>
  );
};

export default Categories;
