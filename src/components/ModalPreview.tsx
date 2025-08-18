"use client";

import { useState, useEffect, useRef } from "react";
import { useCatalogData } from "@/hooks/useCatalog";
import ModalPreviewContainer from "./ModalPreviewContent";

interface ModalPreviewProps {
  show: boolean;
  onClose: () => void;
  tabIndex?: number;
}

const ModalPreview: React.FC<ModalPreviewProps> = ({
  show,
  onClose,
  tabIndex,
}) => {
  const { catalogData, loading } = useCatalogData();
  const [activeTab, setActiveTab] = useState(-1);
  const [activeSubTab, setActiveSubTab] = useState(0);
  const [prevActiveTab, setPrevActiveTab] = useState(0);

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tabContainerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  const subTabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const subTabContainerRef = useRef<HTMLDivElement>(null);
  const [subIndicatorStyle, setSubIndicatorStyle] = useState({
    left: 0,
    width: 0,
  });

  useEffect(() => {
    if (show) {
      // Reset tab về tabIndex (hoặc 0 nếu không truyền)
      const newTab =
        typeof tabIndex === "number" &&
        tabIndex >= 0 &&
        tabIndex < catalogData.length
          ? tabIndex
          : 0;
      setActiveTab(newTab);

      // Reset subtab về đầu tiên
      setActiveSubTab(0);
      setPrevActiveTab(newTab);
    }
  }, [show, tabIndex, catalogData]);

  useEffect(() => {
    if (tabRefs.current[activeTab]) {
      tabRefs.current[activeTab]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeTab]);

  useEffect(() => {
    const el = tabRefs.current[activeTab];
    if (el && tabContainerRef.current) {
      const containerRect = tabContainerRef.current.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      setIndicatorStyle({
        left:
          elRect.left - containerRect.left + tabContainerRef.current.scrollLeft,
        width: elRect.width,
      });
    }
  }, [activeTab, catalogData]);

  // Sub tab scroll & indicator
  useEffect(() => {
    if (subTabRefs.current[activeSubTab]) {
      subTabRefs.current[activeSubTab]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeSubTab, activeTab]);

  useEffect(() => {
    const el = subTabRefs.current[activeSubTab];
    if (el && subTabContainerRef.current) {
      const containerRect = subTabContainerRef.current.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      setSubIndicatorStyle({
        left:
          elRect.left -
          containerRect.left +
          subTabContainerRef.current.scrollLeft,
        width: elRect.width,
      });
    }
  }, [activeSubTab, activeTab, catalogData]);

  const handleTabChange = (newTab: number) => {
    setPrevActiveTab(activeTab);
    setActiveTab(newTab);
  };

  // Reset subtab khi đổi tab cha
  useEffect(() => {
    if (prevActiveTab !== activeTab) {
      const currentSubTabStyle = catalogData[prevActiveTab]?.listContents
        ?.filter((item) => item.matchingPoint >= 5)
        ?.sort((a, b) => {
          if (b.matchingPoint !== a.matchingPoint) {
            return b.matchingPoint - a.matchingPoint;
          }
          return a.style.localeCompare(b.style, "vi", { sensitivity: "base" });
        })?.[activeSubTab]?.style;

      const newFilteredSubTabs =
        catalogData[activeTab]?.listContents
          ?.filter((item) => item.matchingPoint >= 5)
          ?.sort((a, b) => {
            if (b.matchingPoint !== a.matchingPoint) {
              return b.matchingPoint - a.matchingPoint;
            }
            return a.style.localeCompare(b.style, "vi", {
              sensitivity: "base",
            });
          }) || [];

      const foundIndex = newFilteredSubTabs.findIndex(
        (item) => item.style === currentSubTabStyle
      );

      setActiveSubTab(foundIndex >= 0 ? foundIndex : 0);
      setPrevActiveTab(activeTab);
    }
  }, [activeTab, catalogData]);

  const filteredSubTabs =
    catalogData[activeTab]?.listContents
      ?.filter((item) => item.matchingPoint >= 5)
      ?.sort((a, b) => {
        if (b.matchingPoint !== a.matchingPoint) {
          return b.matchingPoint - a.matchingPoint;
        }
        return a.style.localeCompare(b.style, "vi", { sensitivity: "base" });
      }) || [];

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-[95vw] sm:max-w-2xl lg:max-w-7xl p-0 relative max-h-[95vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 hover:cursor-pointer z-10"
          onClick={onClose}
          aria-label="Đóng"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <div className="flex-1 overflow-y-auto max-w-full">
          <div className="max-w-7xl mx-auto py-2 sm:py-4 px-2 sm:px-4 lg:px-6">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-4 text-gray-800">
              PREVIEW
            </h1>
            {loading ? (
              <div className="min-h-[60vh] sm:min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-2 sm:px-4">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 border-b-2 border-blue-600 mx-auto mb-2 sm:mb-4"></div>
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-1 sm:mb-2">
                    Preview
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600">
                    Đang tải dữ liệu...
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Tab cha */}
                <div
                  ref={tabContainerRef}
                  className="relative flex overflow-x-auto whitespace-nowrap gap-1 sm:gap-2 mb-1 sm:mb-2 bg-[#f4f8ff] px-1 sm:px-2 rounded-lg scrollbar-hide"
                  style={{
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                  }}
                >
                  <div
                    className="absolute top-0 left-0 h-full transition-all duration-300 pointer-events-none"
                    style={{
                      left: indicatorStyle.left,
                      width: indicatorStyle.width,
                      background: "#2563eb",
                      borderRadius: "9999px",
                      zIndex: 0,
                    }}
                  />
                  {catalogData.map((style, idx) => (
                    <button
                      key={style.name}
                      ref={(el) => {
                        tabRefs.current[idx] = el;
                      }}
                      className={`relative px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 rounded-full font-medium sm:font-semibold transition-all duration-200 z-10 cursor-pointer text-xs sm:text-sm lg:text-base
            ${
              activeTab === idx
                ? "text-white"
                : "bg-transparent text-[#1d3557] hover:bg-[#e0eaff] hover:text-[#1d4ed8]"
            }`}
                      style={{
                        background: "transparent",
                        minWidth: "fit-content",
                        whiteSpace: "nowrap",
                      }}
                      onClick={() => handleTabChange(idx)}
                    >
                      {style.name}
                    </button>
                  ))}
                </div>

                {/* Tab con */}
                {catalogData[activeTab] && (
                  <div
                    ref={subTabContainerRef}
                    className="relative flex overflow-x-auto whitespace-nowrap gap-1 sm:gap-2 bg-[#f4f8ff] px-1 sm:px-2 rounded-lg mb-2 sm:mb-4 scrollbar-hide"
                    style={{
                      scrollbarWidth: "none",
                      msOverflowStyle: "none",
                    }}
                  >
                    <div
                      className="absolute bottom-0 left-0 h-0.5 sm:h-1 transition-all duration-300 pointer-events-none"
                      style={{
                        left: subIndicatorStyle.left,
                        width: subIndicatorStyle.width,
                        background: "#2563eb",
                        borderRadius: "9999px",
                        zIndex: 0,
                      }}
                    />
                    {filteredSubTabs.map((item, idx) => (
                      <button
                        key={item.style}
                        ref={(el) => {
                          subTabRefs.current[idx] = el;
                        }}
                        className={`relative px-2 sm:px-3 lg:px-5 py-1.5 sm:py-2 font-medium rounded-none bg-transparent z-10 transition-all duration-200 hover:cursor-pointer text-xs sm:text-sm lg:text-base
        ${
          activeSubTab === idx
            ? "text-[#2563eb]"
            : "text-[#1d3557] hover:text-[#2563eb] hover:bg-[#e0eaff]"
        }`}
                        style={{
                          minWidth: "fit-content",
                          whiteSpace: "nowrap",
                        }}
                        onClick={() => setActiveSubTab(idx)}
                      >
                        {item.style}
                      </button>
                    ))}
                  </div>
                )}

                {/* Content */}
                {filteredSubTabs[activeSubTab] && (
                  <div className="w-full">
                    <ModalPreviewContainer
                      item={filteredSubTabs[activeSubTab]}
                      activeTab={activeTab}
                      activeSubTab={activeSubTab}
                      tabName={catalogData[activeTab].name}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalPreview;
