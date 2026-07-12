import {
  Home,
  Zap,
  Utensils,
  Car,
  Heart,
  Film,
  BookOpen,
  Package,
  Shield,
  ShoppingBasket,
  Beef,
  ShoppingBag,
  Tag,
  type LucideIcon,
} from "lucide-react";

// Maps the seeded system-category names to lucide icons (the DS moved from
// emojis to icons). Couple-created categories fall back to a neutral tag.
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  vivienda: Home,
  servicios: Zap,
  comida: Utensils,
  transporte: Car,
  salud: Heart,
  entretenimiento: Film,
  educacion: BookOpen,
  otros: Package,
  seguros: Shield,
  supermercado: ShoppingBasket,
  carnes: Beef,
  mercadolibre: ShoppingBag,
};

function normalize(name: string): string {
  return name.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function getCategoryIcon(name: string): LucideIcon {
  return CATEGORY_ICONS[normalize(name)] ?? Tag;
}
