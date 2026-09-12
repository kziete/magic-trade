import { CardPrice } from "@/lib/api";

export function formatUsdPrice(value: string | null | undefined): string | null {
  if (!value) return null;
  const amount = parseFloat(value);
  if (Number.isNaN(amount)) return null;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export function priceForFinish(
  price: CardPrice | null | undefined,
  finish: string | null | undefined
): string | null {
  if (!price) return null;
  return formatUsdPrice(finish === "foil" ? price.usd_foil : price.usd);
}
