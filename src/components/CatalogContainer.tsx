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

const CatalogContainer: React.FC<Props> = ({
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
      // Tính vị trí cần scroll để thumbnail active vào giữa
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
    <div className="mb-4 mt-0.5 p-4 border border-[#dadce0] rounded-2xl bg-white shadow-md hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-xl mb-2 text-[#22223b]">
          {tabName} phong cách {item.style.toLowerCase()}
        </h2>
        <button className="px-5 py-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold rounded-lg shadow hover:from-blue-600 hover:to-blue-800 hover:cursor-pointer transition duration-200 hover:scale-105">
          Báo giá nhanh
        </button>
      </div>
      {/* Slider ảnh */}
      {item.images && item.images.length > 0 && (
        <div className="mt-6 mx-20">
          <div className="relative w-full h-[500px] rounded-lg overflow-hidden mb-3 flex justify-center items-center">
            <Image
              src={item.images[currentImg]}
              alt={`Ảnh ${currentImg + 1}`}
              fill
              className="object-cover rounded-lg"
              sizes="(max-width: 1200px) 100vw, 1200px"
              priority
            />
            {/* Nút trái */}
            <button
              onClick={prevImg}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-[#22223b]/60 text-white rounded-full p-4 hover:bg-[#2563eb]/80 hover:cursor-pointer transition"
              style={{ zIndex: 2 }}
            >
              &#8249;
            </button>
            {/* Nút phải */}
            <button
              onClick={nextImg}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#22223b]/60 text-white rounded-full p-4 hover:bg-[#2563eb]/80 hover:cursor-pointer transition"
              style={{ zIndex: 2 }}
            >
              &#8250;
            </button>
          </div>
          {/* Thumbnail */}
          <div
            ref={thumbnailContainerRef}
            className="flex gap-4 justify-start overflow-x-auto py-2 thumbnail-scroll"
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
                className={`w-28 aspect-video rounded-lg overflow-hidden cursor-pointer border transition
                  ${
                    currentImg === idx
                      ? "border-[#2563eb] shadow"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                onClick={() => goToImg(idx)}
                style={{
                  minWidth: "120px",
                  height: "auto",
                }}
              >
                <Image
                  src={img}
                  alt={`Thumb ${idx + 1}`}
                  width={120}
                  height={67}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
      <div>
        <h2 className="font-semibold text-lg mb-1 text-[#22223b]">
          Mô tả phong cách:
        </h2>
        <p className="text-justify mb-6 text-gray-800">
          {item.styleDescription}
        </p>
      </div>
      <div>
        <h2 className="font-semibold text-lg mb-1 text-[#22223b]">
          Điểm phù hợp:
        </h2>
        <div className="flex gap-1 mb-6">
          {[...Array(10)].map((_, idx) => (
            <svg
              key={idx}
              xmlns="http://www.w3.org/2000/svg"
              fill={idx < item.matchingPoint ? "#FFD700" : "#E5E7EB"} // vàng cho sao đã chọn, xám cho sao chưa chọn
              viewBox="0 0 24 24"
              stroke="#E5E7EB"
              className="w-10 h-10"
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
      <div>
        <h2 className="font-semibold text-lg mb-2 text-[#22223b]">
          Giải thích điểm phù hợp:
        </h2>
        <ul className="text-gray-800">
          {item.matchingPointExplanation.split("\n").map((text, idx) => (
            <li key={idx} className="mb-1">
              {text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CatalogContainer;
