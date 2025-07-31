"use client";

import HomeContainer from "@/components/Home";
import { useRouter } from "next/navigation"; // Sửa import

export default function Home() {
  const router = useRouter();

  const handleCategoriesClick = () => {
    router.push("/categories");
  };

  return (
    <div>
      <HomeContainer onCategoriesClick={handleCategoriesClick} />
    </div>
  );
}
