"use client";

import { useState, useEffect } from "react";
import formatCurrency from "@/utils/FormatCurrency";
import removeVietnameseTones from "@/utils/RemoveVietnamese";
import { toast } from "react-toastify";
import AddProductForm from "./AddProductForm";
import useQuoteStore from "@/store/CartStore";

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
  isManual?: boolean; // Flag để đánh dấu sản phẩm nhập tay
}

interface ProductSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: FlattenedRow[];
  setProducts?: (products: FlattenedRow[]) => void;
}

const ProductSelectionModal = ({
  isOpen,
  onClose,
  products,
  setProducts,
}: ProductSelectionModalProps) => {
  const [modalSearch, setModalSearch] = useState("");
  const [sortColumn, setSortColumn] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000]);
  const [selectedDauMuc, setSelectedDauMuc] = useState<string[]>([]);
  const [selectedTenCot, setSelectedTenCot] = useState<string[]>([]);
  const [selectedTenPhu, setSelectedTenPhu] = useState<string[]>([]);
  const [checkedRows, setCheckedRows] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [localProducts, setLocalProducts] = useState<FlattenedRow[]>([]);

  const handleShowForm = () => {
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
  };

  const getRowKey = (row: FlattenedRow) =>
    `${row.id}-${row["Tên cốt"]}-${row["Tên phủ"]}`;

  // Load manual products từ localStorage và merge với products
  useEffect(() => {
    if (isOpen) {
      // Lấy sản phẩm nhập tay từ localStorage
      const manualProducts: FlattenedRow[] = JSON.parse(
        localStorage.getItem("manualProducts") || "[]"
      );

      // Merge products gốc với sản phẩm nhập tay
      const originalProducts = products.map((p) => ({ ...p, isManual: false }));
      const manualWithFlag = manualProducts.map((p) => ({
        ...p,
        isManual: true,
      }));

      // Loại bỏ trùng lặp nếu có
      const filteredOriginal = originalProducts.filter(
        (p) =>
          !manualWithFlag.some(
            (m) =>
              m["Tên cốt"] === p["Tên cốt"] &&
              m["Tên phủ"] === p["Tên phủ"] &&
              m["Đầu mục"] === p["Đầu mục"]
          )
      );

      const all = [...filteredOriginal, ...manualWithFlag];
      setLocalProducts(all);

      // Cập nhật khoảng giá
      if (all.length > 0) {
        const prices = all.map((item) => item["Đơn giá"]);
        setPriceRange([Math.min(...prices), Math.max(...prices)]);
      }
    }
  }, [isOpen, products]);

  useEffect(() => {
    if (isOpen) {
      // Reset checked state when modal opens
      setCheckedRows([]);
      setSelectedDauMuc([]);
      setSelectedTenCot([]);
      setSelectedTenPhu([]);
      setModalSearch("");
      setSortColumn("");
      setSortDirection("asc");
    }
  }, [isOpen]);

  // Get unique values for filters từ localProducts
  const uniqueDauMuc = [
    ...new Set(localProducts.map((item) => item["Đầu mục"])),
  ];
  const uniqueTenCot = [
    ...new Set(localProducts.map((item) => item["Tên cốt"])),
  ];
  const uniqueTenPhu = [
    ...new Set(localProducts.map((item) => item["Tên phủ"])),
  ];

  // Filter data
  const filteredData = localProducts.filter((row) => {
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

  // Sort products
  const sortedProducts = [...filteredData].sort((a, b) => {
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

  const handleCheckAll = () => {
    if (
      sortedProducts.length > 0 &&
      sortedProducts.every((row) => checkedRows.includes(getRowKey(row)))
    ) {
      setCheckedRows([]);
    } else {
      setCheckedRows(sortedProducts.map((row) => getRowKey(row)));
    }
  };

  const handleCheckRow = (rowKey: string) => {
    if (checkedRows.includes(rowKey)) {
      setCheckedRows((prev) => prev.filter((id) => id !== rowKey));
    } else {
      setCheckedRows((prev) => [...prev, rowKey]);
    }
  };

  const handleAddSelected = () => {
    if (setProducts) {
      // Lấy tất cả sản phẩm đã chọn
      const selectedRows = localProducts.filter((p) =>
        checkedRows.includes(getRowKey(p))
      );

      // Tạo bản sao products hiện tại
      const updatedProducts = [...products];

      selectedRows.forEach((row) => {
        const key = getRowKey(row);
        const existedIndex = updatedProducts.findIndex(
          (p) => getRowKey(p) === key
        );
        if (existedIndex !== -1) {
          // Nếu đã có, tăng số lượng
          updatedProducts[existedIndex] = {
            ...updatedProducts[existedIndex],
            ["Số lượng"]: (updatedProducts[existedIndex]["Số lượng"] || 0) + 1,
          };
        } else {
          // Nếu chưa có (sản phẩm nhập tay), thêm mới vào
          updatedProducts.push({ ...row, ["Số lượng"]: 1 });
        }
      });

      setProducts(updatedProducts);
    }
    setCheckedRows([]);
    onClose();
    toast.success("Thêm sản phẩm thành công");
  };

  const handleDeleteSelected = () => {
    const selectedLocal = localProducts.filter((p) =>
      checkedRows.includes(getRowKey(p))
    );

    // Chỉ cho xóa sản phẩm nhập tay (có flag isManual = true)
    const canDeleteAll = selectedLocal.every((item) => item.isManual);

    if (!canDeleteAll) {
      toast.error(
        "Chỉ được xóa sản phẩm nhập tay, không thể xóa sản phẩm gốc!"
      );
      return;
    }

    // Lọc ra các sản phẩm còn lại
    const remainingProducts = localProducts.filter(
      (p) => !checkedRows.includes(getRowKey(p))
    );

    // Cập nhật localProducts
    setLocalProducts(remainingProducts);

    // Cập nhật localStorage (chỉ lưu sản phẩm nhập tay)
    const manualProductsToSave = remainingProducts.filter((p) => p.isManual);
    localStorage.setItem(
      "manualProducts",
      JSON.stringify(manualProductsToSave)
    );

    // Xóa sản phẩm khỏi store nếu đang được chọn
    selectedLocal.forEach((product) => {
      // Tạo productId giống như trong DetailPage
      const productId = `${product.id}-${product["Tên cốt"]}-${product["Tên phủ"]}`;

      // Xóa khỏi store Zustand
      const { removeProduct } = useQuoteStore.getState();
      removeProduct(productId);
    });

    // Xóa localStorage của category quantities nếu có
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("category-") && key.endsWith("-quantities")) {
        const savedQuantities = JSON.parse(localStorage.getItem(key) || "{}");
        let hasChanges = false;

        selectedLocal.forEach((product) => {
          const itemKey = `${product.id}-${product["Tên cốt"]}-${product["Tên phủ"]}`;
          if (savedQuantities[itemKey]) {
            delete savedQuantities[itemKey];
            hasChanges = true;
          }
        });

        if (hasChanges) {
          if (Object.keys(savedQuantities).length > 0) {
            localStorage.setItem(key, JSON.stringify(savedQuantities));
          } else {
            localStorage.removeItem(key);
          }
        }
      }
    });

    // Dispatch custom event để thông báo cho các component khác
    window.dispatchEvent(
      new CustomEvent("localStorageChanged", {
        detail: {
          key: "manualProducts",
          action: "delete",
          data: manualProductsToSave,
          deletedProducts: selectedLocal,
        },
      })
    );

    // Cập nhật products ở cha nếu có
    if (setProducts) {
      const updatedProducts = products.filter(
        (p) => !checkedRows.includes(getRowKey(p))
      );
      setProducts(updatedProducts);
    }

    setCheckedRows([]);
    toast.success("Xóa sản phẩm thành công");
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <AddProductForm
        isOpen={showForm}
        onClose={handleCloseForm}
        onAdd={(newProduct) => {
          // Kiểm tra trùng lặp
          const isDuplicate = localProducts.some(
            (item) =>
              item["Tên cốt"] === newProduct["Tên cốt"] &&
              item["Tên phủ"] === newProduct["Tên phủ"] &&
              item["Đầu mục"] === newProduct["Đầu mục"]
          );

          if (isDuplicate) {
            toast.error("Sản phẩm đã tồn tại!");
            return;
          }

          // Tạo sản phẩm mới với metadata
          const productWithMeta: FlattenedRow = {
            ...newProduct,
            id: Date.now().toString(),
            "Số lượng": 1,
            "Đơn giá gốc": newProduct["Đơn giá"],
            "Lợi nhuận (%)": 0,
            "Đơn vị mặc định": newProduct["Đơn vị"],
            "Ngày tạo": new Date().toISOString(),
            isManual: true, // Đánh dấu là sản phẩm nhập tay
          };

          // Cập nhật localStorage
          const currentManualProducts = JSON.parse(
            localStorage.getItem("manualProducts") || "[]"
          );
          currentManualProducts.push(productWithMeta);
          localStorage.setItem(
            "manualProducts",
            JSON.stringify(currentManualProducts)
          );

          // Cập nhật localProducts ngay lập tức
          setLocalProducts((prev) => [...prev, productWithMeta]);

          // Cập nhật products ở cha nếu có
          if (setProducts) {
            setProducts([...products, productWithMeta]);
          }

          handleCloseForm();
          toast.success("Thêm sản phẩm thành công");
        }}
      />

      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity pointer-events-auto animate-fadeIn"
        onClick={onClose}
        aria-label="Đóng modal"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl sm:rounded-2xl pointer-events-auto shadow-2xl w-full max-w-full sm:max-w-4xl lg:max-w-6xl xl:max-w-[1200px] max-h-[95vh] h-[95vh] overflow-hidden border border-gray-200 animate-modalScale flex flex-col lg:flex-row">
        {/* Filter Panel */}
        <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-l bg-gray-50 flex flex-col min-h-0 order-1 lg:order-2 max-h-[50vh] lg:max-h-full overflow-auto">
          <div className="p-3 sm:p-4 border-b bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
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
              <h3 className="font-medium text-base sm:text-lg">Bộ lọc</h3>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden text-gray-500 hover:text-black text-2xl rounded-full w-8 h-8 flex items-center justify-center transition-colors"
              title="Đóng"
            >
              ×
            </button>
          </div>

          <div className="flex-1 overflow-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
            {/* Search */}
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
              <p className="font-bold mb-2 sm:mb-3 text-sm sm:text-base">
                Tìm kiếm
              </p>
              <input
                type="text"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Price Range */}
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
              <p className="font-bold mb-2 sm:mb-3 text-sm sm:text-base">
                Khoảng giá
              </p>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs sm:text-sm text-gray-600 min-w-6 sm:min-w-7">
                    Từ:
                  </span>
                  <input
                    type="range"
                    min={
                      localProducts.length > 0
                        ? Math.min(
                            ...localProducts.map((item) => item["Đơn giá"])
                          )
                        : 0
                    }
                    max={
                      localProducts.length > 0
                        ? Math.max(
                            ...localProducts.map((item) => item["Đơn giá"])
                          )
                        : 10000000
                    }
                    value={priceRange[0]}
                    onChange={(e) =>
                      setPriceRange([parseInt(e.target.value), priceRange[1]])
                    }
                    className="flex-1 accent-blue-500"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs sm:text-sm text-gray-600 min-w-6 sm:min-w-7">
                    Đến:
                  </span>
                  <input
                    type="range"
                    min={
                      localProducts.length > 0
                        ? Math.min(
                            ...localProducts.map((item) => item["Đơn giá"])
                          )
                        : 0
                    }
                    max={
                      localProducts.length > 0
                        ? Math.max(
                            ...localProducts.map((item) => item["Đơn giá"])
                          )
                        : 10000000
                    }
                    value={priceRange[1]}
                    onChange={(e) =>
                      setPriceRange([priceRange[0], parseInt(e.target.value)])
                    }
                    className="flex-1 accent-blue-500"
                  />
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  {formatCurrency(priceRange[0])} -{" "}
                  {formatCurrency(priceRange[1])}
                </div>
              </div>
            </div>

            {/* Filter by Đầu mục */}
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
              <p className="font-bold mb-2 sm:mb-3 text-sm sm:text-base">
                Đầu mục
              </p>
              <div className="space-y-1 sm:space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
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
                      className="rounded accent-blue-500 w-4 h-4 sm:w-5 sm:h-5"
                    />
                    <span className="text-xs sm:text-base">{item}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter by Tên cốt */}
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
              <p className="font-bold mb-2 sm:mb-3 text-sm sm:text-base">
                Tên cốt
              </p>
              <div className="space-y-1 sm:space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
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
                      className="rounded accent-blue-500 w-4 h-4 sm:w-5 sm:h-5"
                    />
                    <span className="text-xs sm:text-base">{item}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter by Tên phủ */}
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
              <p className="font-bold mb-2 sm:mb-3 text-sm sm:text-base">
                Tên phủ
              </p>
              <div className="space-y-1 sm:space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
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
                      className="rounded accent-blue-500 w-4 h-4 sm:w-5 sm:h-5"
                    />
                    <span className="text-xs sm:text-base">{item}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
              <button
                onClick={() => {
                  setModalSearch("");
                  if (localProducts.length > 0) {
                    const prices = localProducts.map((item) => item["Đơn giá"]);
                    setPriceRange([Math.min(...prices), Math.max(...prices)]);
                  }
                  setSelectedDauMuc([]);
                  setSelectedTenCot([]);
                  setSelectedTenPhu([]);
                }}
                className="w-full px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded hover:cursor-pointer hover:bg-gray-200 transition-colors text-sm sm:text-base"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 order-2 lg:order-1 overflow-auto">
          <div className="p-3 sm:p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white gap-2">
            <h2 className="text-lg sm:text-xl font-bold">Chọn sản phẩm</h2>
            <button
              onClick={onClose}
              className="hidden lg:flex text-gray-500 hover:cursor-pointer hover:text-black text-3xl sm:text-4xl rounded-full w-9 h-9 items-center justify-center transition-colors"
              title="Đóng"
            >
              ×
            </button>
          </div>

          <div className="p-3 sm:p-4 border-b bg-gray-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p className="text-gray-600 text-sm sm:text-base">
              {sortedProducts.length} sản phẩm có thể chọn
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded transition text-sm sm:text-base hover:cursor-pointer hover:bg-green-700"
                onClick={handleShowForm}
              >
                Thêm sản phẩm mới
              </button>
              <button
                className={`px-3 sm:px-4 py-2 bg-red-600 text-white rounded transition text-sm sm:text-base ${
                  checkedRows.length === 0
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:cursor-pointer hover:bg-red-700"
                }`}
                disabled={checkedRows.length === 0}
                onClick={handleDeleteSelected}
              >
                Xóa đã chọn ({checkedRows.length})
              </button>
              <button
                className={`px-3 sm:px-4 py-2 bg-blue-600 text-white rounded transition text-sm sm:text-base ${
                  checkedRows.length === 0
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:cursor-pointer hover:bg-blue-700"
                }`}
                disabled={checkedRows.length === 0}
                onClick={handleAddSelected}
              >
                Thêm đã chọn ({checkedRows.length})
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-white">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-xs sm:text-sm min-w-[600px] sm:min-w-[700px]">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    {[
                      "Đầu mục",
                      "Tên cốt",
                      "Tên phủ",
                      "Đơn vị",
                      "Đơn giá",
                      "Ghi chú",
                    ].map((col) => (
                      <th
                        key={col}
                        onClick={() => handleSort(col)}
                        className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium text-gray-600 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap text-xs sm:text-sm"
                      >
                        {col}
                        {sortColumn === col &&
                          (sortDirection === "asc" ? " ↑" : " ↓")}
                      </th>
                    ))}
                    <th className="px-1 sm:px-2 py-2 sm:py-3 text-center whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={
                          sortedProducts.length > 0 &&
                          sortedProducts.every((row) =>
                            checkedRows.includes(getRowKey(row))
                          )
                        }
                        onChange={handleCheckAll}
                        className="w-4 h-4 sm:w-5 sm:h-5 accent-blue-500"
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProducts.length ? (
                    sortedProducts.map((row) => {
                      const rowKey = getRowKey(row);
                      return (
                        <tr
                          key={rowKey}
                          className={`border-b hover:bg-blue-50 transition ${
                            row.isManual ? "bg-blue-100" : ""
                          }`}
                        >
                          <td className="px-2 sm:px-4 py-2 sm:py-3 break-words text-xs sm:text-sm">
                            {row["Đầu mục"]}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 break-words text-xs sm:text-sm">
                            {row["Tên cốt"]}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 break-words text-xs sm:text-sm">
                            {row["Tên phủ"]}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
                            {row["Đơn vị"]}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 font-semibold text-green-600 text-xs sm:text-sm">
                            {formatCurrency(row["Đơn giá"])}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-500 break-words text-xs sm:text-sm">
                            {row["Ghi chú"] || "-"}
                          </td>
                          <td className="px-1 sm:px-2 py-2 sm:py-4 text-center">
                            <input
                              type="checkbox"
                              checked={checkedRows.includes(rowKey)}
                              onChange={() => handleCheckRow(rowKey)}
                              className="w-4 h-4 sm:w-5 sm:h-5 accent-blue-500"
                            />
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-gray-500 text-sm"
                      >
                        Không tìm thấy sản phẩm phù hợp với bộ lọc
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style jsx global>{`
        @keyframes modalScaleIn {
          0% {
            opacity: 0;
            transform: scale(0.95) translateY(30px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-modalScale {
          animation: modalScaleIn 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ProductSelectionModal;
