"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SortField, SortOrder } from "@/lib/api";

export interface UseSortParamsResult {
  sort: SortField | undefined;
  order: SortOrder;
  onSortChange: (field: SortField) => void;
}

const VALID_SORT_FIELDS: SortField[] = ["card_name", "set_name", "price"];

export function useSortParams(): UseSortParamsResult {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sortParam = searchParams.get("sort");
  const sort = VALID_SORT_FIELDS.includes(sortParam as SortField)
    ? (sortParam as SortField)
    : undefined;
  const order: SortOrder = searchParams.get("order") === "desc" ? "desc" : "asc";

  const onSortChange = (field: SortField) => {
    const params = new URLSearchParams(searchParams.toString());
    const nextOrder: SortOrder = sort === field && order === "asc" ? "desc" : "asc";
    params.set("sort", field);
    params.set("order", nextOrder);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  return { sort, order, onSortChange };
}
