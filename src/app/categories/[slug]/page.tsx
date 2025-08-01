"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import type { Category } from "@/models/Category.model";
import type { Product } from "@/models/Product.model";
import formatCurrency from "@/utils/FormatCurrency";
import useQuoteStore from "@/store/CartStore";
import type { SelectedProduct } from "@/store/CartStore";
import { toast } from "react-toastify";

// Flattened table row
interface FlattenedRow {
  id: string;
  "Đầu mục": string;
  "Tên cốt": string;
  "Tên phủ": string;
  "Đơn vị": string;
  "Đơn giá": number;
  "Ghi chú": string;
  "Số lượng": number;
}

const removeVietnameseTones = (str: string): string => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
};

const DetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [categoryData, setCategoryData] = useState<Category | null>(null);
  const [flattenedData, setFlattenedData] = useState<FlattenedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Filter states
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000]);
  const [selectedDauMuc, setSelectedDauMuc] = useState<string[]>([]);
  const [selectedTenCot, setSelectedTenCot] = useState<string[]>([]);
  const [selectedTenPhu, setSelectedTenPhu] = useState<string[]>([]);

  // Store
  const { addProduct, listedProducts } = useQuoteStore();

  // Load saved quantities from localStorage for current category
  const loadSavedQuantities = (data: FlattenedRow[]) => {
    const savedKey = `category-${slug}-quantities`;
    const saved = localStorage.getItem(savedKey);

    if (saved) {
      try {
        const savedQuantities = JSON.parse(saved);
        return data.map((item) => {
          const itemKey = `${item.id}-${item["Tên cốt"]}-${item["Tên phủ"]}`;
          return {
            ...item,
            "Số lượng": savedQuantities[itemKey] || 0,
          };
        });
      } catch (e) {
        console.error("Error loading saved quantities:", e);
      }
    }

    return data;
  };

  // Sync with global store - check if products were removed externally
  const syncWithGlobalStore = () => {
    if (flattenedData.length === 0) return;

    const currentIds = flattenedData.map(
      (item) => `${item.id}-${item["Tên cốt"]}-${item["Tên phủ"]}`
    );

    // Check which products from this category still exist in global store
    const existingInStore = listedProducts.filter((product) =>
      currentIds.includes(product.id)
    );

    // Update local quantities based on what exists in global store
    setFlattenedData((prev) => {
      return prev.map((item) => {
        const itemId = `${item.id}-${item["Tên cốt"]}-${item["Tên phủ"]}`;
        const existsInStore = existingInStore.find((p) => p.id === itemId);

        // If item was removed from store externally, reset quantity to 0
        if (!existsInStore && item["Số lượng"] > 0) {
          return { ...item, "Số lượng": 0 };
        }

        return item;
      });
    });

    // Also update localStorage quantities
    const savedKey = `category-${slug}-quantities`;
    const quantities: Record<string, number> = {};

    existingInStore.forEach((product) => {
      quantities[product.id] = product.quantity;
    });

    if (Object.keys(quantities).length > 0) {
      localStorage.setItem(savedKey, JSON.stringify(quantities));
    } else {
      localStorage.removeItem(savedKey);
    }
  };

  // Listen for changes in global store
  useEffect(() => {
    syncWithGlobalStore();
  }, [listedProducts, flattenedData.length]);

  // Listen for storage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "quoteItems" || e.key?.startsWith("category-")) {
        syncWithGlobalStore();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Save quantities to localStorage for current category - CHỈ GỌI KHI THÊM
  const saveQuantitiesToLocal = () => {
    const savedKey = `category-${slug}-quantities`;
    const quantities: Record<string, number> = {};

    flattenedData.forEach((item) => {
      if (item["Số lượng"] > 0) {
        const itemKey = `${item.id}-${item["Tên cốt"]}-${item["Tên phủ"]}`;
        quantities[itemKey] = item["Số lượng"];
      }
    });

    localStorage.setItem(savedKey, JSON.stringify(quantities));
  };

  const handleAdd = () => {
    const selectedProducts = flattenedData.filter(
      (item) => item["Số lượng"] > 0
    );

    if (selectedProducts.length === 0) {
      toast.warning("Vui lòng chọn ít nhất một sản phẩm");
      return;
    }

    const productsToStore: SelectedProduct[] = [];

    selectedProducts.forEach((item) => {
      const newProduct: SelectedProduct = {
        id: `${item.id}-${item["Tên cốt"]}-${item["Tên phủ"]}`,
        name: `${item["Đầu mục"]} - ${item["Tên cốt"]} - ${item["Tên phủ"]}`,
        unit: item["Đơn vị"],
        price: item["Đơn giá"],
        quantity: item["Số lượng"],
      };

      addProduct(newProduct);
      productsToStore.push(newProduct);
    });

    // Save to global quote items
    if (productsToStore.length > 0) {
      const existing = localStorage.getItem("quoteItems");
      const existingItems: SelectedProduct[] = existing
        ? JSON.parse(existing)
        : [];

      const mergedItems = [...existingItems];

      for (const newItem of productsToStore) {
        const index = mergedItems.findIndex((p) => p.id === newItem.id);
        if (index !== -1) {
          mergedItems[index].quantity = newItem.quantity; // Update to exact quantity, not add
        } else {
          mergedItems.push(newItem);
        }
      }

      localStorage.setItem("quoteItems", JSON.stringify(mergedItems));
    }

    // CHỈ LƯU KHI THÊM SẢN PHẨM
    saveQuantitiesToLocal();

    toast.success(`Đã thêm ${selectedProducts.length} sản phẩm vào báo giá`);
  };

  const flattenProductData = (products: Product[]): FlattenedRow[] => {
    const flattened = products.flatMap((product) =>
      product["Chất liệu cốt"].flatMap((cot) =>
        cot["Chất liệu phủ"].map((phu) => ({
          id: product.id,
          "Đầu mục": product["Đầu mục"],
          "Tên cốt": cot["Tên cốt"],
          "Tên phủ": phu["Tên phủ"],
          "Đơn vị": phu["Đơn vị"],
          "Đơn giá": phu["Giá báo khách"],
          "Ghi chú": phu["Ghi chú"] ?? "",
          "Số lượng": 0,
        }))
      )
    );

    // Load saved quantities
    return loadSavedQuantities(flattened);
  };

  // CHỈ CẬP NHẬT STATE, KHÔNG LƯU LOCALSTORE
  const updateQuantity = (index: number, quantity: number) => {
    setFlattenedData((prev) => {
      const newData = [...prev];
      newData[index] = { ...newData[index], "Số lượng": quantity };
      return newData;
    });
  };

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setLoading(true);
        const response = await axios.get<Category[]>(
          "/data/bao_gia_noi_that_grouped_danh_muc_simple.json"
        );

        const found = response.data.find((cat) => {
          const slugified = removeVietnameseTones(cat["Danh mục"]).replace(
            /\s+/g,
            "-"
          );
          return slugified === slug;
        });

        if (!found) {
          setError("Không tìm thấy danh mục");
          return;
        }

        setCategoryData(found);
        const flat = flattenProductData(found["Sản phẩm"]);
        setFlattenedData(flat);

        // Set initial price range
        const prices = flat.map((item) => item["Đơn giá"]);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        setPriceRange([minPrice, maxPrice]);
      } catch (err) {
        console.error(err);
        setError("Không thể tải dữ liệu sản phẩm");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchCategory();
    }
  }, [slug]);

  // Get unique values for filters
  const uniqueDauMuc = [
    ...new Set(flattenedData.map((item) => item["Đầu mục"])),
  ];
  const uniqueTenCot = [
    ...new Set(flattenedData.map((item) => item["Tên cốt"])),
  ];
  const uniqueTenPhu = [
    ...new Set(flattenedData.map((item) => item["Tên phủ"])),
  ];

  const filteredData = flattenedData.filter((row) => {
    const term = removeVietnameseTones(searchTerm.toLowerCase());

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

  const calculateTotal = () =>
    sortedData.reduce((sum, row) => sum + row["Đơn giá"] * row["Số lượng"], 0);

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

  // Clear all quantities for current category - XÓA CẢ LOCALSTORAGE
  const handleClearQuantities = () => {
    setFlattenedData((prev) =>
      prev.map((item) => ({ ...item, "Số lượng": 0 }))
    );

    // Xoá quantity theo danh mục hiện tại
    const savedKey = `category-${slug}-quantities`;
    localStorage.removeItem(savedKey);

    // Xoá khỏi toàn bộ danh sách báo giá
    const currentIds = flattenedData.map(
      (item) => `${item.id}-${item["Tên cốt"]}-${item["Tên phủ"]}`
    );

    const existing = localStorage.getItem("quoteItems");
    if (existing) {
      const existingItems: SelectedProduct[] = JSON.parse(existing);
      const filtered = existingItems.filter(
        (item) => !currentIds.includes(item.id)
      );
      localStorage.setItem("quoteItems", JSON.stringify(filtered));
    }

    // Nếu bạn đang dùng Zustand store, xóa trong đó luôn
    if (typeof window !== "undefined") {
      const { removeProduct } = useQuoteStore.getState();
      currentIds.forEach((id) => removeProduct(id));
    }

    toast.info("Đã xóa tất cả sản phẩm đã chọn");
  };

  if (loading) return <div className="p-8 text-center">Đang tải...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  const selectedItemsCount = flattenedData.filter(
    (item) => item["Số lượng"] > 0
  ).length;

  return (
    <div className="bg-white min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:underline text-1xl mb-2 hover:cursor-pointer"
          >
            ← Quay lại
          </button>
          <h1 className="text-3xl font-bold mb-2">
            {categoryData?.["Danh mục"]}
          </h1>
          <div className="flex gap-4 items-center">
            <div className="bg-blue-100 p-4 rounded-lg min-w-50">
              <h3 className="text-blue-800 text-sm font-medium">Tổng tiền</h3>
              <p className="text-blue-900 text-2xl font-bold">
                {formatCurrency(calculateTotal())}
              </p>
            </div>
            {selectedItemsCount > 0 && (
              <div className="bg-green-100 p-4 rounded-lg">
                <h3 className="text-green-800 text-sm font-medium">Đã chọn</h3>
                <p className="text-green-900 text-2xl font-bold">
                  {selectedItemsCount} sản phẩm
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Left Side - Table */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <p className="text-gray-600">
                  {sortedData.length} sản phẩm được tìm thấy
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {[
                        "Đầu mục",
                        "Tên cốt",
                        "Tên phủ",
                        "Đơn vị",
                        "Đơn giá",
                        "Ghi chú",
                        "Số lượng",
                      ].map((col) => (
                        <th
                          key={col}
                          onClick={() => col !== "Số lượng" && handleSort(col)}
                          className={`px-4 py-3 text-left font-medium text-gray-600 ${
                            col !== "Số lượng" ? "cursor-pointer" : ""
                          }`}
                        >
                          {col}
                          {sortColumn === col &&
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
                          className={`hover:bg-gray-50 border-b ${
                            row["Số lượng"] > 0 ? "bg-blue-50" : ""
                          }`}
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
                            <input
                              type="number"
                              min="0"
                              value={row["Số lượng"]}
                              onChange={(e) => {
                                const quantity = parseInt(e.target.value) || 0;
                                const originalIndex = flattenedData.findIndex(
                                  (item) =>
                                    item.id === row.id &&
                                    item["Tên cốt"] === row["Tên cốt"] &&
                                    item["Tên phủ"] === row["Tên phủ"]
                                );
                                updateQuantity(originalIndex, quantity);
                              }}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                            />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-gray-500"
                        >
                          {searchTerm
                            ? `Không tìm thấy kết quả cho "${searchTerm}"`
                            : "Không có dữ liệu"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t bg-gray-50 flex gap-2">
                <button
                  onClick={handleAdd}
                  disabled={selectedItemsCount === 0}
                  className={`px-4 py-2 rounded transition-colors ${
                    selectedItemsCount > 0
                      ? "bg-blue-600 text-white hover:bg-blue-700 hover:cursor-pointer"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  + Thêm sản phẩm ({selectedItemsCount})
                </button>
                {selectedItemsCount > 0 && (
                  <button
                    onClick={handleClearQuantities}
                    className="px-4 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors hover:cursor-pointer"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Filters */}
          <div className="w-80 space-y-6">
            {/* Search */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium mb-3">Tìm kiếm</h3>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm sản phẩm, chất liệu..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            {/* Price Range */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium mb-3">Khoảng giá</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 min-w-7">Từ:</span>
                  <input
                    type="range"
                    min={Math.min(
                      ...flattenedData.map((item) => item["Đơn giá"])
                    )}
                    max={Math.max(
                      ...flattenedData.map((item) => item["Đơn giá"])
                    )}
                    value={priceRange[0]}
                    onChange={(e) =>
                      setPriceRange([parseInt(e.target.value), priceRange[1]])
                    }
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 min-w-7">Đến:</span>
                  <input
                    type="range"
                    min={Math.min(
                      ...flattenedData.map((item) => item["Đơn giá"])
                    )}
                    max={Math.max(
                      ...flattenedData.map((item) => item["Đơn giá"])
                    )}
                    value={priceRange[1]}
                    onChange={(e) =>
                      setPriceRange([priceRange[0], parseInt(e.target.value)])
                    }
                    className="flex-1"
                  />
                </div>
                <div className="text-sm text-gray-600">
                  {formatCurrency(priceRange[0])} -{" "}
                  {formatCurrency(priceRange[1])}
                </div>
              </div>
            </div>

            {/* Filter by Đầu mục */}
            <div className="bg-white p-4 rounded-lg shadow">
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
                      className="rounded"
                    />
                    <span className="text-sm">{item}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter by Tên cốt */}
            <div className="bg-white p-4 rounded-lg shadow">
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
                      className="rounded"
                    />
                    <span className="text-sm">{item}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter by Tên phủ */}
            <div className="bg-white p-4 rounded-lg shadow">
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
                      className="rounded"
                    />
                    <span className="text-sm">{item}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailPage;
