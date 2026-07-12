import { describe, it, expect } from "vitest";
import { Home, ShoppingBasket, BookOpen, Beef, Tag } from "lucide-react";
import { getCategoryIcon } from "../category-icons";

describe("getCategoryIcon", () => {
  it("maps known system categories to their lucide icon", () => {
    expect(getCategoryIcon("Vivienda")).toBe(Home);
    expect(getCategoryIcon("Supermercado")).toBe(ShoppingBasket);
    expect(getCategoryIcon("Carnes")).toBe(Beef);
  });

  it("normalizes case, accents and surrounding whitespace", () => {
    expect(getCategoryIcon("EDUCACIÓN")).toBe(BookOpen);
    expect(getCategoryIcon("  educacion  ")).toBe(BookOpen);
  });

  it("falls back to Tag for unknown or empty categories", () => {
    expect(getCategoryIcon("Categoría inventada")).toBe(Tag);
    expect(getCategoryIcon("")).toBe(Tag);
  });
});
