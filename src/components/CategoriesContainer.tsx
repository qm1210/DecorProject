"use client";

import { useState, useMemo, useEffect } from "react";
import formatCurrency from "@/utils/FormatCurrency";
import useQuoteStore from "@/store/CartStore";
import Swal from "sweetalert2";
import ProductSelectionModal from "./ModalAdd";
import type { FlattenedRow } from "@/models/Product.model";

interface CategoriesContainerProps {
  categories: string[];
  loading: boolean;
  error: string | null;
}

// Function để extract danh mục từ tên sản phẩm
const extractCategory = (productName: string): string => {
  const parts = productName.split(" - ");
  return parts[0] || "Khác";
};

// Function để flatten dữ liệu JSON thành FlattenedRow[]
const flattenProductData = (data: any[]): FlattenedRow[] => {
  const flattened: FlattenedRow[] = [];

  data.forEach((category) => {
    const categoryName = category["Danh mục"];
    if (!category["Sản phẩm"]) return;

    category["Sản phẩm"].forEach((product: any) => {
      if (!product["Chất liệu cốt"]) return;

      product["Chất liệu cốt"].forEach((cotMaterial: any) => {
        if (!cotMaterial["Chất liệu phủ"]) return;

        cotMaterial["Chất liệu phủ"].forEach((phuMaterial: any) => {
          flattened.push({
            id: `${product.id || Date.now()}-${Math.random()}`,
            "Danh mục": categoryName,
            "Đầu mục": product["Đầu mục"] || "",
            "Tên cốt": cotMaterial["Tên cốt"] || "",
            "Tên phủ": phuMaterial["Tên phủ"] || "",
            "Đơn vị":
              phuMaterial["Đơn vị"] || product["Mặc định đơn vị"] || "m2",
            "Đơn giá": Number(phuMaterial["Giá báo khách"]) || 0,
            "Ghi chú": phuMaterial["Ghi chú"] || "",
            "Số lượng": 1,
            "Đơn giá gốc": Number(phuMaterial["Đơn giá gốc"]) || 0,
            "Lợi nhuận (%)": Number(phuMaterial["Lợi nhuận (%)"]) || 0,
            "Đơn vị mặc định": product["Mặc định đơn vị"] || "m2",
            "Ngày tạo": product["Ngày tạo"] || new Date().toISOString(),
            isManual: false,
          });
        });
      });
    });
  });

  return flattened;
};

