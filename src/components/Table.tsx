"use client";

import {
  useState,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useRouter } from "next/navigation";
import formatCurrency from "@/utils/FormatCurrency";
import useQuoteStore from "@/store/CartStore";
import removeVietnameseTones from "@/utils/RemoveVietnamese";
import { useExport } from "@/hooks/useExport";

export interface TableRef {
  exportToCSV: () => void;
  exportToPDF: () => void;
  exportToImage: () => void;
}

const Table = forwardRef<TableRef>((props, ref) => {
  const {
    totalPrice,
    listedProducts,
    loadFromStorage,
    removeProduct,
    updateQuantity,
  } = useQuoteStore();

  const { exportToCSV, exportToPDF, exportToImage } = useExport();

  // State for filtering and sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");
  const [selectedCore, setSelectedCore] = useState<string>("all");
  const [selectedCover, setSelectedCover] = useState<string>("all");

  // Load data from localStorage when component mounts
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Get unique values for filters
  const categories = useMemo(() => {
    return Array.from(
      new Set(listedProducts.map((p) => p.category || "Khác"))
    ).sort();
  }, [listedProducts]);

  const subcategories = useMemo(() => {
    return Array.from(
      new Set(listedProducts.map((p) => p.subcategory || "Khác"))
    ).sort();
  }, [listedProducts]);

  const cores = useMemo(() => {
    return Array.from(
      new Set(listedProducts.map((p) => p.core || "Khác"))
    ).sort();
  }, [listedProducts]);

  const covers = useMemo(() => {
    return Array.from(
      new Set(listedProducts.map((p) => p.cover || "Khác"))
    ).sort();
  }, [listedProducts]);

  // Filter products based on search and filters
  const filteredProducts = useMemo(() => {
    let filtered = listedProducts;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory
      );
    }

    // Filter by subcategory
    if (selectedSubcategory !== "all") {
      filtered = filtered.filter(
        (product) => product.subcategory === selectedSubcategory
      );
    }

    // Filter by core
    if (selectedCore !== "all") {
      filtered = filtered.filter((product) => product.core === selectedCore);
    }

    // Filter by cover
    if (selectedCover !== "all") {
      filtered = filtered.filter((product) => product.cover === selectedCover);
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = removeVietnameseTones(searchTerm.toLowerCase());
      filtered = filtered.filter((product) => {
        return (
          removeVietnameseTones(product.name?.toLowerCase() || "").includes(
            searchLower
          ) ||
          removeVietnameseTones(product.unit?.toLowerCase() || "").includes(
            searchLower
          ) ||
          removeVietnameseTones(product.category?.toLowerCase() || "").includes(
            searchLower
          ) ||
          removeVietnameseTones(
            product.subcategory?.toLowerCase() || ""
          ).includes(searchLower) ||
          removeVietnameseTones(product.core?.toLowerCase() || "").includes(
            searchLower
          ) ||
          removeVietnameseTones(product.cover?.toLowerCase() || "").includes(
            searchLower
          ) ||
          removeVietnameseTones(product.note?.toLowerCase() || "").includes(
            searchLower
          )
        );
      });
    }

    return filtered;
  }, [
    listedProducts,
    selectedCategory,
    selectedSubcategory,
    selectedCore,
    selectedCover,
    searchTerm,
  ]);

  // Sort products
  const sortedProducts = useMemo(() => {
    if (!sortColumn) return filteredProducts;

    return [...filteredProducts].sort((a, b) => {
      let valA: string | number, valB: string | number;

      switch (sortColumn) {
        case "name":
          valA = a.name || "";
          valB = b.name || "";
          break;
        case "price":
          valA = a.price || 0;
          valB = b.price || 0;
          break;
        case "quantity":
          valA = a.quantity || 0;
          valB = b.quantity || 0;
          break;
        case "total":
          valA = (a.price || 0) * (a.quantity || 0);
          valB = (b.price || 0) * (b.quantity || 0);
          break;
        case "category":
          valA = a.category || "Khác";
          valB = b.category || "Khác";
          break;
        case "subcategory":
          valA = a.subcategory || "Khác";
          valB = b.subcategory || "Khác";
          break;
        case "core":
          valA = a.core || "Khác";
          valB = b.core || "Khác";
          break;
        case "cover":
          valA = a.cover || "Khác";
          valB = b.cover || "Khác";
          break;
        default:
          return 0;
      }

      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }

      return sortDirection === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [filteredProducts, sortColumn, sortDirection]);

  // Calculate filtered total
  const filteredTotal = useMemo(() => {
    return sortedProducts.reduce(
      (sum, product) => sum + (product.price || 0) * (product.quantity || 0),
      0
    );
  }, [sortedProducts]);

  // Event handlers
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeProduct(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedSubcategory("all");
    setSelectedCore("all");
    setSelectedCover("all");
    setSortColumn("");
  };

  // Expose methods to parent component using the custom hook
  useImperativeHandle(ref, () => ({
    exportToCSV: () => exportToCSV(sortedProducts, filteredTotal),
    exportToPDF: () => exportToPDF(sortedProducts, filteredTotal),
    exportToImage: () => exportToImage(sortedProducts, filteredTotal),
  }));

  return (
    <div className="bg-gray-50 min-h-screen py-4 sm:py-6 lg:py-8 px-2 sm:px-4 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">
                Danh sách sản phẩm đã chọn
              </p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
            <div className="bg-blue-600 text-white p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl shadow-lg">
              <h3 className="text-xs sm:text-sm font-medium text-blue-100 mb-1 sm:mb-2">
                Tổng tiền
              </h3>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold break-words">
                {formatCurrency(totalPrice)}
              </p>
            </div>
            <div className="bg-green-600 text-white p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl shadow-lg">
              <h3 className="text-xs sm:text-sm font-medium text-green-100 mb-1 sm:mb-2">
                Sản phẩm
              </h3>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold">
                {listedProducts.length}
              </p>
            </div>
            <div className="bg-purple-600 text-white p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl shadow-lg">
              <h3 className="text-xs sm:text-sm font-medium text-purple-100 mb-1 sm:mb-2">
                Danh mục
              </h3>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold">
                {categories.length}
              </p>
            </div>
            <div className="bg-orange-600 text-white p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl shadow-lg">
              <h3 className="text-xs sm:text-sm font-medium text-orange-100 mb-1 sm:mb-2">
                Đang hiển thị
              </h3>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold">
                {sortedProducts.length}
              </p>
            </div>
          </div>

          {/* Filters and Actions */}
          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 mb-4">
              {/* Search */}
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tìm kiếm
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm sản phẩm..."
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Danh mục
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tất cả danh mục</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subcategory Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Đầu mục
                </label>
                <select
                  value={selectedSubcategory}
                  onChange={(e) => setSelectedSubcategory(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tất cả đầu mục</option>
                  {subcategories.map((subcategory) => (
                    <option key={subcategory} value={subcategory}>
                      {subcategory}
                    </option>
                  ))}
                </select>
              </div>

              {/* Core Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên cốt
                </label>
                <select
                  value={selectedCore}
                  onChange={(e) => setSelectedCore(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tất cả loại cốt</option>
                  {cores.map((core) => (
                    <option key={core} value={core}>
                      {core}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cover Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên phủ
                </label>
                <select
                  value={selectedCover}
                  onChange={(e) => setSelectedCover(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tất cả loại phủ</option>
                  {covers.map((cover) => (
                    <option key={cover} value={cover}>
                      {cover}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions row */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <span className="text-xs sm:text-sm text-gray-600">
                Hiển thị {sortedProducts.length} trong tổng số{" "}
                {listedProducts.length} sản phẩm
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearAllFilters}
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-800 border hover:cursor-pointer border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Xóa bộ lọc
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="pdf-export-container bg-white rounded-lg shadow-sm border overflow-hidden">
          {listedProducts.length === 0 ? (
            <div className="p-6 sm:p-8 lg:p-12 text-center">
              <svg
                className="w-12 sm:w-16 h-12 sm:h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                Chưa có sản phẩm nào
              </h3>
              <p className="text-sm sm:text-base text-gray-500 mb-4">
                Bạn chưa chọn sản phẩm nào. Hãy quay lại trang danh mục để chọn
                sản phẩm.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        onClick={() => handleSort("category")}
                        className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Danh mục</span>
                          {sortColumn === "category" && (
                            <span className="text-blue-600">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("subcategory")}
                        className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Đầu mục</span>
                          {sortColumn === "subcategory" && (
                            <span className="text-blue-600">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("core")}
                        className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Tên cốt</span>
                          {sortColumn === "core" && (
                            <span className="text-blue-600">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("cover")}
                        className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Tên phủ</span>
                          {sortColumn === "cover" && (
                            <span className="text-blue-600">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Đơn vị
                      </th>
                      <th
                        onClick={() => handleSort("price")}
                        className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Đơn giá</span>
                          {sortColumn === "price" && (
                            <span className="text-blue-600">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("quantity")}
                        className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Số lượng</span>
                          {sortColumn === "quantity" && (
                            <span className="text-blue-600">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("total")}
                        className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Thành tiền</span>
                          {sortColumn === "total" && (
                            <span className="text-blue-600">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedProducts.length > 0 ? (
                      sortedProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-2 sm:px-4 py-2 sm:py-4">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 break-words">
                              {product.category || "Khác"}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-4">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 break-words">
                              {product.subcategory || "Khác"}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-4">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 break-words">
                              {product.core || "Khác"}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-4">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 break-words">
                              {product.cover || "Khác"}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-4 text-xs sm:text-sm text-gray-700">
                            {product.unit || "-"}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-4 text-xs sm:text-sm font-semibold text-green-600 break-words">
                            {formatCurrency(product.price || 0)}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-4">
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              <button
                                onClick={() =>
                                  handleQuantityChange(
                                    product.id,
                                    (product.quantity || 0) - 1
                                  )
                                }
                                className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 hover:cursor-pointer text-gray-600 transition-colors text-sm"
                              >
                                -
                              </button>
                              <span className="text-xs sm:text-sm font-medium text-gray-900 min-w-[1.5rem] sm:min-w-[2rem] text-center">
                                {product.quantity || 0}
                              </span>
                              <button
                                onClick={() =>
                                  handleQuantityChange(
                                    product.id,
                                    (product.quantity || 0) + 1
                                  )
                                }
                                className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 hover:cursor-pointer text-gray-600 transition-colors text-sm"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-4 text-xs sm:text-sm font-bold text-blue-600 break-words">
                            {formatCurrency(
                              (product.price || 0) * (product.quantity || 0)
                            )}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-4">
                            <button
                              onClick={() => removeProduct(product.id)}
                              className="text-red-600 hover:text-red-800 hover:cursor-pointer transition-colors"
                              title="Xóa sản phẩm"
                            >
                              <svg
                                className="w-3 h-3 sm:w-4 sm:h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-4 sm:px-6 py-8 sm:py-12 text-center"
                        >
                          <div className="flex flex-col items-center">
                            <svg
                              className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mb-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.175-5.5-2.709"
                              />
                            </svg>
                            <p className="text-gray-500 text-sm sm:text-lg">
                              {searchTerm ||
                              selectedCategory !== "all" ||
                              selectedSubcategory !== "all" ||
                              selectedCore !== "all" ||
                              selectedCover !== "all"
                                ? "Không tìm thấy sản phẩm phù hợp với bộ lọc"
                                : "Không có sản phẩm nào"}
                            </p>
                            <button
                              onClick={clearAllFilters}
                              className="mt-2 text-blue-600 hover:text-blue-800 text-xs sm:text-sm"
                            >
                              Xóa bộ lọc
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              {sortedProducts.length > 0 && (
                <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-t">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="text-xs sm:text-sm text-gray-600">
                      Hiển thị {sortedProducts.length} trong tổng số{" "}
                      {listedProducts.length} sản phẩm
                    </div>
                    <div className="text-base sm:text-lg font-bold text-gray-900 break-words">
                      Tổng cộng hiển thị: {formatCurrency(filteredTotal)}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
});

Table.displayName = "Table";

export default Table;
