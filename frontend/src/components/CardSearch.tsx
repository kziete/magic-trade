"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Autocomplete, Loader } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useSearchCardsQuery } from "@/lib/api";

interface CardSearchProps {
  initialValue?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

export default function CardSearch({
  initialValue = "",
  size = "lg",
}: CardSearchProps) {
  const router = useRouter();
  const [search, setSearch] = useState(initialValue);
  const [debouncedSearch] = useDebouncedValue(search, 300);

  const { data: cards, isFetching } = useSearchCardsQuery(debouncedSearch, {
    skip: debouncedSearch.length < 2,
  });

  const options =
    cards?.map((card) => ({
      value: `${card.id}`,
      label: card.name,
    })) ?? [];

  const handleSelect = (value: string) => {
    const card = cards?.find((c) => c.id.toString() === value);
    if (card) {
      router.push(`/cards/${card.id}`);
    }
  };

  return (
    <Autocomplete
      placeholder="Buscar cartas..."
      size={size}
      value={search}
      onChange={setSearch}
      onOptionSubmit={handleSelect}
      data={options}
      rightSection={isFetching ? <Loader size="xs" /> : null}
    />
  );
}
