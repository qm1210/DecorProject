"use client";

import Table, { TableRef } from "@/components/Table";
import CategoriesContainer from "@/components/CategoriesContainer";
import { useState, useEffect, useRef } from "react";
import { fetchCategoryNames } from "@/services/CategoryData";
import useQuoteStore from "@/store/CartStore";
import { useExport } from "@/hooks/useExport";

const Categories = () => {
  const [tab, setTab] = useState<string>("search");
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const tableRef = useRef<TableRef>(null);
  const { listedProducts, totalPrice } = useQuoteStore();
  const { exportToCSV, exportToPDF, exportToImage } = useExport();

  useEffect(() => {
    fetchCategoryNames()
      .then((data) => {
        setCategories(data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to fetch categories");
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleExportPDF = async () => {
    if (listedProducts.length === 0) {
      alert("Chưa có sản phẩm nào để xuất PDF!");
      return;
    }

    if (tab === "table") {
      // Sử dụng ref từ Table component (với filter/sort)
      tableRef.current?.exportToPDF();
    } else {
      // Sử dụng hook từ Categories page (toàn bộ products)
      exportToPDF(listedProducts, totalPrice);
    }
  };

  const handleExportCSV = () => {
    if (listedProducts.length === 0) {
      alert("Chưa có sản phẩm nào để xuất CSV!");
      return;
    }

    if (tab === "table") {
      // Sử dụng ref từ Table component (với filter/sort)
      tableRef.current?.exportToCSV();
    } else {
      // Sử dụng hook từ Categories page (toàn bộ products)
      exportToCSV(listedProducts, totalPrice);
    }
  };

  const handleExportImage = async () => {
    if (listedProducts.length === 0) {
      alert("Chưa có sản phẩm nào để xuất ảnh!");
      return;
    }

    if (tab === "table") {
      tableRef.current?.exportToImage();
    } else {
      await exportToImage(listedProducts, totalPrice);
    }
  };

  return (
    <div className="bg-white min-h-screen py-8 px-2 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Categories
        </h1>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white font-semibold shadow hover:cursor-pointer hover:bg-green-700 transition-all duration-200"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Xuất CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white font-semibold shadow hover:cursor-pointer hover:bg-red-700 transition-all duration-200"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            Xuất PDF
          </button>
          <button
            onClick={handleExportImage}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white font-semibold shadow hover:cursor-pointer hover:bg-blue-700 transition-all duration-200"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Xuất ảnh
          </button>
        </div>
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
            Danh mục
          </li>
          <li
            onClick={() => setTab("table")}
            className={`px-5 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer ${
              tab === "table"
                ? "bg-blue-600 text-white shadow"
                : "text-gray-700 hover:bg-blue-100"
            }`}
          >
            Bảng báo giá
          </li>
        </ul>
      </div>

      {tab === "search" ? (
        <CategoriesContainer
          categories={categories}
          loading={loading}
          error={error}
        />
      ) : (
        <Table ref={tableRef} />
      )}
    </div>
  );
};

export default Categories;
