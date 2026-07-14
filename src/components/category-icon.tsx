import {
  Banknote,
  Car,
  Circle,
  Coins,
  CreditCard,
  Dumbbell,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  House,
  Landmark,
  Music,
  PawPrint,
  PiggyBank,
  Plane,
  Popcorn,
  Shirt,
  ShoppingCart,
  Smartphone,
  Utensils,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  banknote: Banknote,
  coins: Coins,
  fuel: Fuel,
  car: Car,
  landmark: Landmark,
  "credit-card": CreditCard,
  "shopping-cart": ShoppingCart,
  utensils: Utensils,
  popcorn: Popcorn,
  "heart-pulse": HeartPulse,
  shirt: Shirt,
  house: House,
  gift: Gift,
  "piggy-bank": PiggyBank,
  "gamepad-2": Gamepad2,
  plane: Plane,
  "graduation-cap": GraduationCap,
  smartphone: Smartphone,
  dumbbell: Dumbbell,
  "paw-print": PawPrint,
  music: Music,
  circle: Circle,
};

export function CategoryIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICON_MAP[name] ?? Circle;
  return <Icon className={className} />;
}
