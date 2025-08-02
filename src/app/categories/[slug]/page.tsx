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
import removeVietnameseTones from "@/utils/RemoveVietnamese";

// Flattened table row với đầy đủ thông tin
interface FlattenedRow {
  id: string; // Product ID gốc
  "Đầu mục": string;
  "Tên cốt": string;
  "Tên phủ": string;
  "Đơn vị": string;
  "Đơn giá": number; // Giá báo khách
  "Ghi chú": string;
  "Số lượng": number;
  "Đơn giá gốc": number; // Đơn giá gốc
  "Lợi nhuận (%)": number; // Lợi nhuận
  "Đơn vị mặc định": string; // Đơn vị mặc định của sản phẩm
  "Ngày tạo": string; // Ngày tạo sản phẩm
}

const DetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  // State
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
  const { addProduct, removeProduct, listedProducts, loadFromStorage } =
    useQuoteStore();

  // Load Zustand store from localStorage on mount
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Flatten product data với đầy đủ thông tin
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
          // Thêm thông tin chi tiết
          "Đơn giá gốc": phu["Đơn giá gốc"],
          "Lợi nhuận (%)": phu["Lợi nhuận (%)"],
          "Đơn vị mặc định": product["Mặc định đơn vị"],
          "Ngày tạo": product["Ngày tạo"],
        }))
      )
    );

    // Load saved quantities từ localStorage
    return loadSavedQuantities(flattened);
  };

  // Load saved quantities from localStorage for current category
  const loadSavedQuantities = (data: FlattenedRow[]): FlattenedRow[] => {
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

  // Save quantities to localStorage for current category
  const saveQuantitiesToLocal = () => {
    const savedKey = `category-${slug}-quantities`;
    const quantities: Record<string, number> = {};

    flattenedData.forEach((item) => {
      if (item["Số lượng"] > 0) {
        const itemKey = `${item.id}-${item["Tên cốt"]}-${item["Tên phủ"]}`;
        quantities[itemKey] = item["Số lượng"];
      }
    });

    if (Object.keys(quantities).length > 0) {
      localStorage.setItem(savedKey, JSON.stringify(quantities));
    } else {
      localStorage.removeItem(savedKey);
    }
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

        // Sync quantity from store if exists
        if (existsInStore && item["Số lượng"] !== existsInStore.quantity) {
          return { ...item, "Số lượng": existsInStore.quantity };
        }

        return item;
      });
    });

    // Update localStorage quantities
    saveQuantitiesToLocal();
  };

  // Listen for changes in global store
  useEffect(() => {
    if (listedProducts.length > 0 || flattenedData.length > 0) {
      syncWithGlobalStore();
    }
  }, [listedProducts, flattenedData.length]);

  // Listen for storage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "quoteItems") {
        loadFromStorage();
      } else if (e.key?.startsWith("category-")) {
        // Reload quantities for this category
        if (flattenedData.length > 0) {
          const reloaded = loadSavedQuantities(
            flattenedData.map((item) => ({ ...item, "Số lượng": 0 }))
          );
          setFlattenedData(reloaded);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [flattenedData]);

  // Fetch category data
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

  // Update quantity - chỉ cập nhật state local
  const updateQuantity = (index: number, quantity: number) => {
    setFlattenedData((prev) => {
      const newData = [...prev];
      newData[index] = { ...newData[index], "Số lượng": quantity };
      return newData;
    });
  };

  // Add products to cart/quote
  const handleAdd = () => {
    const selectedProducts = flattenedData.filter(
      (item) => item["Số lượng"] > 0
    );

    if (selectedProducts.length === 0) {
      toast.warning("Vui lòng chọn ít nhất một sản phẩm");
      return;
    }

    selectedProducts.forEach((item) => {
      const newProduct: SelectedProduct = {
        id: `${item.id}-${item["Tên cốt"]}-${item["Tên phủ"]}`,
        name: `${categoryData?.["Danh mục"]} - ${item["Đầu mục"]} - ${item["Tên cốt"]} - ${item["Tên phủ"]}`,
        unit: item["Đơn vị"],
        price: item["Đơn giá"],
        quantity: item["Số lượng"],
        // Lưu đầy đủ thông tin chi tiết
        category: categoryData?.["Danh mục"] || "Khác",
        subcategory: item["Đầu mục"],
        core: item["Tên cốt"],
        cover: item["Tên phủ"],
        basePrice: item["Đơn giá gốc"],
        profit: item["Lợi nhuận (%)"],
        note: item["Ghi chú"],
        productId: item.id,
        unit_default: item["Đơn vị mặc định"],
        created_date: item["Ngày tạo"],
      };

      // Sử dụng addProduct từ store - nó sẽ tự động handle việc update hoặc add mới
      addProduct(newProduct);
    });

    // Lưu quantities cho category hiện tại
    saveQuantitiesToLocal();

    toast.success(
      `Đã cập nhật ${selectedProducts.length} sản phẩm vào báo giá`
    );
  };

  // Clear all quantities for current category
  const handleClearQuantities = () => {
    setFlattenedData((prev) =>
      prev.map((item) => ({ ...item, "Số lượng": 0 }))
    );

    // Xóa quantity theo danh mục hiện tại
    const savedKey = `category-${slug}-quantities`;
    localStorage.removeItem(savedKey);

    // Xóa khỏi toàn bộ danh sách báo giá
    const currentIds = flattenedData.map(
      (item) => `${item.id}-${item["Tên cốt"]}-${item["Tên phủ"]}`
    );

    // Sử dụng removeProduct từ store
    currentIds.forEach((id) => {
      const existingProduct = listedProducts.find((p) => p.id === id);
      if (existingProduct) {
        removeProduct(id);
      }
    });

    toast.info("Đã xóa tất cả sản phẩm đã chọn");
  };

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

  // Filter data
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

  const calculateTotal = () =>
    flattenedData.reduce(
      (sum, row) => sum + row["Đơn giá"] * row["Số lượng"],
      0
    );

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
                            col !== "Số lượng"
                              ? "cursor-pointer hover:bg-gray-100"
                              : ""
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
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          {searchTerm ||
                          selectedDauMuc.length ||
                          selectedTenCot.length ||
                          selectedTenPhu.length
                            ? "Không tìm thấy sản phẩm phù hợp với bộ lọc"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            {/* Clear Filters */}
            <div className="bg-white p-4 rounded-lg shadow">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setPriceRange([
                    Math.min(...flattenedData.map((item) => item["Đơn giá"])),
                    Math.max(...flattenedData.map((item) => item["Đơn giá"])),
                  ]);
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

export default DetailPage;
