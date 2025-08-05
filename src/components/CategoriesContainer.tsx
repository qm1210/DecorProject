"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import formatCurrency from "@/utils/FormatCurrency";
import useQuoteStore from "@/store/CartStore";
import Swal from "sweetalert2";
import type { FlattenedRow } from "@/models/Product.model";

interface CategoriesContainerProps {
  categories: string[];
  loading: boolean;
  error: string | null;
}

// Chuyển tiếng Việt có dấu thành không dấu và slug
const toSlug = (str: string): string => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
};

// Function để extract danh mục từ tên sản phẩm
const extractCategory = (productName: string): string => {
  // Tách phần đầu tiên trước dấu " - " làm danh mục
  const parts = productName.split(" - ");
  return parts[0] || "Khác";
};

// Icon tương ứng với một số danh mục
const categoryIcons: { [key: string]: React.ReactNode } = {
  "Tủ bếp": (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-blue-600"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M12 7h.01" />
      <path d="M15 7h.01" />
      <path d="M9 7h.01" />
      <path d="M5 3a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2z" />
      <path d="M9 15h6" />
      <path d="M5 11h14" />
    </svg>
  ),
  "Kệ tivi": (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-blue-600"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M8.707 2.293l3.293 3.292l3.293 -3.292a1 1 0 0 1 1.32 -.083l.094 .083a1 1 0 0 1 0 1.414l-2.293 2.293h4.586a3 3 0 0 1 3 3v9a3 3 0 0 1 -3 3h-14a3 3 0 0 1 -3 -3v-9a3 3 0 0 1 3 -3h4.585l-2.292 -2.293a1 1 0 0 1 1.414 -1.414m10.293 5.707h-2a1 1 0 0 0 -1 1v9a1 1 0 0 0 1 1h2a1 1 0 0 0 1 -1v-9a1 1 0 0 0 -1 -1" />
      <path d="M18 14a1 1 0 0 1 .993 .883l.007 .127a1 1 0 0 1 -1.993 .117l-.007 -.127a1 1 0 0 1 1 -1" />
      <path d="M18 11a1 1 0 0 1 .993 .883l.007 .127a1 1 0 0 1 -1.993 .117l-.007 -.127a1 1 0 0 1 1 -1" />
    </svg>
  ),
  "Bàn ăn": (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-blue-600"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M16 7l2 9m-10 -9l-2 9m-1 -9h14m2 5h-18" />
    </svg>
  ),
  default: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-blue-600"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M5 11a2 2 0 0 1 2 2v2h10v-2a2 2 0 1 1 4 0v4a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-4a2 2 0 0 1 2 -2z" />
      <path d="M5 11v-5a3 3 0 0 1 3 -3h8a3 3 0 0 1 3 3v5" />
      <path d="M6 19v2" />
      <path d="M18 19v2" />
    </svg>
  ),
};

