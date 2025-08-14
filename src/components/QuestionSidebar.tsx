import { useEffect, useState } from "react";

interface Props {
  questions: {
    id: number;
    question: string;
    options?: { value: string; label: string }[];
  }[];
  answers: { [key: number]: string };
  currentId: number;
  setCurrentId: (id: number) => void;
  resetTrigger?: number;
}

const QuestionSidebar: React.FC<Props> = ({
  questions,
  answers,
  currentId,
  setCurrentId,
  resetTrigger = 0,
}) => {
  // Khởi tạo maxReachedId là currentId
  const [maxReachedId, setMaxReachedId] = useState(currentId);

  // Chỉ tăng maxReachedId khi chuyển tới câu lớn hơn
  useEffect(() => {
    setMaxReachedId((prev) => (currentId > prev ? currentId : prev));
  }, [currentId]);

  // Reset maxReachedId khi resetTrigger thay đổi
  useEffect(() => {
    if (resetTrigger > 0) {
      // Chỉ reset khi resetTrigger > 0
      setMaxReachedId(1);
    }
  }, [resetTrigger]);

  const currentQuestions = questions.filter((q) => q.id <= maxReachedId);

  return (
    <div className="w-80 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 rounded-2xl shadow-xl border border-blue-100/50 p-4 sticky top-8 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-sm"></div>
        <h3 className="font-bold text-gray-800 text-sm tracking-wide">
          TIẾN TRÌNH CÂU HỎI
        </h3>
      </div>

      {/* Questions List */}
      <div className="space-y-2">
        {currentQuestions.map((q, idx) => {
          const isActive = currentId === q.id;
          const isAnswered = !!answers[q.id];
          const selectedOption = q.options?.find(
            (opt) => opt.value === answers[q.id]
          );

          return (
            <div key={q.id} className="relative">
              <button
                className={`w-full text-left p-2 rounded-xl border transition-all duration-300 transform hover:scale-[1.01] hover:cursor-pointer group
                  ${
                    isActive
                      ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 shadow-lg ring-2 ring-blue-200/50"
                      : isAnswered
                      ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 shadow-md hover:shadow-lg"
                      : "bg-white/70 border-gray-200 shadow-sm hover:bg-blue-50/50 hover:border-blue-200 hover:shadow-md"
                  }`}
                onClick={() => setCurrentId(q.id)}
                disabled={isActive}
              >
                <div className="flex items-start gap-3">
                  {/* Enhanced Badge */}
                  <div
                    className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm transition-all duration-300
                    ${
                      isActive
                        ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white ring-2 ring-blue-200"
                        : isAnswered
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                        : "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-600 group-hover:from-blue-400 group-hover:to-indigo-400 group-hover:text-white"
                    }`}
                  >
                    {isAnswered ? (
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      idx + 1
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Question Title */}
                    <div
                      className={`font-semibold text-sm mb-2 leading-relaxed
                      ${
                        isActive
                          ? "text-blue-700"
                          : isAnswered
                          ? "text-green-700"
                          : "text-gray-700 group-hover:text-blue-700"
                      }`}
                    >
                      {q.question || "Câu hỏi"}
                    </div>

                    {/* Selected Answer */}
                    {selectedOption && (
                      <div className="inline-flex items-center gap-1.5 text-xs bg-white/80 text-gray-600 px-3 py-1.5 rounded-lg border border-gray-200/50 shadow-sm">
                        <svg
                          className="w-3 h-3 text-green-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="truncate max-w-[140px]">
                          {selectedOption.label}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </button>

              {/* Enhanced Connector Line */}
              {idx < currentQuestions.length - 1 && (
                <div className="absolute left-9 top-16 w-0.5 h-3 bg-gradient-to-b from-blue-300/50 via-indigo-300/30 to-transparent"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionSidebar;
