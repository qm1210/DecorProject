import { useState, useEffect } from "react";
import axios from "axios";
import { CatalogStyle } from "@/models/Catalog.model";

export const useCatalogData = () => {
  const [catalogData, setCatalogData] = useState<CatalogStyle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCatalogData = async () => {
      try {
        const response = await axios.get("/data/ArchitectureCatalog.json");
        setCatalogData(response.data);
      } catch (error) {
        console.error("Error fetching catalog data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalogData();
  }, []);

  return { catalogData, loading };
};