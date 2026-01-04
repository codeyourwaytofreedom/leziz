export type LocalizedText = string | Record<string, string>;

export type MenuItem = {
  id: string;
  name: LocalizedText;
  price: number;
  size?: LocalizedText;
  description?: LocalizedText;
  ingredients?: LocalizedText[];
};

export type Category = {
  id: string;
  title: LocalizedText;
  items: MenuItem[];
};

export type Menu = {
  categories: Category[];
  menuConfig?: {
    withImages?: boolean;
    menuBackgroundColor?: string;
    currency?: string;
    menuImage?: string;
  };
  venueName?: LocalizedText;
};
