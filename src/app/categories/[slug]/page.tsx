"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import type { Category } from "@/models/Category.model";
import type { Product } from "@/models/Product.model";
import formatCurrency from "@/utils/FormatCurrency";
import useQuoteStore from "@/store/CartStore";
import type { SelectedProduct } from "@/store/CartStore";
import removeVietnameseTones from "@/utils/RemoveVietnamese";
import ProductSelectionModal from "@/components/ModalAdd";
import Swal from "sweetalert2";
import type { FlattenedRow } from "@/models/Product.model";

const DetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  // State
  const [categoryData, setCategoryData] = useState<Category | null>(null);
  const [flattenedData, setFlattenedData] = useState<FlattenedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

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

  // Hàm xử lý sort
  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(col);
      setSortDirection("asc");
    }
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

  useEffect(() => {
    // Debounce để tránh gọi quá nhiều lần
    const timeoutId = setTimeout(() => {
      flattenedData.forEach((item) => {
        const productId = `${item.id}-${item["Tên cốt"]}-${item["Tên phủ"]}`;

        if (item["Số lượng"] > 0) {
          // Thêm/cập nhật vào store
          const newProduct: SelectedProduct = {
            id: productId,
            name: `${categoryData?.["Danh mục"]} - ${item["Đầu mục"]} - ${item["Tên cốt"]} - ${item["Tên phủ"]}`,
            unit: item["Đơn vị"],
            price: item["Đơn giá"],
            quantity: item["Số lượng"],
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
          addProduct(newProduct);
        } else {
          // Xóa khỏi store
          const existingProduct = listedProducts.find(
            (p) => p.id === productId
          );
          if (existingProduct) {
            removeProduct(productId);
          }
        }
      });

      // Lưu vào localStorage
      const savedKey = `category-${slug}-quantities`;
      const quantities: Record<string, number> = {};

      flattenedData.forEach((dataItem) => {
        if (dataItem["Số lượng"] > 0) {
          const itemKey = `${dataItem.id}-${dataItem["Tên cốt"]}-${dataItem["Tên phủ"]}`;
          quantities[itemKey] = dataItem["Số lượng"];
        }
      });

      if (Object.keys(quantities).length > 0) {
        localStorage.setItem(savedKey, JSON.stringify(quantities));
      } else {
        localStorage.removeItem(savedKey);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(timeoutId);
  }, [
    flattenedData,
    categoryData,
    slug,
    addProduct,
    removeProduct,
    listedProducts,
  ]);

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
  };

  // Listen for changes in global store
  useEffect(() => {
    if (listedProducts.length > 0 || flattenedData.length > 0) {
      syncWithGlobalStore();
    }
  }, [listedProducts, flattenedData.length]);

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
        let flat = flattenProductData(found["Sản phẩm"]);

        // --- Merge sản phẩm nhập tay từ localStorage ---
        const manualProducts = JSON.parse(
          localStorage.getItem("manualProducts") || "[]"
        );
        // Loại bỏ trùng lặp
        flat = [
          ...flat.filter(
            (p) =>
              !manualProducts.some(
                (m: FlattenedRow) =>
                  m["Tên cốt"] === p["Tên cốt"] &&
                  m["Tên phủ"] === p["Tên phủ"] &&
                  m["Đầu mục"] === p["Đầu mục"]
              )
          ),
          ...manualProducts,
        ];
        setFlattenedData(flat);
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

  // Clear all quantities for current category
  const handleClearQuantities = async () => {
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

    setFlattenedData((prev) =>
      prev.map((item) => ({ ...item, "Số lượng": 0 }))
    );

    const savedKey = `category-${slug}-quantities`;
    localStorage.removeItem(savedKey);

    const currentIds = flattenedData.map(
      (item) => `${item.id}-${item["Tên cốt"]}-${item["Tên phủ"]}`
    );

    currentIds.forEach((id) => {
      const existingProduct = listedProducts.find((p) => p.id === id);
      if (existingProduct) {
        removeProduct(id);
      }
    });

    Swal.fire("Đã xóa!", "Tất cả sản phẩm đã được xóa.", "success");
  };

  // Handle product selection from modal
  const handleSelectProduct = (product: FlattenedRow) => {
    const index = flattenedData.findIndex(
      (item) =>
        item.id === product.id &&
        item["Tên cốt"] === product["Tên cốt"] &&
        item["Tên phủ"] === product["Tên phủ"]
    );
    if (index !== -1) {
      updateQuantity(index, 1);
    }
    setShowModal(false);
  };

  // Chỉ lấy sản phẩm đã chọn
  const selectedData = flattenedData.filter((row) => row["Số lượng"] > 0);

  // Sắp xếp selectedData
  const sortedSelectedData = [...selectedData].sort((a, b) => {
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

  const calculateTotal = () =>
    selectedData.reduce(
      (sum, row) => sum + row["Đơn giá"] * row["Số lượng"],
      0
    );

  if (loading) return <div className="p-8 text-center">Đang tải...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="bg-white min-h-screen py-6 px-2 sm:px-4 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:underline text-lg mb-2 hover:cursor-pointer"
          >
            ← Quay lại
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words">
            {categoryData?.["Danh mục"]}
          </h1>
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <div className="bg-blue-100 p-4 rounded-lg min-w-[140px] flex-1">
              <h3 className="text-blue-800 text-sm font-medium">Tổng tiền</h3>
              <p className="text-blue-900 text-2xl font-bold break-words">
                {formatCurrency(calculateTotal())}
              </p>
            </div>
            <div className="bg-green-100 p-4 rounded-lg flex-1">
              <h3 className="text-green-800 text-sm font-medium">Đã chọn</h3>
              <p className="text-green-900 text-2xl font-bold">
                {selectedData.length} sản phẩm
              </p>
            </div>
          </div>
        </div>

        {/* Main Content - Responsive Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2">
            <p className="text-gray-600">
              {selectedData.length} sản phẩm đã chọn
            </p>
            <div className="flex gap-2">
              {selectedData.length > 0 && (
                <button
                  onClick={handleClearQuantities}
                  className="px-4 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors hover:cursor-pointer text-sm"
                >
                  Xóa tất cả
                </button>
              )}
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 hover:cursor-pointer text-sm"
                onClick={() => setShowModal(true)}
              >
                Thêm sản phẩm
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
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
                    "Thao tác",
                  ].map((col) => (
                    <th
                      key={col}
                      onClick={() => col !== "Thao tác" && handleSort(col)}
                      className={`px-4 py-3 text-left font-medium text-gray-600 ${
                        col !== "Thao tác"
                          ? "cursor-pointer hover:bg-gray-100 select-none"
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
                {sortedSelectedData.length ? (
                  sortedSelectedData.map((row, i) => (
                    <tr key={`${row.id}-${i}`} className="border-b bg-blue-50">
                      <td className="px-4 py-2 break-words">
                        {row["Đầu mục"]}
                      </td>
                      <td className="px-4 py-2 break-words">
                        {row["Tên cốt"]}
                      </td>
                      <td className="px-4 py-2 break-words">
                        {row["Tên phủ"]}
                      </td>
                      <td className="px-4 py-2">{row["Đơn vị"]}</td>
                      <td className="px-4 py-2 font-semibold text-green-600">
                        {formatCurrency(row["Đơn giá"])}
                      </td>
                      <td className="px-4 py-2 text-gray-500 break-words">
                        {row["Ghi chú"] || "-"}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          {/* Nút trừ */}
                          <button
                            onClick={() => {
                              const quantity = Math.max(
                                0,
                                (row["Số lượng"] || 0) - 1
                              );
                              const index = flattenedData.findIndex(
                                (item) =>
                                  item.id === row.id &&
                                  item["Tên cốt"] === row["Tên cốt"] &&
                                  item["Tên phủ"] === row["Tên phủ"]
                              );
                              updateQuantity(index, quantity);
                            }}
                            className="w-7 h-7 rounded bg-gray-200 hover:bg-gray-300 hover:cursor-pointer text-black text-base font-bold border border-gray-400"
                          >
                            −
                          </button>
                          {/* Input không có mũi tên */}
                          <input
                            type="number"
                            min="0"
                            value={row["Số lượng"]}
                            onChange={(e) => {
                              const quantity = parseInt(e.target.value) || 0;
                              const index = flattenedData.findIndex(
                                (item) =>
                                  item.id === row.id &&
                                  item["Tên cốt"] === row["Tên cốt"] &&
                                  item["Tên phủ"] === row["Tên phủ"]
                              );
                              updateQuantity(index, quantity);
                            }}
                            className="no-spinner w-16 text-center px-2 py-1 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          {/* Nút cộng */}
                          <button
                            onClick={() => {
                              const quantity = (row["Số lượng"] || 0) + 1;
                              const index = flattenedData.findIndex(
                                (item) =>
                                  item.id === row.id &&
                                  item["Tên cốt"] === row["Tên cốt"] &&
                                  item["Tên phủ"] === row["Tên phủ"]
                              );
                              updateQuantity(index, quantity);
                            }}
                            className="w-7 h-7 rounded bg-gray-200 hover:bg-gray-300 hover:cursor-pointer text-black text-base font-bold border border-gray-400"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      {/* Nút xóa sản phẩm */}
                      <td className="px-4 py-2">
                        <button
                          onClick={() => {
                            const index = flattenedData.findIndex(
                              (item) =>
                                item.id === row.id &&
                                item["Tên cốt"] === row["Tên cốt"] &&
                                item["Tên phủ"] === row["Tên phủ"]
                            );
                            updateQuantity(index, 0);
                          }}
                          className="w-10 h-7 rounded px-7 py-4 bg-red-500 hover:cursor-pointer hover:bg-red-600 text-white text-base border border-red-300 flex items-center justify-center transition-colors"
                          title="Xóa sản phẩm"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      Chưa chọn sản phẩm nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Product Selection Modal */}
        <ProductSelectionModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          products={flattenedData}
          setProducts={setFlattenedData}
        />
      </div>
    </div>
  );
};

export const runtime = "edge";

export default DetailPage;
