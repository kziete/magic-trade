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
}

export const cardsApi = createApi({
  reducerPath: "cardsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:9000/api/" }),
  endpoints: (builder) => ({
    searchCards: builder.query<Card[], string>({
      query: (searchQuery) => `cards/?query=${encodeURIComponent(searchQuery)}`,
    }),
    getAvailable: builder.query<Available[], number>({
      query: (cardId) => `cards/${cardId}/available/`,
    }),
  }),
});

export const { useSearchCardsQuery, useGetAvailableQuery } = cardsApi;
