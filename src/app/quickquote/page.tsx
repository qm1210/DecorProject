"use client";

import { useEffect, useState } from "react";
import useQuoteStore from "@/store/CartStore";
import { toast } from "react-toastify";
import axios from "axios";
import QuestionSidebar from "@/components/QuestionSidebar";
import usePresetStore from "@/store/QuickQuoteCatalogStore";

interface Question {
  id: number;
  question: string;
  options: { label: string; value: string }[];
  next?: { [key: string]: number };
}

interface SuggestedProduct {
  danhMuc: string;
  dauMuc: string;
  tenCot: string;
  tenPhu: string;
  soLuong: number;
}

interface Suggestion {
  title: string;
  price: string;
  products: SuggestedProduct[];
}

interface SuggestionData {
  conditions: { [key: string]: string };
  suggestion: Suggestion;
}

interface ProductMaterial {
  "Tên phủ": string;
  [key: string]: unknown;
}

interface ProductCore {
  "Tên cốt": string;
  "Chất liệu phủ": ProductMaterial[];
  [key: string]: unknown;
}

interface ProductItem {
  "Đầu mục": string;
  "Chất liệu cốt": ProductCore[];
  id?: string;
  [key: string]: unknown;
}

interface ProductCategory {
  "Danh mục": string;
  "Sản phẩm": ProductItem[];
  [key: string]: unknown;
}

