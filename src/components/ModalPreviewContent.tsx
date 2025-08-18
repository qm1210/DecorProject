"use client";

import { useState, useEffect, useRef } from "react";
import { CatalogItem } from "@/models/Catalog.model";
import Image from "next/image";

interface Props {
  item: CatalogItem;
  activeTab: number;
  activeSubTab: number;
  tabName: string;
}

const ModalPreviewContainer: React.FC<Props> = ({
  item,
  activeTab,
  activeSubTab,
  tabName,
}) => {
  const [currentImg, setCurrentImg] = useState(0);
  const sliderInterval = useRef<NodeJS.Timeout | null>(null);

  const thumbnailRefs = useRef<(HTMLDivElement | null)[]>([]);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentImg(0);
  }, [activeTab, activeSubTab]);

  // Hàm reset interval
  const resetSliderInterval = () => {
    if (sliderInterval.current) clearInterval(sliderInterval.current);
    sliderInterval.current = setInterval(() => {
      setCurrentImg((prev) => (prev === item.images.length - 1 ? 0 : prev + 1));
    }, 5000);
  };

  // Tự động chuyển ảnh slider
  useEffect(() => {
    if (!item.images || item.images.length === 0) return;
    resetSliderInterval();
    return () => {
      if (sliderInterval.current) clearInterval(sliderInterval.current);
    };
  }, [item.images]);

  // Chuyển ảnh khi click nút/thumnail và reset interval
  const goToImg = (idx: number) => {
    setCurrentImg(idx);
    resetSliderInterval();
  };
  const prevImg = () => {
    setCurrentImg((prev) => (prev === 0 ? item.images.length - 1 : prev - 1));
    resetSliderInterval();
  };
  const nextImg = () => {
    setCurrentImg((prev) => (prev === item.images.length - 1 ? 0 : prev + 1));
    resetSliderInterval();
  };

  // Tự động scroll thumbnail active vào giữa
  useEffect(() => {
    const el = thumbnailRefs.current[currentImg];
    const container = thumbnailContainerRef.current;
    if (el && container) {
      const elLeft = el.offsetLeft;
      const elWidth = el.offsetWidth;
      const containerWidth = container.offsetWidth;
      const scrollTo = elLeft - containerWidth / 2 + elWidth / 2;
      container.scrollTo({
        left: scrollTo,
        behavior: "smooth",
      });
    }
  }, [currentImg]);

  return (
    <div className="mb-4 mt-0.5 p-3 sm:p-4 lg:p-6 border border-[#dadce0] rounded-xl sm:rounded-2xl bg-white shadow-md hover:shadow-lg transition-shadow">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="w-full sm:w-auto">
          <h2 className="font-semibold text-base sm:text-lg text-[#22223b] mb-2">
            Điểm phù hợp:
          </h2>
          <div className="flex gap-0.5 sm:gap-1 flex-wrap">
            {[...Array(10)].map((_, idx) => (
              <svg
                key={idx}
                xmlns="http://www.w3.org/2000/svg"
                fill={idx < item.matchingPoint ? "#FFD700" : "#E5E7EB"}
                viewBox="0 0 24 24"
                stroke="#E5E7EB"
                className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M12 17.75l-6.172 3.245 1.179-6.88L2.5 9.755l6.9-1.002L12 2.25l2.6 6.503 6.9 1.002-5.507 4.36 1.179 6.88z"
                />
              </svg>
            ))}
          </div>
        </div>
      </div>

      {/* Slider ảnh */}
      {item.images && item.images.length > 0 && (
        <div className="mt-4 sm:mt-6">
          <div className="relative w-full h-[250px] sm:h-[350px] lg:h-[500px] rounded-lg overflow-hidden mb-3 flex justify-center items-center">
            <Image
              src={item.images[currentImg]}
              alt={`Ảnh ${currentImg + 1}`}
              fill
              className="object-cover rounded-lg"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px"
              priority={currentImg === 0}
            />
            {/* Nút điều hướng - chỉ hiện trên desktop */}
            <button
              onClick={prevImg}
              className="hidden sm:block absolute left-2 top-1/2 -translate-y-1/2 bg-[#22223b]/60 text-white rounded-full p-2 lg:p-4 hover:bg-[#2563eb]/80 hover:cursor-pointer transition"
              style={{ zIndex: 2 }}
              aria-label="Ảnh trước"
            >
              <span className="text-lg lg:text-xl">&#8249;</span>
            </button>
            <button
              onClick={nextImg}
              className="hidden sm:block absolute right-2 top-1/2 -translate-y-1/2 bg-[#22223b]/60 text-white rounded-full p-2 lg:p-4 hover:bg-[#2563eb]/80 hover:cursor-pointer transition"
              style={{ zIndex: 2 }}
              aria-label="Ảnh tiếp theo"
            >
              <span className="text-lg lg:text-xl">&#8250;</span>
            </button>
          </div>

          {/* Thumbnail - hiện ở tất cả các breakpoint */}
          <div
            ref={thumbnailContainerRef}
            className="flex gap-2 lg:gap-4 justify-start overflow-x-auto py-2 thumbnail-scroll"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {item.images.map((img, idx) => (
              <div
                key={img + idx}
                ref={(el) => {
                  thumbnailRefs.current[idx] = el;
                }}
                className={`w-16 sm:w-20 lg:w-24 aspect-video rounded-lg overflow-hidden cursor-pointer border transition flex-shrink-0
                  ${
                    currentImg === idx
                      ? "border-[#2563eb] shadow"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                onClick={() => goToImg(idx)}
              >
                <Image
                  src={img}
                  alt={`Thumb ${idx + 1}`}
                  width={96}
                  height={54}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content sections */}
      <div className="mt-4 sm:mt-6">
        <h2 className="font-semibold text-base sm:text-lg mb-2 text-[#22223b]">
          Mô tả phong cách:
        </h2>
        <p className="text-justify mb-4 sm:mb-6 text-gray-800 text-sm sm:text-base leading-relaxed">
          {item.styleDescription}
        </p>
      </div>

      <div>
        <h2 className="font-semibold text-base sm:text-lg mb-2 text-[#22223b]">
          Giải thích điểm phù hợp:
        </h2>
        <ul className="text-gray-800 text-sm sm:text-base leading-relaxed">
          {item.matchingPointExplanation.split("\n").map((text, idx) => (
            <li key={idx} className="mb-1 sm:mb-2">
              {text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ModalPreviewContainer;
