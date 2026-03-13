export interface ShoppingList {
  id: string;
  name: string;
  createdAt: number;
  itemCount: number;
  activeCount: number;
}

export interface ShoppingItem {
  id: string;
  listId: string;
  name: string;
  quantity: string | null;
  bought: boolean;
  createdAt: number;
  boughtAt: number | null;
}