const QuickQuote = () => {
  const { addProduct, listedProducts } = useQuoteStore();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionData[]>([]);
  const [productsData, setProductsData] = useState<ProductCategory[]>([]);
  const [currentId, setCurrentId] = useState(1);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [showResult, setShowResult] = useState(false);
  const [matchedSuggestion, setMatchedSuggestion] = useState<Suggestion | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);

  const preset = usePresetStore((s) => s.preset);
  const clearPreset = usePresetStore((s) => s.clearPreset);

  // Load dữ liệu khi component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [questionsRes, suggestionsRes, productsRes] = await Promise.all([
          axios.get("/data/questions.json"),
          axios.get("/data/suggestions_all_combinations.json"),
          axios.get("/data/bao_gia_noi_that_grouped_danh_muc_simple.json"),
        ]);
        setQuestions(questionsRes.data);
        setSuggestions(suggestionsRes.data);
        setProductsData(productsRes.data);
      } catch (error) {
        alert("Không thể tải dữ liệu. Vui lòng thử lại!");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Chỉ load preset nếu có, KHÔNG load tiến trình từ localStorage
  useEffect(() => {
    if (!questions || questions.length === 0 || isInitialized) return;

    if (preset) {
      const mapToQuestionValue = (qId: number, display: string) => {
        const q = questions.find((x) => x.id === qId);
        let opt = q?.options?.find((o) => o.label === display);
        if (!opt) opt = q?.options?.find((o) => o.value === display);
        if (!opt) {
          opt = q?.options?.find(
            (o) =>
              o.label?.toLowerCase() === display?.toLowerCase() ||
              o.value?.toLowerCase() === display?.toLowerCase()
          );
        }
        return opt?.value ?? display;
      };

      const mappedAnswers = {
        1: mapToQuestionValue(1, preset.loaiCongTrinh),
        2: mapToQuestionValue(2, preset.phongCach),
      };

      setAnswers(mappedAnswers);
      setCurrentId(3);
      clearPreset();
    }
    setIsInitialized(true);
  }, [questions, preset, clearPreset, isInitialized]);

  // Tìm suggestion phù hợp khi hoàn thành
  useEffect(() => {
    if (showResult && suggestions.length > 0) {
      const found = suggestions.find((s) =>
        Object.entries(s.conditions).every(
          ([qid, val]) => answers[parseInt(qid)] === val
        )
      );
      setMatchedSuggestion(found ? found.suggestion : null);
    }
  }, [showResult, answers, suggestions]);

  const current = questions.find((q) => q.id === currentId);

  const handleSelect = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentId]: value }));

    const nextId = current?.next?.[value];
    if (nextId && questions.some((q) => q.id === nextId)) {
      setCurrentId(nextId);
    } else {
      setShowResult(true);
    }
  };

  const findProductInData = (suggestedProduct: SuggestedProduct) => {
    const category = productsData.find(
      (cat) => cat["Danh mục"] === suggestedProduct.danhMuc
    );
    if (!category) return null;

    const product = category["Sản phẩm"]?.find(
      (p) => p["Đầu mục"] === suggestedProduct.dauMuc
    );
    if (!product) return null;

    const cotMaterial = product["Chất liệu cốt"]?.find(
      (c) => c["Tên cốt"] === suggestedProduct.tenCot
    );
    if (!cotMaterial) return null;

    const phuMaterial = cotMaterial["Chất liệu phủ"]?.find(
      (p) => p["Tên phủ"] === suggestedProduct.tenPhu
    );
    if (!phuMaterial) return null;

    return { product, phuMaterial };
  };

  const addSuggestedProductsToCart = () => {
    if (!matchedSuggestion?.products) {
      alert("Không có sản phẩm gợi ý!");
      return;
    }

    let added = 0;
    matchedSuggestion.products.forEach((suggestedProduct) => {
      const foundData = findProductInData(suggestedProduct);
      if (!foundData) return;

      const { product, phuMaterial } = foundData;
      const id = `${product.id}-${suggestedProduct.tenCot}-${suggestedProduct.tenPhu}`;
      const existed = listedProducts.find((p) => p.id === id);

      if (existed) {
        addProduct({
          ...existed,
          quantity: existed.quantity + suggestedProduct.soLuong,
        });
      } else {
        addProduct({
          id,
          name: `${suggestedProduct.danhMuc} - ${suggestedProduct.dauMuc} - ${suggestedProduct.tenCot} - ${suggestedProduct.tenPhu}`,
          unit: String(phuMaterial["Đơn vị"] || "m2"),
          price: Number(phuMaterial["Giá báo khách"]) || 0,
          quantity: suggestedProduct.soLuong,
          category: suggestedProduct.danhMuc,
          subcategory: suggestedProduct.dauMuc,
          core: suggestedProduct.tenCot,
          cover: suggestedProduct.tenPhu,
          basePrice: Number(phuMaterial["Đơn giá gốc"]) || 0,
          profit: Number(phuMaterial["Lợi nhuận (%)"]) || 0,
          note: String(phuMaterial["Ghi chú"] || ""),
          productId: product.id || "",
          unit_default: String(product["Mặc định đơn vị"] || "m2"),
          created_date: new Date().toISOString(),
        });
      }
      added++;
    });

    if (added > 0) {
      toast.success(`Đã thêm ${added} sản phẩm vào giỏ hàng!`);
    } else {
      toast.error("Không có sản phẩm nào được thêm vào giỏ hàng!");
    }
    resetSurvey();
  };

  const resetSurvey = () => {
    console.log("🔄 Resetting survey...");
    setShowResult(false);
    setCurrentId(1);
    setAnswers({});
    setMatchedSuggestion(null);
    setIsInitialized(false); // Reset để có thể load lại
    setResetTrigger((prev) => prev + 1);
  };

  // Loading state
  if (isLoading && questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            BÁO GIÁ NHANH
          </h1>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            BÁO GIÁ NHANH
          </h1>
          <p className="text-gray-600">
            Nhận báo giá chính xác chỉ trong vài phút
          </p>
        </div>

        {/* Questions */}
        {!showResult && current && (
          <div className="flex flex-col md:flex-row gap-8 bg-white rounded-2xl shadow-lg p-6 md:p-8">
            {/* Sidebar câu hỏi */}
            <div className="md:w-64 w-full mb-6 md:mb-0">
              <QuestionSidebar
                questions={questions}
                answers={answers}
                currentId={currentId}
                setCurrentId={setCurrentId}
                resetTrigger={resetTrigger}
              />
            </div>
            {/* Nội dung câu hỏi */}
            <div className="flex-1 max-w-xl xl:max-w-2xl w-full mx-auto">
              {/* Progress */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-gray-600">
                    Câu hỏi {currentId} / {questions.length}
                  </span>
                  <button
                    onClick={resetSurvey}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold text-sm shadow-sm hover:cursor-pointer hover:bg-blue-700 transition-all duration-150"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                      />
                    </svg>
                    Làm lại
                  </button>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${(currentId / questions.length) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
              {/* Question */}
              <div className="mb-8">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-6 leading-relaxed">
                  {current.question}
                </h2>
                <div className="grid gap-3 max-h-[360px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {current.options.map((opt) => (
                    <button
                      key={opt.value}
                      className={`group p-4 md:p-5 rounded-xl border-2 border-gray-200 hover:cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 text-left flex-shrink-0
                ${
                  answers[currentId] === opt.value
                    ? "border-blue-500 bg-blue-50"
                    : ""
                }
              `}
                      onClick={() => handleSelect(opt.value)}
                    >
                      <div className="flex items-center">
                        <div
                          className={`w-4 h-4 border-2 rounded-full mr-4 transition-colors
                  ${
                    answers[currentId] === opt.value
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-300"
                  }
                `}
                        ></div>
                        <span
                          className={`font-medium
                  ${
                    answers[currentId] === opt.value
                      ? "text-blue-700"
                      : "text-gray-700"
                  }
                  group-hover:text-blue-700
                `}
                        >
                          {opt.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {showResult && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {matchedSuggestion ? (
                <>
                  {/* Header */}
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white">
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">
                      ✨ {matchedSuggestion.title}
                    </h2>
                    <div className="text-2xl md:text-3xl font-bold">
                      {matchedSuggestion.price}
                    </div>
                  </div>

                  <div className="p-6 md:p-8">
                    {/* Product List */}
                    <div className="mb-8">
                      <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                        <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          📋
                        </span>
                        Chi tiết sản phẩm
                      </h4>

                      {(() => {
                        const grouped = matchedSuggestion.products.reduce(
                          (acc, sp) => {
                            if (!acc[sp.danhMuc]) acc[sp.danhMuc] = [];
                            acc[sp.danhMuc].push(sp);
                            return acc;
                          },
                          {} as Record<string, SuggestedProduct[]>
                        );

                        return (
                          <div className="space-y-6">
                            {Object.entries(grouped).map(([danhMuc, items]) => (
                              <div
                                key={danhMuc}
                                className="border rounded-xl overflow-hidden"
                              >
                                <div className="bg-blue-50 px-4 py-3 border-b">
                                  <h5 className="font-bold text-blue-800">
                                    {danhMuc} ({items.length})
                                  </h5>
                                </div>
                                <div className="p-4">
                                  <div className="space-y-4">
                                    {items.map((sp, idx) => {
                                      const found = findProductInData(sp);
                                      if (!found) {
                                        return (
                                          <div
                                            key={idx}
                                            className="p-3 bg-red-50 border border-red-200 rounded-lg"
                                          >
                                            <span className="text-red-600 font-medium">
                                              ⚠️ Không tìm thấy: {sp.dauMuc} -{" "}
                                              {sp.tenCot} - {sp.tenPhu}
                                            </span>
                                          </div>
                                        );
                                      }
                                      const { phuMaterial } = found;
                                      const price =
                                        Number(phuMaterial["Giá báo khách"]) ||
                                        0;
                                      const total = price * sp.soLuong;
                                      return (
                                        <div key={idx}>
                                          <div className="p-3 bg-gray-50 rounded-lg">
                                            <div className="font-semibold text-gray-800 mb-1">
                                              {sp.dauMuc} - {sp.tenCot} -{" "}
                                              {sp.tenPhu}
                                            </div>
                                            <div className="text-sm text-gray-600 mb-1">
                                              SL: {sp.soLuong} ×{" "}
                                              {price.toLocaleString()} đ
                                            </div>
                                            <div className="text-green-700 font-bold">
                                              = {total.toLocaleString()} đ
                                            </div>
                                          </div>
                                          {idx < items.length - 1 && (
                                            <div className="my-2 border-t border-dashed border-gray-500 opacity-80" />
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}

                      {/* Total */}
                      <div className="mt-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                        <div className="text-right">
                          <span className="text-lg font-semibold text-gray-700">
                            Tổng tiền:{" "}
                          </span>
                          <span className="text-2xl font-bold text-green-700">
                            {matchedSuggestion.products
                              .reduce((sum, sp) => {
                                const found = findProductInData(sp);
                                if (!found) return sum;
                                const price =
                                  Number(found.phuMaterial["Giá báo khách"]) ||
                                  0;
                                return sum + price * sp.soLuong;
                              }, 0)
                              .toLocaleString()}{" "}
                            đ
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={addSuggestedProductsToCart}
                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-xl font-semibold hover:cursor-pointer hover:from-green-700 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                      >
                        🛒 Thêm vào giỏ hàng
                      </button>
                      <button
                        onClick={resetSurvey}
                        className="px-6 py-4 bg-gray-500 text-white rounded-xl font-semibold hover:cursor-pointer hover:bg-gray-600 transition-all duration-200"
                      >
                        🔄 Làm lại
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center">
                  <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🤔</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    Chưa có gợi ý phù hợp
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Chưa có gợi ý phù hợp với lựa chọn của bạn. Vui lòng liên hệ
                    để được tư vấn chi tiết!
                  </p>
                  <button
                    onClick={resetSurvey}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:cursor-pointer hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                  >
                    🔄 Thử lại
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickQuote;
