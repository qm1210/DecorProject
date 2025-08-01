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

export type { MaterialCover, CoreMaterial, Product };