"use client";

import Link from "next/link";

interface ArticleCardProps {
  title: string;
  img: string;
  desc: string;
  link: string;
}

interface HomeContainerProps {
  onCategoriesClick: () => void;
}

const ArticleCard = ({ title, img, desc, link }: ArticleCardProps) => (
  <Link
    href={link}
    className="rounded-2xl bg-white/90 p-6 sm:p-8 shadow-xl hover:cursor-pointer hover:shadow-2xl hover:scale-[1.04] hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 transition-all duration-200 border border-blue-100 flex flex-col items-center max-w-sm mx-auto"
    target="_blank" // Mở báo ngoài ở tab mới
    rel="noopener noreferrer"
  >
    <img
      src={img}
      alt={title}
      className="w-full h-48 object-cover rounded-lg mb-5 shadow-md"
    />
    <h3 className="text-xl font-bold text-blue-700 mb-2 text-center">
      {title}
    </h3>
    <p className="text-gray-600 text-base text-center">{desc}</p>
  </Link>
);

const articles = [
  {
    title: "Bài viết 1",
    img: "https://i1-vnexpress.vnecdn.net/2025/07/28/1-1753690846.jpg?w=1200&h=0&q=100&dpr=2&fit=crop&s=5ieIZq0EiIMaZrvIVQxavA",
    desc: "Penthouse 500 m2 ở Hải Phòng ưu tiên lối sống tinh giản",
    link: "https://vnexpress.net/penthouse-500-m2-o-hai-phong-uu-tien-loi-song-tinh-gian-4919866.html",
  },
  {
    title: "Bài viết 2",
    img: "https://i1-vnexpress.vnecdn.net/2025/07/11/Picture1-1752163229-2274-1752196406.jpg?w=1020&h=0&q=100&dpr=1&fit=crop&s=lj9YctqmDCYdKm6psCiMIw",
    desc: "Ưu điểm của đá thạch anh nhân tạo Caslaquartz trong xây dựng",
    link: "https://vnexpress.net/uu-diem-cua-da-thach-anh-nhan-tao-caslaquartz-trong-xay-dung-4892113.html",
  },
  {
    title: "Bài viết 3",
    img: "https://i1-kinhdoanh.vnecdn.net/2025/07/07/image001-1751861198-1751861217-5459-1751861391.png?w=1020&h=0&q=100&dpr=1&fit=crop&s=k5IbiOODTq3V4-uVSlPVTg",
    desc: "Chiến lược giúp Caesar Việt Nam mở rộng thị trường",
    link: "https://vnexpress.net/chien-luoc-giup-caesar-viet-nam-mo-rong-thi-truong-4911041.html",
  },
];

const HomeContainer = ({ onCategoriesClick }: HomeContainerProps) => {
  return (
    <section className="pt-8 flex flex-col gap-8 min-h-[60vh] items-center justify-center px-2 sm:px-4 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="w-full max-w-xl rounded-3xl bg-white/80 shadow-2xl border border-blue-100 p-6 sm:p-10 backdrop-blur-md">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 text-center drop-shadow-lg tracking-tight">
          BÁO GIÁ NỘI THẤT
        </h1>
        <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-gray-700 text-center">
          Chúng tôi cung cấp dịch vụ thiết kế và thi công nội thất chuyên
          nghiệp, uy tín và nhanh chóng.
        </p>
        <button
          onClick={onCategoriesClick}
          className="mt-6 sm:mt-10 w-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 px-6 py-3 sm:px-8 sm:py-4 text-white text-base sm:text-lg font-bold shadow-lg hover:from-blue-700 hover:to-indigo-700 hover:cursor-pointer transition-all duration-200 tracking-wide hover:-translate-y-1"
        >
          TẠO BÁO GIÁ NGAY
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-6xl pb-8">
        {articles.map((article, index) => (
          <ArticleCard key={index} {...article} />
        ))}
      </div>
    </section>
  );
};

export default HomeContainer;
