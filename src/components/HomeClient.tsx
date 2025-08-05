"use client";

import { useRouter } from "next/navigation";
import HomeContainer from "@/components/Home";

export default function HomeClient() {
  const router = useRouter();

  const handleCategoriesClick = () => {
    router.push("/categories");
  };

  return <HomeContainer onCategoriesClick={handleCategoriesClick} />;
}
