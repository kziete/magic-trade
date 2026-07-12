import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface Card {
  id: number;
  oracle_id: string;
  name: string;
  variants_url: string;
}

export interface Available {
  id: number;
  variant_id: number;
  card_name: string;
  set_name: string;
  image: string;
  finish: string;
  condition: string;
  username: string;
}

export interface Variant {
  id: number;
  scryfall_id: string;
  collector_number: string;
  image: string;
  set_name: string;
  set_short: string;
  finishes: string[];
}

export interface AvailableFilters {
  cardId: number;
  variant?: number;
  finish?: string;
  condition?: string;
}

export const cardsApi = createApi({
  reducerPath: "cardsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:9000/api/",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    searchCards: builder.query<Card[], string>({
      query: (searchQuery) => `cards/?query=${encodeURIComponent(searchQuery)}`,
    }),
    getCard: builder.query<Card, number>({
      query: (cardId) => `cards/${cardId}/`,
    }),
    getVariants: builder.query<Variant[], number>({
      query: (cardId) => `cards/${cardId}/variants/`,
    }),
    getAvailable: builder.query<Available[], AvailableFilters>({
      query: ({ cardId, variant, finish, condition }) => {
        const params = new URLSearchParams();
        if (variant) params.append("variant", variant.toString());
        if (finish) params.append("finish", finish);
        if (condition) params.append("condition", condition);
        const queryString = params.toString();
        return `cards/${cardId}/available/${queryString ? `?${queryString}` : ""}`;
      },
    }),
    getInventory: builder.query<Available[], void>({
      query: () => "inventory/",
    }),
  }),
});

export const {
  useSearchCardsQuery,
  useGetCardQuery,
  useGetVariantsQuery,
  useGetAvailableQuery,
  useGetInventoryQuery,
} = cardsApi;
