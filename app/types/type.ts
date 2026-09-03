export type Dish = {
  id: string | number;
  name: string;
  price: string;
  cal: string;
  time: string;
  rating: string;
  restaurant: string;
  tags: string;
  description: string;
  img: string;
  custom_prep_time?: number;
  liked: boolean;
  hasVariants?: boolean;
};

export type Address = {
  id: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
};