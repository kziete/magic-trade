import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface Card {
  id: number;
  oracle_id: string;
  name: string;
  variants_url: string;
}

export const cardsApi = createApi({
  reducerPath: "cardsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:9000/api/" }),
  endpoints: (builder) => ({
    searchCards: builder.query<Card[], string>({
      query: (searchQuery) => `cards/?query=${encodeURIComponent(searchQuery)}`,
    }),
  }),
});

export const { useSearchCardsQuery } = cardsApi;
