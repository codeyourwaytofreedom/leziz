export type MenuItem = {
  id: string;
  name: string;
  price: number;
  description?: string;
};

export type Category = {
  id: string;
  title: string;
  items: MenuItem[];
};

export type Menu = {
  categories: Category[];
};
