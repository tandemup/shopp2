// src/store/lists/types.ts
export type Item = {
  id: string;
  name: string;
  barcode?: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
  promoId?: string;
  checked: boolean;
};

export type ShoppingList = {
  id: string;
  name: string;
  createdAt: number;
  currency: string;
  storeId?: string;
  archived?: boolean;
  items: Item[];
};
