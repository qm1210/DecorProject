import type { Product } from "./Product.model";

interface Category {
    "Danh mục": string;
    "Sản phẩm": Product[];
}

export type { Category };