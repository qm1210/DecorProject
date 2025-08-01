import { create } from "zustand";

/* ---- Kiểu dữ liệu ---- */
export interface SelectedProduct {
  id: string;
  name: string;
  unit: string;
  price: number;     // đơn giá
  quantity: number;  // số lượng
}

interface QuoteStore {
  listedProducts: SelectedProduct[];
  totalPrice: number;

  /* updater nhận số hoặc hàm */
  setTotalPrice: (price: number | ((p: number) => number)) => void;

  addProduct: (product: SelectedProduct) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeProduct: (id: string) => void;
  clear: () => void;
  loadFromStorage: () => void; // Thêm function này
}

/* ---- Store ---- */
const useQuoteStore = create<QuoteStore>((set) => ({
  listedProducts: [],
  totalPrice: 0,

  setTotalPrice: (price) =>
    set((state) => ({
      totalPrice: typeof price === "function" ? price(state.totalPrice) : price,
    })),

  addProduct: (product) =>
    set((state) => {
      // kiểm tra trùng -> gộp số lượng
      const existed = state.listedProducts.find((p) => p.id === product.id);
      let newProducts;

      if (existed) {
        newProducts = state.listedProducts.map((p) =>
          p.id === product.id
            ? { ...p, quantity: p.quantity + product.quantity }
            : p,
        );
      } else {
        newProducts = [...state.listedProducts, product];
      }

      const addedTotal = product.price * product.quantity;
      return {
        listedProducts: newProducts,
        totalPrice: state.totalPrice + addedTotal,
      };
    }),

  updateQuantity: (id, quantity) =>
    set((state) => {
      const newProducts = state.listedProducts.map((p) =>
        p.id === id ? { ...p, quantity } : p,
      );
      const newTotal = newProducts.reduce(
        (sum, p) => sum + p.price * p.quantity,
        0,
      );
      return { listedProducts: newProducts, totalPrice: newTotal };
    }),

  removeProduct: (id) =>
    set((state) => {
      const newProducts = state.listedProducts.filter((p) => p.id !== id);
      const newTotal = newProducts.reduce(
        (sum, p) => sum + p.price * p.quantity,
        0,
      );
      return { listedProducts: newProducts, totalPrice: newTotal };
    }),

  clear: () => set({ listedProducts: [], totalPrice: 0 }),

  // Load dữ liệu từ localStorage
  loadFromStorage: () => {
    try {
      const stored = localStorage.getItem("quoteItems");
      if (stored) {
        const products: SelectedProduct[] = JSON.parse(stored);
        const total = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
        
        set({
          listedProducts: products,
          totalPrice: total,
        });
      }
    } catch (error) {
      console.error("Error loading from localStorage:", error);
      // Nếu có lỗi, reset về trạng thái ban đầu
      set({ listedProducts: [], totalPrice: 0 });
    }
  },
}));

export default useQuoteStore;