const CategoriesContainer: React.FC<CategoriesContainerProps> = ({
  categories,
  loading,
  error,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const { totalPrice, listedProducts, removeProduct, loadFromStorage } =
    useQuoteStore();

  // Load dữ liệu từ localStorage khi component mount
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Thêm useEffect này để lắng nghe custom event
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === "quoteItems" ||
        e.key === "manualProducts" ||
        e.key?.startsWith("category-")
      ) {
        loadFromStorage();
      }
    };

    const handleCustomStorageChange = (e: CustomEvent) => {
      // Lấy lại listedProducts mới nhất bên trong effect
      const products = useQuoteStore.getState().listedProducts;
      if (e.detail?.action === "delete" && e.detail?.deletedProducts) {
        (e.detail.deletedProducts as FlattenedRow[]).forEach((product) => {
          const productId = `${product.id}-${product["Tên cốt"]}-${product["Tên phủ"]}`;
          const existingProduct = products.find((p) => p.id === productId);
          if (existingProduct) {
            removeProduct(productId);
          }
        });
      }
      loadFromStorage();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(
      "localStorageChanged",
      handleCustomStorageChange as EventListener
    );

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "localStorageChanged",
        handleCustomStorageChange as EventListener
      );
    };
  }, [loadFromStorage, removeProduct]);

  // Group products by category và sắp xếp
  const groupedProducts = useMemo(() => {
    const groups: { [category: string]: typeof listedProducts } = {};

    listedProducts.forEach((product) => {
      const category = extractCategory(product.name);
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(product);
    });

    // Sắp xếp các danh mục theo alphabet
    const sortedCategories = Object.keys(groups).sort();

    // Sắp xếp sản phẩm trong mỗi danh mục theo tên
    sortedCategories.forEach((category) => {
      groups[category].sort((a, b) => a.name.localeCompare(b.name));
    });

    return { groups, sortedCategories };
  }, [listedProducts]);

  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    return categories.filter((cat) => toSlug(cat).includes(toSlug(searchTerm)));
  }, [categories, searchTerm]);

  const handleClick = (name: string) => {
    const slug = toSlug(name);
    router.push(`/categories/${slug}`);
  };

  const handleRemoveProduct = (productId: string) => {
    removeProduct(productId);

    // Cập nhật localStorage sau khi xóa
    const updatedProducts = listedProducts.filter((p) => p.id !== productId);
    localStorage.setItem("quoteItems", JSON.stringify(updatedProducts));
  };

  const handleClearAll = async () => {
    const result = await Swal.fire({
      title: "Bạn có chắc chắn?",
      text: "Bạn có chắc chắn muốn xóa tất cả sản phẩm đã chọn?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) return;

    // Xóa tất cả sản phẩm
    listedProducts.forEach((product) => removeProduct(product.id));

    // Xóa localStorage
    localStorage.removeItem("quoteItems");

    // Xóa tất cả localStorage của các category
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("category-") && key.endsWith("-quantities")) {
        localStorage.removeItem(key);
      }
    });

    Swal.fire("Đã xóa!", "Tất cả sản phẩm đã được xóa.", "success");
  };

  return (
    <div className="bg-white min-h-screen py-4 sm:py-6 lg:py-8 px-2 sm:px-4 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Tìm kiếm - trên cùng cho tablet (768px-1024px) */}
        <aside className="hidden md:block lg:hidden w-full bg-white rounded-lg shadow p-4 mb-4">
          <h2 className="text-lg font-semibold mb-3">Tìm kiếm</h2>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên danh mục..."
              className="w-full border rounded px-3 py-2 pr-8 text-sm focus:outline-none focus:ring focus:ring-blue-200"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-0 pr-2 flex items-center"
              >
                <svg
                  className="h-4 w-4 text-gray-400 hover:text-gray-600"
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
          {searchTerm && (
            <div className="text-xs text-gray-600 mt-2">
              Tìm thấy {filteredCategories.length} danh mục
            </div>
          )}
        </aside>

        {/* Container chính với layout responsive */}
        <div className="flex flex-col md:flex-row lg:flex-row gap-4 sm:gap-6">
          {/* Tìm kiếm - mobile */}
          <aside className="block md:hidden order-1 mb-2">
            <div className="w-full bg-white rounded-lg shadow p-3 sm:p-4 space-y-3 sm:space-y-4">
              <h2 className="text-base sm:text-lg font-semibold">Tìm kiếm</h2>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm theo tên danh mục..."
                  className="w-full border rounded px-3 py-2 pr-8 text-sm focus:outline-none focus:ring focus:ring-blue-200"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute inset-y-0 right-0 pr-2 flex items-center"
                  >
                    <svg
                      className="h-4 w-4 text-gray-400 hover:text-gray-600"
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
              {searchTerm && (
                <div className="text-xs text-gray-600">
                  Tìm thấy {filteredCategories.length} danh mục
                </div>
              )}
            </div>
          </aside>

          {/* Sidebar trái - desktop và tablet */}
          <aside className="hidden md:block w-56 bg-white rounded-lg shadow p-4 min-w-[280px] order-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Sản phẩm đã chọn</h2>
              {listedProducts.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-sm text-red-500 hover:text-red-700 hover:cursor-pointer underline"
                  title="Xóa tất cả"
                >
                  Xóa tất cả
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {listedProducts.length === 0 ? (
                <div className="text-gray-400 text-sm">
                  Chưa chọn sản phẩm nào.
                </div>
              ) : (
                <div className="space-y-4">
                  {groupedProducts.sortedCategories.map((categoryName) => (
                    <div key={categoryName} className="space-y-2">
                      <h3 className="text-1xl font-semibold text-blue-700 border-b border-blue-200 pb-1">
                        {categoryName} (
                        {groupedProducts.groups[categoryName].length})
                      </h3>
                      <ul className="space-y-2">
                        {groupedProducts.groups[categoryName].map(
                          (product, idx) => (
                            <li
                              key={`${categoryName}-${idx}`}
                              className="flex items-center justify-between group pl-2"
                            >
                              <span className="flex-1">
                                <div className="font-medium text-sm text-gray-800">
                                  {product.name.replace(
                                    `${categoryName} - `,
                                    ""
                                  )}
                                </div>
                                <div className="text-gray-500 text-sm">
                                  SL: {product.quantity} ×{" "}
                                  {formatCurrency(product.price)}
                                </div>
                                <div className="text-green-600 text-sm font-medium">
                                  ={" "}
                                  {formatCurrency(
                                    product.price * product.quantity
                                  )}
                                </div>
                              </span>
                              <button
                                onClick={() => handleRemoveProduct(product.id)}
                                className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:cursor-pointer flex-shrink-0"
                                title="Xóa sản phẩm"
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
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {listedProducts.length > 0 && (
              <div className="mt-4 pt-3 border-t">
                <div className="text-sm text-gray-600">
                  Tổng: {listedProducts.length} sản phẩm
                </div>
                <div className="text-sm text-gray-600">
                  {groupedProducts.sortedCategories.length} danh mục
                </div>
              </div>
            )}
          </aside>

          {/* Nội dung chính */}
          <main className="flex-1 flex flex-col gap-4 sm:gap-6 order-2">
            {/* Tổng chi phí */}
            <div className="bg-blue-100 rounded-lg shadow p-3 sm:p-4">
              <h3 className="text-lg sm:text-xl font-bold text-blue-800 mb-2">
                Tổng chi phí:
              </h3>
              <p className="text-2xl sm:text-3xl font-bold text-blue-900">
                {formatCurrency(totalPrice)}
              </p>
            </div>

            {/* Sản phẩm đã chọn - mobile */}
            <aside className="block md:hidden">
              <div className="w-full bg-white rounded-lg shadow p-3 sm:p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base sm:text-lg font-semibold">
                    Sản phẩm đã chọn
                  </h2>
                  {listedProducts.length > 0 && (
                    <button
                      onClick={handleClearAll}
                      className="text-sm text-red-500 hover:text-red-700 hover:cursor-pointer underline"
                      title="Xóa tất cả"
                    >
                      Xóa tất cả
                    </button>
                  )}
                </div>
                <div className="max-h-80 sm:max-h-96 overflow-y-auto">
                  {listedProducts.length === 0 ? (
                    <div className="text-gray-400 text-sm">
                      Chưa chọn sản phẩm nào.
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {groupedProducts.sortedCategories.map((categoryName) => (
                        <div key={categoryName} className="space-y-2">
                          <h3 className="text-sm sm:text-base font-semibold text-blue-700 border-b border-blue-200 pb-1">
                            {categoryName} (
                            {groupedProducts.groups[categoryName].length})
                          </h3>
                          <ul className="space-y-2">
                            {groupedProducts.groups[categoryName].map(
                              (product, idx) => (
                                <li
                                  key={`${categoryName}-${idx}`}
                                  className="flex items-center justify-between group pl-2"
                                >
                                  <span className="flex-1">
                                    <div className="font-medium text-sm text-gray-800">
                                      {product.name.replace(
                                        `${categoryName} - `,
                                        ""
                                      )}
                                    </div>
                                    <div className="text-gray-500 text-sm">
                                      SL: {product.quantity} ×{" "}
                                      {formatCurrency(product.price)}
                                    </div>
                                    <div className="text-green-600 text-sm font-medium">
                                      ={" "}
                                      {formatCurrency(
                                        product.price * product.quantity
                                      )}
                                    </div>
                                  </span>
                                  <button
                                    onClick={() =>
                                      handleRemoveProduct(product.id)
                                    }
                                    className="ml-2 opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:cursor-pointer flex-shrink-0"
                                    title="Xóa sản phẩm"
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
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {listedProducts.length > 0 && (
                  <div className="mt-4 pt-3 border-t">
                    <div className="text-sm text-gray-600">
                      Tổng: {listedProducts.length} sản phẩm
                    </div>
                    <div className="text-sm text-gray-600">
                      {groupedProducts.sortedCategories.length} danh mục
                    </div>
                  </div>
                )}
              </div>
            </aside>

            {/* Danh mục */}
            <div>
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4 lg:gap-5">
                {loading ? (
                  <div className="w-full text-center text-gray-400 py-8 animate-pulse">
                    Đang tải danh mục...
                  </div>
                ) : error ? (
                  <div className="w-full text-center text-red-500 py-8">
                    {error}
                  </div>
                ) : filteredCategories.length === 0 ? (
                  <div className="w-full text-center text-gray-400 py-8">
                    {searchTerm
                      ? `Không tìm thấy danh mục nào cho "${searchTerm}"`
                      : "Không có danh mục nào."}
                  </div>
                ) : (
                  filteredCategories.map((name, idx) => {
                    // Kiểm tra danh mục này có sản phẩm được chọn không
                    const isActive = groupedProducts.groups[name]?.length > 0;
                    return (
                      <div
                        key={idx}
                        onClick={() => handleClick(name)}
                        className={`w-[127px] h-[127px] bg-white rounded-lg shadow hover:shadow-lg transition-all cursor-pointer border flex flex-col items-center justify-center text-center p-2 sm:p-3 flex-shrink-0
              ${
                isActive
                  ? "border-blue-700 ring-4 ring-blue-300 bg-blue-200"
                  : "hover:border-blue-500"
              }
            `}
                      >
                        <div className="flex-shrink-0">
                          {categoryIcons[name] || categoryIcons.default}
                        </div>
                        <div className="text-xs sm:text-sm font-semibold mt-1 sm:mt-2 break-words text-center leading-tight">
                          {name}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </main>

          {/* Tìm kiếm - desktop bên phải (chỉ ≥1024px) */}
          <aside className="hidden lg:block w-64 bg-white rounded-lg shadow p-4 space-y-4 order-3">
            <h2 className="text-lg font-semibold mb-3">Tìm kiếm</h2>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên danh mục..."
                className="w-full border rounded px-3 py-2 pr-8 text-sm focus:outline-none focus:ring focus:ring-blue-200"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 pr-2 flex items-center"
                >
                  <svg
                    className="h-4 w-4 text-gray-400 hover:text-gray-600"
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
            {searchTerm && (
              <div className="text-xs text-gray-600">
                Tìm thấy {filteredCategories.length} danh mục
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CategoriesContainer;
