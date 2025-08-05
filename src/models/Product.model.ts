interface MaterialCover {
  "Tên phủ": string;
  "Đơn vị": string;
  "Đơn giá gốc": number;
  "Lợi nhuận (%)": number;
  "Giá báo khách": number;
  "Ghi chú"?: string;
}

interface CoreMaterial {
  "Tên cốt": string;
  "Chất liệu phủ": MaterialCover[];
}

interface Product {
  id: string;
  "Đầu mục": string;
  "Mặc định đơn vị": string;
  "Chất liệu cốt": CoreMaterial[];
  "Ngày tạo": string;
}

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

export type { MaterialCover, CoreMaterial, Product, FlattenedRow };