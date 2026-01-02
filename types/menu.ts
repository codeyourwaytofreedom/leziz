export type LocalizedText = string | Record<string, string>;

export type MenuItem = {
  id: string;
  name: LocalizedText;
  price: number;
  description?: LocalizedText;
  ingredients?: string[];
};

export type Category = {
  id: string;
  title: LocalizedText;
  items: MenuItem[];
};

export type Menu = {
  categories: Category[];
};
