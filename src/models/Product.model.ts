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
  "Danh mục": string;
  isManual?: boolean; 
}

export type { MaterialCover, CoreMaterial, Product, FlattenedRow };