interface CatalogStyle {
  name: string;
  listContents: CatalogItem[];
}

interface CatalogItem {
  style: string;
  images: string[];
  styleDescription: string;
  matchingPoint: number;
  matchingPointExplanation: string;
  groundsSelectionData: string[];
}

export type { CatalogStyle, CatalogItem };