import axios from "axios";
import type { Category } from "@/models/Category.model";

const fetchFullCategoryData = async (): Promise<Category[]> => {
  try {
    const response = await axios.get<Category[]>("/data/bao_gia_noi_that_grouped_danh_muc_full.json");
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu đầy đủ:", error);
    throw new Error("Không thể lấy dữ liệu danh mục đầy đủ");
  }
};

export { fetchFullCategoryData };
