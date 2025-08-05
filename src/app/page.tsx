import HomeClient from "@/components/HomeClient";

export const metadata = {
  title: "Báo giá nội thất - Thiết kế & Thi công chuyên nghiệp",
  description:
    "Báo giá nội thất, thiết kế và thi công nội thất chuyên nghiệp, uy tín, nhanh chóng. Nhận báo giá miễn phí ngay!",
  openGraph: {
    title: "Báo giá nội thất - Thiết kế & Thi công chuyên nghiệp",
    description:
      "Báo giá nội thất, thiết kế và thi công nội thất chuyên nghiệp, uy tín, nhanh chóng.",
    url: "https://yourdomain.com/",
    type: "website",
    images: [
      {
        url: "/images/thiet-ke-noi-that-dep-dong-gia.jpg",
        width: 1200,
        height: 630,
        alt: "Thiết kế nội thất đẹp đồng giá",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://yourdomain.com/",
  },
};

export default function HomePage() {
  return <HomeClient />;
}
