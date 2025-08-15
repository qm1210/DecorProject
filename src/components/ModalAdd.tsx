"use client";

import { useState, useEffect, useRef } from "react";
import formatCurrency from "@/utils/FormatCurrency";
import removeVietnameseTones from "@/utils/RemoveVietnamese";
import { toast } from "react-toastify";
import AddProductForm from "./AddProductForm";
import useQuoteStore from "@/store/CartStore";
import type { FlattenedRow } from "@/models/Product.model";
import { createPortal } from "react-dom";

interface ProductSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: FlattenedRow[];
  danhMuc: string;
}

const ProductSelectionModal = ({
  isOpen,
  onClose,
  products,
  danhMuc,
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
  const [openMenuRow, setOpenMenuRow] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [editingProduct, setEditingProduct] = useState<FlattenedRow | null>(
    null
  );
  const [favoriteProducts, setFavoriteProducts] = useState<string[]>([]);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });

  // Load danh sách yêu thích từ localStorage
  useEffect(() => {
    const savedFavorites = JSON.parse(
      localStorage.getItem("favoriteProducts") || "[]"
    );
    setFavoriteProducts(savedFavorites);
  }, []);

  // Load và merge dữ liệu khi modal mở
  useEffect(() => {
    if (isOpen) {
      const manualKey = `manualProducts-${danhMuc}`;
      const manualProducts: FlattenedRow[] = JSON.parse(
        localStorage.getItem(manualKey) || "[]"
      );
      const originalProducts = products.map((p) => ({ ...p, isManual: false }));
      const manualWithFlag = manualProducts.map((p) => ({
        ...p,
        isManual: true,
      }));
      const allProducts = [...originalProducts, ...manualWithFlag];
      setLocalProducts(allProducts);
      setCheckedRows([]);
      setSelectedDauMuc([]);
      setSelectedTenCot([]);
      setSelectedTenPhu([]);
      setModalSearch("");
      setSortColumn("");
      setSortDirection("asc");
    }
  }, [isOpen, products, danhMuc]);

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    if (!openMenuRow) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuRow(null);
      }
    };
    const handleScroll = () => setOpenMenuRow(null);
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [openMenuRow]);

  const getRowKey = (row: FlattenedRow) =>
    `${row.id}-${row["Tên cốt"]}-${row["Tên phủ"]}`;

  const productsInCurrentCategory = localProducts.filter(
    (row: FlattenedRow) => row["Danh mục"] === danhMuc
  );

  const uniqueDauMuc = [
    ...new Set(productsInCurrentCategory.map((item) => item["Đầu mục"])),
  ];
  const uniqueTenCot = [
    ...new Set(productsInCurrentCategory.map((item) => item["Tên cốt"])),
  ];
  const uniqueTenPhu = [
    ...new Set(productsInCurrentCategory.map((item) => item["Tên phủ"])),
  ];

  useEffect(() => {
    if (isOpen) {
      const prices = localProducts
        .filter((row) => row["Danh mục"] === danhMuc)
        .map((item) => item["Đơn giá"]);
      if (prices.length > 0) {
        setPriceRange([Math.min(...prices), Math.max(...prices)]);
      } else {
        setPriceRange([0, 10000000]);
      }
    }
  }, [isOpen, localProducts, danhMuc]);

  const filteredData = productsInCurrentCategory.filter((row) => {
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

  const sortedProducts = [...filteredData].sort((a, b) => {
    const aKey = getRowKey(a);
    const bKey = getRowKey(b);
    const aIsFavorite = favoriteProducts.includes(aKey);
    const bIsFavorite = favoriteProducts.includes(bKey);
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
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
    const { addProduct, updateQuantity, listedProducts } =
      useQuoteStore.getState();
    const selectedRows = localProducts.filter((p) =>
      checkedRows.includes(getRowKey(p))
    );
    let addedCount = 0;
    let updatedCount = 0;
    selectedRows.forEach((row) => {
      const productId = `${row.id}-${row["Tên cốt"]}-${row["Tên phủ"]}`;
      const existingProduct = listedProducts.find((p) => p.id === productId);
      if (existingProduct) {
        updateQuantity(productId, existingProduct.quantity + 1);
        updatedCount++;
      } else {
        const productForStore = {
          id: productId,
          name: `${row["Danh mục"]} - ${row["Đầu mục"]} - ${row["Tên cốt"]} - ${row["Tên phủ"]}`,
          unit: row["Đơn vị"],
          price: row["Đơn giá"],
          quantity: 1,
          category: row["Danh mục"],
          subcategory: row["Đầu mục"],
          core: row["Tên cốt"],
          cover: row["Tên phủ"],
          basePrice: row["Đơn giá gốc"],
          profit: row["Lợi nhuận (%)"],
          note: row["Ghi chú"],
          productId: row.id,
          unit_default: row["Đơn vị mặc định"],
          created_date: row["Ngày tạo"],
        };
        addProduct(productForStore);
        addedCount++;
      }
    });
    setCheckedRows([]);
    onClose();
    if (addedCount > 0 && updatedCount > 0) {
      toast.success(
        `Thêm ${addedCount} sản phẩm mới và tăng số lượng ${updatedCount} sản phẩm có sẵn`
      );
    } else if (addedCount > 0) {
      toast.success(`Thêm ${addedCount} sản phẩm thành công`);
    } else if (updatedCount > 0) {
      toast.success(`Tăng số lượng ${updatedCount} sản phẩm thành công`);
    }
  };

  const handleDeleteSelected = (rowKey?: string) => {
    const keysToDelete = rowKey ? [rowKey] : checkedRows;
    const selectedLocal = localProducts.filter((p) =>
      keysToDelete.includes(getRowKey(p))
    );
    const canDeleteAll = selectedLocal.every((item) => item.isManual);
    if (!canDeleteAll) {
      toast.error("Chỉ được xóa sản phẩm nhập tay!");
      return;
    }
    const remainingProducts = localProducts.filter(
      (p) => !keysToDelete.includes(getRowKey(p))
    );
    const manualProductsToSave = remainingProducts.filter((p) => p.isManual);
    setLocalProducts(remainingProducts);
    const manualKey = `manualProducts-${danhMuc}`;
    localStorage.setItem(manualKey, JSON.stringify(manualProductsToSave));
    const { removeProduct } = useQuoteStore.getState();
    selectedLocal.forEach((product) => {
      const productId = `${product.id}-${product["Tên cốt"]}-${product["Tên phủ"]}`;
      removeProduct(productId);
    });
    setCheckedRows((prev) => prev.filter((key) => !keysToDelete.includes(key)));
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

  const handleToggleFavorite = (rowKey: string) => {
    const updatedFavorites = favoriteProducts.includes(rowKey)
      ? favoriteProducts.filter((key) => key !== rowKey)
      : [...favoriteProducts, rowKey];
    setFavoriteProducts(updatedFavorites);
    localStorage.setItem("favoriteProducts", JSON.stringify(updatedFavorites));
    const action = favoriteProducts.includes(rowKey) ? "bỏ" : "thêm vào";
    toast.success(`Đã ${action} yêu thích!`);
  };

  const handleShowForm = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <AddProductForm
        isOpen={showForm}
        onClose={handleCloseForm}
        onAdd={(newProduct) => {
          const manualKey = `manualProducts-${danhMuc}`;

          if (editingProduct) {
            // Cập nhật sản phẩm đã có
            const oldProductId = `${editingProduct.id}-${editingProduct["Tên cốt"]}-${editingProduct["Tên phủ"]}`;
            const newProductId = `${editingProduct.id}-${newProduct["Tên cốt"]}-${newProduct["Tên phủ"]}`;

            // Cập nhật trong localProducts
            const updated = localProducts.map((item) =>
              getRowKey(item) === getRowKey(editingProduct)
                ? { ...item, ...newProduct }
                : item
            );
            setLocalProducts(updated);

            // Cập nhật localStorage
            const manualProductsToSave = updated.filter((p) => p.isManual);
            localStorage.setItem(
              manualKey,
              JSON.stringify(manualProductsToSave)
            );

            // Cập nhật trong giỏ hàng nếu sản phẩm đang có trong giỏ
            const { listedProducts, removeProduct, addProduct } =
              useQuoteStore.getState();
            const existingCartProduct = listedProducts.find(
              (p) => p.id === oldProductId
            );

            if (existingCartProduct) {
              // Xóa sản phẩm cũ khỏi giỏ hàng
              removeProduct(oldProductId);

              // Thêm sản phẩm mới với thông tin đã cập nhật
              const updatedProductForCart = {
                id: newProductId,
                name: `${danhMuc} - ${newProduct["Đầu mục"]} - ${newProduct["Tên cốt"]} - ${newProduct["Tên phủ"]}`,
                unit: newProduct["Đơn vị"],
                price: newProduct["Đơn giá"],
                quantity: existingCartProduct.quantity, // Giữ nguyên số lượng
                category: danhMuc,
                subcategory: newProduct["Đầu mục"],
                core: newProduct["Tên cốt"],
                cover: newProduct["Tên phủ"],
                basePrice: newProduct["Đơn giá"],
                profit: 0,
                note: newProduct["Ghi chú"],
                productId: editingProduct.id,
                unit_default: newProduct["Đơn vị"],
                created_date: editingProduct["Ngày tạo"],
              };

              addProduct(updatedProductForCart);
              toast.success("Cập nhật sản phẩm thành công");
            }
          } else {
            // Thêm sản phẩm mới
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

            const productWithMeta: FlattenedRow = {
              ...newProduct,
              "Danh mục": danhMuc,
              id: Date.now().toString(),
              "Số lượng": 1,
              "Đơn giá gốc": newProduct["Đơn giá"],
              "Lợi nhuận (%)": 0,
              "Đơn vị mặc định": newProduct["Đơn vị"],
              "Ngày tạo": new Date().toISOString(),
              isManual: true,
            };

            // Cập nhật localStorage
            const currentManualProducts = JSON.parse(
              localStorage.getItem(manualKey) || "[]"
            );
            currentManualProducts.push(productWithMeta);
            localStorage.setItem(
              manualKey,
              JSON.stringify(currentManualProducts)
            );

            // Cập nhật state ngay lập tức
            setLocalProducts((prev) => [...prev, productWithMeta]);

            toast.success("Thêm sản phẩm thành công");
          }
          handleCloseForm();
        }}
        initialData={editingProduct}
        danhMuc={danhMuc}
      />

      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity pointer-events-auto animate-fadeIn"
        onClick={onClose}
        aria-label="Đóng modal"
      />

      {/* Modal */}
      <div
        className="relative bg-white rounded-xl sm:rounded-2xl pointer-events-auto shadow-2xl w-full max-w-full sm:max-w-4xl lg:max-w-6xl xl:max-w-[1200px] max-h-[95vh] h-[95vh] overflow-hidden border border-gray-200 flex flex-col lg:flex-row
    animate-modalOpen"
      >
        {/* Filter Panel */}
        <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-l bg-gray-50 flex flex-col min-h-0 order-1 lg:order-2 max-h-[40vh] lg:max-h-full overflow-auto">
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
                      productsInCurrentCategory.length > 0
                        ? Math.min(
                            ...productsInCurrentCategory.map(
                              (item) => item["Đơn giá"]
                            )
                          )
                        : 0
                    }
                    max={
                      productsInCurrentCategory.length > 0
                        ? Math.max(
                            ...productsInCurrentCategory.map(
                              (item) => item["Đơn giá"]
                            )
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
                      productsInCurrentCategory.length > 0
                        ? Math.min(
                            ...productsInCurrentCategory.map(
                              (item) => item["Đơn giá"]
                            )
                          )
                        : 0
                    }
                    max={
                      productsInCurrentCategory.length > 0
                        ? Math.max(
                            ...productsInCurrentCategory.map(
                              (item) => item["Đơn giá"]
                            )
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
                  if (productsInCurrentCategory.length > 0) {
                    const prices = productsInCurrentCategory.map(
                      (item) => item["Đơn giá"]
                    );
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
            <h2 className="text-lg sm:text-xl font-bold">
              Chọn sản phẩm - {danhMuc}
            </h2>
            <button
              onClick={onClose}
              className="hidden lg:flex text-gray-500 hover:cursor-pointer hover:text-black text-3xl sm:text-4xl rounded-full w-9 h-9 items-center justify-center transition-colors"
              title="Đóng"
            >
              ×
            </button>
          </div>

          <div className="p-3 sm:p-4 border-b bg-gray-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <p className="text-gray-600 text-sm sm:text-base mb-2 sm:mb-0">
              {sortedProducts.length} sản phẩm có thể chọn
            </p>
            <div className="flex flex-row sm:flex-row w-full sm:w-auto gap-2">
              <button
                className="w-full sm:w-auto px-1 sm:px-4 py-2 bg-green-600 text-white rounded transition text-sm sm:text-base hover:cursor-pointer hover:bg-green-700"
                onClick={handleShowForm}
              >
                Thêm sản phẩm mới
              </button>
              <button
                className={`w-full sm:w-auto px-1 sm:px-4 py-2 bg-red-600 text-white rounded transition text-sm sm:text-base hover:cursor-pointer hover:bg-red-700`}
                onClick={() => {
                  setCheckedRows([]);
                }}
              >
                Bỏ đã chọn
              </button>
              <button
                className={`w-full sm:w-auto px-1 sm:px-4 py-2 bg-blue-600 text-white rounded transition text-sm sm:text-base ${
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
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-medium text-gray-600 whitespace-nowrap text-xs sm:text-sm">
                      Thao tác
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
                            row.isManual
                              ? "bg-blue-100"
                              : favoriteProducts.includes(rowKey)
                              ? "bg-red-100"
                              : ""
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
                          <td className="px-1 sm:px-2 py-2 sm:py-4 text-center relative">
                            <button
                              className="p-1 rounded-full hover:bg-gray-200 hover:cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                const rect =
                                  e.currentTarget.getBoundingClientRect();

                                // Tính số nút trong menu
                                const row = localProducts.find(
                                  (r) => getRowKey(r) === rowKey
                                );
                                let menuItemCount = 1; // luôn có nút yêu thích
                                if (row?.isManual) menuItemCount += 2; // có thêm nút sửa và xóa

                                const menuHeight = menuItemCount * 48 + 16; // 48px mỗi nút, 16px padding
                                const windowHeight = window.innerHeight;

                                console.log(
                                  "DEBUG menuHeight:",
                                  menuHeight,
                                  "menuItemCount:",
                                  menuItemCount
                                );

                                let top = rect.bottom + window.scrollY;
                                const left = rect.left + window.scrollX;

                                // Nếu menu tràn xuống dưới thì hiển thị phía trên nút
                                if (
                                  top + menuHeight >
                                  windowHeight + window.scrollY
                                ) {
                                  top =
                                    rect.top +
                                    window.scrollY -
                                    0.75 * menuHeight;
                                }

                                setMenuPosition({
                                  top,
                                  left,
                                });
                                setOpenMenuRow(
                                  openMenuRow === rowKey ? null : rowKey
                                );
                              }}
                              aria-label="Thao tác"
                            >
                              <svg
                                width={20}
                                height={20}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <circle cx="4" cy="10" r="1.5" />
                                <circle cx="10" cy="10" r="1.5" />
                                <circle cx="16" cy="10" r="1.5" />
                              </svg>
                            </button>

                            {/* Menu ngay trong cell */}
                            {openMenuRow === rowKey &&
                              createPortal(
                                <div
                                  ref={menuRef}
                                  style={{
                                    position: "absolute",
                                    top: menuPosition.top,
                                    left: menuPosition.left,
                                    zIndex: 9999,
                                    minWidth: 160,
                                  }}
                                  className="bg-white border border-gray-300 rounded-lg shadow-xl text-left animate-fadeIn"
                                >
                                  {(() => {
                                    const row = localProducts.find(
                                      (r) => getRowKey(r) === openMenuRow
                                    );
                                    if (!row) return null;

                                    const isManual = row?.isManual;
                                    return (
                                      <>
                                        {isManual && (
                                          <>
                                            <button
                                              className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 hover:cursor-pointer hover:bg-blue-50 hover:text-blue-700 text-left rounded-t-lg transition font-medium"
                                              onClick={() => {
                                                setEditingProduct(row);
                                                setShowForm(true);
                                                setOpenMenuRow(null);
                                              }}
                                            >
                                              <svg
                                                width={16}
                                                height={16}
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                                viewBox="0 0 24 24"
                                              >
                                                <path d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13z" />
                                              </svg>
                                              Sửa
                                            </button>
                                            <button
                                              className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 hover:cursor-pointer hover:bg-red-50 hover:text-red-700 text-left transition font-medium"
                                              onClick={() => {
                                                setOpenMenuRow(null);
                                                handleDeleteSelected(
                                                  getRowKey(row)
                                                );
                                              }}
                                            >
                                              <svg
                                                width={16}
                                                height={16}
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                                viewBox="0 0 24 24"
                                              >
                                                <path d="M6 19a2 2 0 002 2h8a2 2 0 002-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                                              </svg>
                                              Xóa
                                            </button>
                                          </>
                                        )}
                                        <button
                                          className={`flex items-center gap-3 w-full px-3 py-2 text-sm hover:cursor-pointer text-left transition font-medium ${
                                            isManual
                                              ? "rounded-b-lg"
                                              : "rounded-lg"
                                          } ${
                                            favoriteProducts.includes(
                                              getRowKey(row)
                                            )
                                              ? "text-red-700 bg-red-50 hover:bg-red-100"
                                              : "text-gray-700 hover:bg-yellow-50 hover:text-yellow-700"
                                          }`}
                                          onClick={() => {
                                            handleToggleFavorite(
                                              getRowKey(row)
                                            );
                                            setOpenMenuRow(null);
                                          }}
                                        >
                                          <svg
                                            width={16}
                                            height={16}
                                            fill={
                                              favoriteProducts.includes(
                                                getRowKey(row)
                                              )
                                                ? "currentColor"
                                                : "none"
                                            }
                                            stroke="currentColor"
                                            strokeWidth={2}
                                            viewBox="0 0 24 24"
                                          >
                                            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                                          </svg>
                                          {favoriteProducts.includes(
                                            getRowKey(row)
                                          )
                                            ? "Bỏ yêu thích"
                                            : "Yêu thích"}
                                        </button>
                                      </>
                                    );
                                  })()}
                                </div>,
                                document.body
                              )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={8}
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
    </div>
  );
};

export default ProductSelectionModal;