const CategoriesContainer: React.FC<CategoriesContainerProps> = ({
  categories,
  loading,
  error,
}) => {
  const [modalCategory, setModalCategory] = useState<string | null>(null);
  const [allProducts, setAllProducts] = useState<FlattenedRow[]>([]);
  const {
    totalPrice,
    listedProducts,
    removeProduct,
    loadFromStorage,
    updateQuantity,
  } = useQuoteStore();

  // Load dữ liệu từ localStorage khi component mount
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Load và flatten dữ liệu từ JSON
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch(
          "/data/bao_gia_noi_that_grouped_danh_muc_simple.json"
        );
        const data = await response.json();

        // Flatten dữ liệu JSON thành FlattenedRow[]
        const flattenedData = flattenProductData(data);
        setAllProducts(flattenedData);

        console.log("Loaded products:", flattenedData.length);
        console.log("Sample product:", flattenedData[0]);
      } catch (error) {
        console.error("Error loading products:", error);
      }
    };

    loadProducts();
  }, []);

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

    // Sắp xếp sản phẩm trong mỗi danh mục theo tên
    Object.keys(groups).forEach((category) => {
      groups[category].sort((a, b) => a.name.localeCompare(b.name));
    });

    return groups;
  }, [listedProducts]);

  // Sắp xếp danh mục: có sản phẩm lên trên, sau đó theo tên
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const aHasProducts = (groupedProducts[a] || []).length > 0;
      const bHasProducts = (groupedProducts[b] || []).length > 0;

      // Ưu tiên danh mục có sản phẩm
      if (aHasProducts && !bHasProducts) return -1;
      if (!aHasProducts && bHasProducts) return 1;

      // Nếu cùng trạng thái, sắp xếp theo tên
      return a.localeCompare(b);
    });
  }, [categories, groupedProducts]);

  // Mở modal khi click vào danh mục
  const handleOpenModal = (category: string) => {
    console.log("Opening modal for category:", category);
    setModalCategory(category);
  };

  // Đóng modal
  const handleCloseModal = () => {
    setModalCategory(null);
  };

  const handleRemoveProduct = (productId: string) => {
    removeProduct(productId);
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveProduct(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
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

    listedProducts.forEach((product) => removeProduct(product.id));
    localStorage.removeItem("quoteItems");

    Swal.fire("Đã xóa!", "Tất cả sản phẩm đã được xóa.", "success");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-500">
          <p className="text-lg font-semibold mb-2">Lỗi</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header với tổng chi phí */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">
              Xây dựng báo giá
            </h1>
            <div className="text-right">
              <p className="text-lg font-semibold text-gray-600">
                Tổng chi phí:
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(totalPrice)}
              </p>
              {listedProducts.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-red-500 hover:text-red-700 hover:cursor-pointer font-medium text-sm underline mt-2"
                >
                  Xóa tất cả sản phẩm
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bảng 2 cột */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                  Danh mục sản phẩm
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sản phẩm đã chọn
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedCategories.map((category, idx) => {
                const products = groupedProducts[category] || [];
                const hasProducts = products.length > 0;

                return (
                  <tr
                    key={category}
                    className={`hover:bg-gray-50 ${
                      hasProducts ? "bg-blue-50" : ""
                    }`}
                  >
                    {/* Cột trái - Danh mục */}
                    <td
                      className="px-6 py-2 whitespace-nowrap border-r cursor-pointer"
                      onClick={() => handleOpenModal(category)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                              hasProducts
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {idx + 1}
                          </div>
                          <div>
                            <button
                              onClick={() => handleOpenModal(category)}
                              className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer transition-colors text-left"
                            >
                              {category}
                            </button>
                            {hasProducts && (
                              <p className="text-sm text-blue-600 mt-1">
                                {products.length} sản phẩm đã chọn
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Cột phải - Sản phẩm đã chọn */}
                    <td className="px-6 py-2">
                      {hasProducts ? (
                        <div className="space-y-3">
                          {products.map((product) => (
                            <div
                              key={product.id}
                              className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border"
                            >
                              <div className="flex items-center flex-1">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900 text-sm">
                                    {product.name.replace(`${category} - `, "")}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 ml-4">
                                {/* Giá */}
                                <div className="text-right flex">
                                  <div className="text-sm font-semibold text-gray-700">
                                    {formatCurrency(product.price)}
                                  </div>
                                </div>
                                <div className="text-sm text-gray-700">x</div>

                                {/* Quantity controls */}
                                <div className="flex items-center bg-white rounded border">
                                  <button
                                    onClick={() =>
                                      product.quantity > 1 &&
                                      handleUpdateQuantity(
                                        product.id,
                                        product.quantity - 1
                                      )
                                    }
                                    className={`w-7 h-7 flex items-center justify-center hover:cursor-pointer hover:bg-gray-100 text-gray-600 rounded-l ${
                                      product.quantity <= 1
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                    }`}
                                    disabled={product.quantity <= 1}
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min={1}
                                    value={product.quantity}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      if (val > 0)
                                        handleUpdateQuantity(product.id, val);
                                    }}
                                    className="w-12 text-center text-sm py-1 border-x bg-white"
                                    style={{
                                      borderRadius: 0,
                                      outline: "none",
                                      boxShadow: "none",
                                    }}
                                  />
                                  <button
                                    onClick={() =>
                                      handleUpdateQuantity(
                                        product.id,
                                        product.quantity + 1
                                      )
                                    }
                                    className="w-7 h-7 flex items-center justify-center hover:cursor-pointer hover:bg-gray-100 text-gray-600 rounded-r"
                                  >
                                    +
                                  </button>
                                </div>

                                {/* Tổng tiền */}
                                <div className="text-right min-w-[80px]">
                                  <div className="text-sm font-bold text-red-600">
                                    {formatCurrency(
                                      product.price * product.quantity
                                    )}
                                  </div>
                                </div>

                                {/* Nút xóa */}
                                <button
                                  onClick={() =>
                                    handleRemoveProduct(product.id)
                                  }
                                  className="w-8 h-8 flex items-center justify-center text-red-500 hover:cursor-pointer hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                  title="Xóa sản phẩm"
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
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-400">
                          <svg
                            className="w-12 h-12 mx-auto mb-3 text-gray-300"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1}
                            viewBox="0 0 24 24"
                          >
                            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                          </svg>
                          <p className="text-sm">Chưa chọn sản phẩm nào</p>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Nếu không có danh mục nào */}
          {sortedCategories.length === 0 && (
            <tbody>
              <tr>
                <td
                  colSpan={2}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <div className="text-center">
                    <svg
                      className="w-16 h-16 mx-auto mb-4 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1}
                      viewBox="0 0 24 24"
                    >
                      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                    </svg>
                    <p className="text-lg">Không có danh mục sản phẩm</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Vui lòng kiểm tra lại dữ liệu
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          )}
        </div>
      </div>

      {/* Modal thêm sản phẩm */}
      {modalCategory && (
        <ProductSelectionModal
          isOpen={true}
          onClose={handleCloseModal}
          products={allProducts}
          danhMuc={modalCategory}
        />
      )}
    </div>
  );
};

export default CategoriesContainer;
