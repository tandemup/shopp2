import { CurrencyCode } from "./Currency";
import { Item } from "./Item";

export interface List {
  id: string;
  name: string;
  createdAt: number;
  currency: CurrencyCode;
  items: Item[];
  storeId?: string;
  archived?: boolean;
}
