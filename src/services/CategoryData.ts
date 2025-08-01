import axios from "axios";
import type { Category } from "@/models/Category.model";

// Trả về mảng các string danh mục
const fetchCategoryNames = async (): Promise<string[]> => {
  try {
    const response = await axios.get<Category[]>("/data/bao_gia_noi_that_grouped_danh_muc_simple.json");

    const categoryNames = response.data.map(item => item["Danh mục"]);

    return categoryNames;
  } catch (error) {
    console.error("Lỗi khi lấy danh mục:", error);
    throw new Error("Không thể lấy danh sách danh mục");
  }
};

export { fetchCategoryNames };
