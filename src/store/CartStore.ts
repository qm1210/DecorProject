import { create } from "zustand";

export interface SelectedProduct {
  id: string;
  name: string;
  unit: string;
  price: number;
  quantity: number;
  // Thêm các thuộc tính mới
  category?: string;
  subcategory?: string;
  core?: string;
  cover?: string;
  basePrice?: number;
  profit?: number;
  note?: string;
  productId?: string;
  unit_default?: string;
  created_date?: string;
}

interface QuoteStore {
  listedProducts: SelectedProduct[];
  totalPrice: number;
  addProduct: (product: SelectedProduct) => void;
  removeProduct: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  loadFromStorage: () => void;
}

const useQuoteStore = create<QuoteStore>((set) => ({
  listedProducts: [],
  totalPrice: 0,

  addProduct: (product: SelectedProduct) => {
    set((state) => {
      const existingIndex = state.listedProducts.findIndex(
        (p) => p.id === product.id
      );

      let newProducts;
      if (existingIndex >= 0) {
        // Cập nhật sản phẩm đã tồn tại
        newProducts = [...state.listedProducts];
        newProducts[existingIndex] = {
          ...newProducts[existingIndex],
          ...product,
          quantity: product.quantity, 
        };
      } else {
        // Thêm sản phẩm mới
        newProducts = [...state.listedProducts, product];
      }

      const newTotalPrice = newProducts.reduce(
        (sum, p) => sum + p.price * p.quantity,
        0
      );

      // Lưu vào localStorage
      localStorage.setItem("quoteItems", JSON.stringify(newProducts));

      return {
        listedProducts: newProducts,
        totalPrice: newTotalPrice,
      };
    });
  },

  removeProduct: (id: string) => {
    set((state) => {
      const newProducts = state.listedProducts.filter((p) => p.id !== id);
      const newTotalPrice = newProducts.reduce(
        (sum, p) => sum + p.price * p.quantity,
        0
      );

      // Lưu vào localStorage
      localStorage.setItem("quoteItems", JSON.stringify(newProducts));

      return {
        listedProducts: newProducts,
        totalPrice: newTotalPrice,
      };
    });
  },

  updateQuantity: (id: string, quantity: number) => {
    set((state) => {
      if (quantity <= 0) {
        // Nếu quantity <= 0, xóa sản phẩm
        const newProducts = state.listedProducts.filter((p) => p.id !== id);
        const newTotalPrice = newProducts.reduce(
          (sum, p) => sum + p.price * p.quantity,
          0
        );

        localStorage.setItem("quoteItems", JSON.stringify(newProducts));

        return {
          listedProducts: newProducts,
          totalPrice: newTotalPrice,
        };
      }

      const newProducts = state.listedProducts.map((p) =>
        p.id === id ? { ...p, quantity } : p
      );

      const newTotalPrice = newProducts.reduce(
        (sum, p) => sum + p.price * p.quantity,
        0
      );

      // Lưu vào localStorage
      localStorage.setItem("quoteItems", JSON.stringify(newProducts));

      return {
        listedProducts: newProducts,
        totalPrice: newTotalPrice,
      };
    });
  },

  clearCart: () => {
    localStorage.removeItem("quoteItems");
    set({
      listedProducts: [],
      totalPrice: 0,
    });
  },

  loadFromStorage: () => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("quoteItems");
      if (stored) {
        try {
          const products: SelectedProduct[] = JSON.parse(stored);
          const totalPrice = products.reduce(
            (sum, p) => sum + p.price * p.quantity,
            0
          );
          set({
            listedProducts: products,
            totalPrice,
          });
        } catch (error) {
          console.error("Error loading from storage:", error);
          localStorage.removeItem("quoteItems");
        }
      }
    }
  },
}));

export default useQuoteStore;