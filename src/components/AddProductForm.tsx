import { FlattenedRow } from "@/models/Product.model";
import React, { useEffect, useState } from "react";

interface AddProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (product: {
    danhMuc: string;
    "Đầu mục": string;
    "Tên cốt": string;
    "Tên phủ": string;
    "Đơn vị": string;
    "Đơn giá": number;
    "Ghi chú": string;
  }) => void;
  initialData: FlattenedRow | null;
  danhMuc: string;
}

const AddProductForm: React.FC<AddProductFormProps> = ({
  isOpen,
  onClose,
  onAdd,
  initialData,
  danhMuc,
}) => {
  const [form, setForm] = useState({
    "Đầu mục": "",
    "Tên cốt": "",
    "Tên phủ": "",
    "Đơn vị": "",
    "Đơn giá": 0,
    "Ghi chú": "",
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          "Đầu mục": initialData["Đầu mục"] || "",
          "Tên cốt": initialData["Tên cốt"] || "",
          "Tên phủ": initialData["Tên phủ"] || "",
          "Đơn vị": initialData["Đơn vị"] || "",
          "Đơn giá": initialData["Đơn giá"] || 0,
          "Ghi chú": initialData["Ghi chú"] || "",
        });
      } else {
        setForm({
          "Đầu mục": "",
          "Tên cốt": "",
          "Tên phủ": "",
          "Đơn vị": "",
          "Đơn giá": 0,
          "Ghi chú": "",
        });
      }
    }
  }, [isOpen, initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "Đơn giá" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      danhMuc, // truyền danh mục hiện tại
      ...form,
    });
    setForm({
      "Đầu mục": "",
      "Tên cốt": "",
      "Tên phủ": "",
      "Đơn vị": "",
      "Đơn giá": 0,
      "Ghi chú": "",
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative animate-modalScale"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-2xl text-gray-500 hover:text-black hover:cursor-pointer"
          title="Đóng"
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-4 text-blue-700">
          {initialData ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Đầu mục */}
            <div className="flex flex-col">
              <label className="font-medium mb-1">Đầu mục</label>
              <input
                name="Đầu mục"
                value={form["Đầu mục"]}
                onChange={handleChange}
                placeholder="VD: Tủ bếp"
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Tên cốt */}
            <div className="flex flex-col">
              <label className="font-medium mb-1">Tên cốt</label>
              <input
                name="Tên cốt"
                value={form["Tên cốt"]}
                onChange={handleChange}
                placeholder="VD: MDF chống ẩm"
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Tên phủ */}
            <div className="flex flex-col">
              <label className="font-medium mb-1">Tên phủ</label>
              <input
                name="Tên phủ"
                value={form["Tên phủ"]}
                onChange={handleChange}
                placeholder="VD: Melamine vân gỗ"
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Đơn vị */}
            <div className="flex flex-col">
              <label className="font-medium mb-1">Đơn vị</label>
              <input
                name="Đơn vị"
                value={form["Đơn vị"]}
                onChange={handleChange}
                placeholder="VD: bộ"
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Đơn giá */}
            <div className="flex flex-col">
              <label className="font-medium mb-1">Đơn giá</label>
              <input
                name="Đơn giá"
                type="number"
                value={form["Đơn giá"]}
                onChange={handleChange}
                placeholder="VD: 1250000"
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={0}
                required
              />
            </div>

            {/* Ghi chú */}
            <div className="flex flex-col sm:col-span-2">
              <label className="font-medium mb-1">Ghi chú</label>
              <textarea
                name="Ghi chú"
                value={form["Ghi chú"]}
                onChange={handleChange}
                placeholder="VD: Áp dụng cho phòng khách"
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 hover:cursor-pointer font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 hover:cursor-pointer font-semibold"
            >
              Thêm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductForm;
