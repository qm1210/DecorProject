"use client";

import { useState, useEffect } from "react";
import formatCurrency from "@/utils/FormatCurrency";
import removeVietnameseTones from "@/utils/RemoveVietnamese";

// Flattened table row interface
interface FlattenedRow {
  id: string;
  "Đầu mục": string;
  "Tên cốt": string;
  "Tên phủ": string;
  "Đơn vị": string;
  "Đơn giá": number;
  "Ghi chú": string;
  "Số lượng": number;
  "Đơn giá gốc": number;
  "Lợi nhuận (%)": number;
  "Đơn vị mặc định": string;
  "Ngày tạo": string;
}

interface ProductSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: FlattenedRow[];
  onSelectProduct: (product: FlattenedRow) => void;
}

const ProductSelectionModal = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
}: ProductSelectionModalProps) => {
  const [modalSearch, setModalSearch] = useState("");
  const [sortColumn, setSortColumn] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000]);
  const [selectedDauMuc, setSelectedDauMuc] = useState<string[]>([]);
  const [selectedTenCot, setSelectedTenCot] = useState<string[]>([]);
  const [selectedTenPhu, setSelectedTenPhu] = useState<string[]>([]);

  // Reset filters only when modal opens
  useEffect(() => {
    if (isOpen) {
      setModalSearch("");
      setSortColumn("");
      setSortDirection("asc");
      setSelectedDauMuc([]);
      setSelectedTenCot([]);
      setSelectedTenPhu([]);
      if (products.length > 0) {
        const prices = products.map((item) => item["Đơn giá"]);
        setPriceRange([Math.min(...prices), Math.max(...prices)]);
      }
    }
    // Chỉ để đúng 1 dependency là isOpen
  }, [isOpen]);

  // Get unique values for filters
  const uniqueDauMuc = [...new Set(products.map((item) => item["Đầu mục"]))];
  const uniqueTenCot = [...new Set(products.map((item) => item["Tên cốt"]))];
  const uniqueTenPhu = [...new Set(products.map((item) => item["Tên phủ"]))];

  // Filter data
  const filteredData = products.filter((row) => {
    const term = removeVietnameseTones(modalSearch.toLowerCase());

    const match = (value: string) =>
      removeVietnameseTones(value.toLowerCase()).includes(term);

    const matchesSearch =
      !term ||
      match(row["Đầu mục"]) ||
      match(row["Tên cốt"]) ||
      match(row["Tên phủ"]) ||
      match(row["Ghi chú"] ?? "");

    const matchesPrice =
      row["Đơn giá"] >= priceRange[0] && row["Đơn giá"] <= priceRange[1];

    const matchesDauMuc =
      selectedDauMuc.length === 0 || selectedDauMuc.includes(row["Đầu mục"]);

    const matchesTenCot =
      selectedTenCot.length === 0 || selectedTenCot.includes(row["Tên cốt"]);

    const matchesTenPhu =
      selectedTenPhu.length === 0 || selectedTenPhu.includes(row["Tên phủ"]);

    return (
      matchesSearch &&
      matchesPrice &&
      matchesDauMuc &&
      matchesTenCot &&
      matchesTenPhu
    );
  });

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0;
    const valA = a[sortColumn as keyof FlattenedRow];
    const valB = b[sortColumn as keyof FlattenedRow];
    if (typeof valA === "number" && typeof valB === "number") {
      return sortDirection === "asc" ? valA - valB : valB - valA;
    }
    return sortDirection === "asc"
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(col);
      setSortDirection("asc");
    }
  };

  const handleFilterToggle = (
    value: string,
    selected: string[],
    setter: (values: string[]) => void
  ) => {
    if (selected.includes(value)) {
      setter(selected.filter((item) => item !== value));
    } else {
      setter([...selected, value]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity pointer-events-auto"
        onClick={onClose}
        aria-label="Đóng modal"
      />
      {/* Modal */}
      <div className="relative bg-white rounded-2xl pointer-events-auto shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-gray-200 animate-fadeIn flex">
        {/* Left: Table */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-4 border-b flex justify-between items-center bg-white">
            <h2 className="text-xl font-bold">Chọn sản phẩm</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-black text-2xl rounded-full w-9 h-9 flex items-center justify-center transition-colors"
              title="Đóng"
            >
              ×
            </button>
          </div>
          <div className="p-4 border-b bg-gray-50">
            <p className="text-gray-600">
              {sortedData.length} sản phẩm có thể chọn
            </p>
          </div>
          <div className="flex-1 overflow-auto bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  {[
                    "Đầu mục",
                    "Tên cốt",
                    "Tên phủ",
                    "Đơn vị",
                    "Đơn giá",
                    "Ghi chú",
                    "Thao tác",
                  ].map((col) => (
                    <th
                      key={col}
                      onClick={() =>
                        col !== "Thao tác" && col !== "" && handleSort(col)
                      }
                      className={`px-4 py-3 text-left font-medium text-gray-600 ${
                        col !== "Thao tác" && col !== ""
                          ? "cursor-pointer hover:bg-gray-100 select-none"
                          : ""
                      }`}
                    >
                      {col}
                      {sortColumn === col &&
                        col !== "Thao tác" &&
                        (sortDirection === "asc" ? " ↑" : " ↓")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedData.length ? (
                  sortedData.map((row, i) => (
                    <tr
                      key={`${row.id}-${i}`}
                      className="border-b hover:bg-blue-50 transition"
                    >
                      <td className="px-4 py-2">{row["Đầu mục"]}</td>
                      <td className="px-4 py-2">{row["Tên cốt"]}</td>
                      <td className="px-4 py-2">{row["Tên phủ"]}</td>
                      <td className="px-4 py-2">{row["Đơn vị"]}</td>
                      <td className="px-4 py-2 font-semibold text-green-600">
                        {formatCurrency(row["Đơn giá"])}
                      </td>
                      <td className="px-4 py-2 text-gray-500">
                        {row["Ghi chú"] || "-"}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                          onClick={() => onSelectProduct(row)}
                        >
                          Chọn
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      Không tìm thấy sản phẩm phù hợp với bộ lọc
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* Right: Filter */}
        <div className="w-80 border-l bg-gray-50 flex flex-col">
          <div className="p-4 border-b bg-white flex items-center gap-2">
            <span className="text-blue-500">
              <svg
                width={20}
                height={20}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.59L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <h3 className="font-medium text-lg">Bộ lọc</h3>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {/* Search */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-medium mb-3">Tìm kiếm</h3>
              <input
                type="text"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder="Tìm kiếm sản phẩm, chất liệu..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {/* Price Range */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-medium mb-3">Khoảng giá</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 min-w-7">Từ:</span>
                  <input
                    type="range"
                    min={Math.min(...products.map((item) => item["Đơn giá"]))}
                    max={Math.max(...products.map((item) => item["Đơn giá"]))}
                    value={priceRange[0]}
                    onChange={(e) =>
                      setPriceRange([parseInt(e.target.value), priceRange[1]])
                    }
                    className="flex-1 accent-blue-500"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 min-w-7">Đến:</span>
                  <input
                    type="range"
                    min={Math.min(...products.map((item) => item["Đơn giá"]))}
                    max={Math.max(...products.map((item) => item["Đơn giá"]))}
                    value={priceRange[1]}
                    onChange={(e) =>
                      setPriceRange([priceRange[0], parseInt(e.target.value)])
                    }
                    className="flex-1 accent-blue-500"
                  />
                </div>
                <div className="text-sm text-gray-600">
                  {formatCurrency(priceRange[0])} -{" "}
                  {formatCurrency(priceRange[1])}
                </div>
              </div>
            </div>
            {/* Filter by Đầu mục */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-medium mb-3">Đầu mục</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {uniqueDauMuc.map((item) => (
                  <label key={item} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedDauMuc.includes(item)}
                      onChange={() =>
                        handleFilterToggle(
                          item,
                          selectedDauMuc,
                          setSelectedDauMuc
                        )
                      }
                      className="rounded accent-blue-500"
                    />
                    <span className="text-sm">{item}</span>
                  </label>
                ))}
              </div>
            </div>
            {/* Filter by Tên cốt */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-medium mb-3">Tên cốt</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {uniqueTenCot.map((item) => (
                  <label key={item} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedTenCot.includes(item)}
                      onChange={() =>
                        handleFilterToggle(
                          item,
                          selectedTenCot,
                          setSelectedTenCot
                        )
                      }
                      className="rounded accent-blue-500"
                    />
                    <span className="text-sm">{item}</span>
                  </label>
                ))}
              </div>
            </div>
            {/* Filter by Tên phủ */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-medium mb-3">Tên phủ</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {uniqueTenPhu.map((item) => (
                  <label key={item} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedTenPhu.includes(item)}
                      onChange={() =>
                        handleFilterToggle(
                          item,
                          selectedTenPhu,
                          setSelectedTenPhu
                        )
                      }
                      className="rounded accent-blue-500"
                    />
                    <span className="text-sm">{item}</span>
                  </label>
                ))}
              </div>
            </div>
            {/* Clear Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <button
                onClick={() => {
                  setModalSearch("");
                  const prices = products.map((item) => item["Đơn giá"]);
                  setPriceRange([Math.min(...prices), Math.max(...prices)]);
                  setSelectedDauMuc([]);
                  setSelectedTenCot([]);
                  setSelectedTenPhu([]);
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSelectionModal;
