interface CatalogStyle {
  name: string;
  listContents: CatalogItem[];
  groundsSelectionData: string[];
}

interface CatalogItem {
  style: string;
  images: string[];
  styleDescription: string;
  matchingPoint: number;
  matchingPointExplanation: string;
}

export type { CatalogStyle, CatalogItem };