"use client";

import { useState, useEffect, useMemo } from "react";
import axios from "axios";

interface Categories {
  "Danh mục": string;
  "Sản phẩm": [];
}

const removeVietnameseTones = (str: string): string => {
  return str
    .normalize("NFD") // chuyển về Unicode tổ hợp
    .replace(/[\u0300-\u036f]/g, "") // xóa dấu
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
};

// Icon mapping cho từng danh mục
const categoryIcons: { [key: string]: React.ReactNode } = {
  "Tủ bếp": (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="w-12 h-12 text-blue-600"
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
      className="w-12 h-12 text-blue-600"
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
      className="w-12 h-12 text-blue-600"
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
      className="w-12 h-12 text-blue-600"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M5 11a2 2 0 0 1 2 2v2h10v-2a2 2 0 1 1 4 0v4a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-4a2 2 0 0 1 2 -2z" />
      <path d="M5 11v-5a3 3 0 0 1 3 -3h8a3 3 0 0 1 3 3v5" />
      <path d="M6 19v2" />
      <path d="M18 19v2" />
    </svg>
  ),
};

const CategoriesContainer: React.FC = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    const fetchCategories = async (): Promise<void> => {
      try {
        setLoading(true);
        const response = await axios.get<Categories[]>(
          "/data/bao_gia_noi_that_grouped_danh_muc_simple.json"
        );

        const danhMucList: string[] = Array.from(
          new Set(response.data.map((item) => item["Danh mục"]))
        ).filter(Boolean);

        setCategories(danhMucList);
        setError(null);
      } catch (err) {
        console.error("Lỗi khi load JSON:", err);
        setError("Không thể tải dữ liệu danh mục");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Filter danh mục dựa trên search term
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) {
      return categories;
    }
    return categories.filter((category) =>
      removeVietnameseTones(category).includes(
        removeVietnameseTones(searchTerm)
      )
    );
  }, [categories, searchTerm]);

  const handleCategoryClick = (categoryName: string): void => {
    console.log(`Clicked on category: ${categoryName}`);
    // TODO: Navigate to category detail page
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = (): void => {
    setSearchTerm("");
  };

  return (
    <div className="bg-white min-h-screen py-8 px-2 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-6">
          {/* Sidebar trái */}
          <aside className="hidden md:block w-56 bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-3">Sản phẩm đã chọn</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>- Tủ bếp gỗ MDF</li>
              <li>- Lavabo đá granite</li>
              <li>- Gương LED</li>
            </ul>
          </aside>

          {/* Nội dung chính */}
          <main className="flex-1 space-y-6">
            <div className="bg-blue-100 rounded-lg shadow p-4">
              <h3 className="text-xl font-bold text-blue-800 mb-2">
                Tổng chi phí:
              </h3>
              <p className="text-3xl font-bold text-blue-900">45.000.000đ</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {loading ? (
                <div className="col-span-full text-center text-gray-400 py-8">
                  <div className="animate-pulse">Đang tải danh mục...</div>
                </div>
              ) : error ? (
                <div className="col-span-full text-center text-red-500 py-8">
                  {error}
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="col-span-full text-center text-gray-400 py-8">
                  {searchTerm
                    ? `Không tìm thấy danh mục nào cho "${searchTerm}"`
                    : "Không có danh mục nào."}
                </div>
              ) : (
                filteredCategories.map((name, index) => (
                  <div
                    key={index}
                    onClick={() => handleCategoryClick(name)}
                    className="aspect-square bg-white rounded-lg shadow hover:shadow-lg transition-all cursor-pointer flex flex-col items-center justify-center text-center p-4 border hover:border-blue-500"
                  >
                    {/* Hiển thị icon dựa trên tên danh mục */}
                    {categoryIcons[name] || categoryIcons["default"]}

                    <h4 className="text-sm font-bold text-gray-800 mt-1">
                      {name}
                    </h4>
                  </div>
                ))
              )}
            </div>
          </main>

          {/* Sidebar phải - Chỉ có search ở đây */}
          <aside className="hidden lg:block w-64 bg-white rounded-lg shadow p-4 space-y-4">
            <h2 className="text-lg font-semibold mb-3">Tìm kiếm & Lọc</h2>
            {/* Search input với icon clear */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Tìm theo tên danh mục..."
                className="w-full border rounded px-3 py-2 pr-8 text-sm focus:outline-none focus:ring focus:ring-blue-200"
              />
              {searchTerm && (
                <button
                  onClick={handleClearSearch}
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
            {/* Hiển thị kết quả search */}
            {searchTerm && (
              <div className="text-xs text-gray-600">
                Tìm thấy {filteredCategories.length} danh mục
              </div>
            )}{" "}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CategoriesContainer;
