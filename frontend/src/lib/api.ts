import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: "/api/",
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const refreshToken = localStorage.getItem("refreshToken");

    if (refreshToken) {
      const refreshResult = await fetchBaseQuery({
        baseUrl: "/api/auth/",
      })(
        {
          url: "refresh/",
          method: "POST",
          body: { refresh: refreshToken },
        },
        api,
        extraOptions
      );

      if (refreshResult.data) {
        const data = refreshResult.data as { access: string };
        localStorage.setItem("token", data.access);
        result = await baseQuery(args, api, extraOptions);
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
      }
    }
  }

  return result;
};

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
  language: string;
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

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface CreateAvailableRequest {
  variant: number;
  finish: string;
  condition: string;
  language: string;
}

export interface Wanted {
  id: number;
  variant_id: number | null;
  card_name: string;
  set_name: string | null;
  image: string | null;
  finish: string | null;
  username: string;
}

export interface CreateWantedRequest {
  card: number;
  variant?: number;
  finish?: string;
}

export interface ImportInventoryResult {
  created: number;
  skipped: number;
  errors: string[];
}

export interface UserProfile {
  username: string;
  phone: string | null;
  contact_email: string | null;
  facebook_url: string | null;
}

export const cardsApi = createApi({
  reducerPath: "cardsApi",
  baseQuery: baseQueryWithReauth,
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
    getLatestAvailable: builder.query<Available[], void>({
      query: () => "available/latest/",
    }),
    getInventory: builder.query<PaginatedResponse<Available>, { page?: number; query?: string }>({
      query: ({ page = 1, query } = {}) => {
        const params = new URLSearchParams({ page: page.toString() });
        if (query) params.append("query", query);
        return `inventory/?${params.toString()}`;
      },
    }),
    addToInventory: builder.mutation<Available, CreateAvailableRequest>({
      query: (body) => ({
        url: "inventory/",
        method: "POST",
        body,
      }),
    }),
    deleteFromInventory: builder.mutation<void, number>({
      query: (id) => ({
        url: `inventory/${id}/`,
        method: "DELETE",
      }),
    }),
    getUserInventory: builder.query<PaginatedResponse<Available>, { username: string; page: number; query?: string }>({
      query: ({ username, page, query }) => {
        const params = new URLSearchParams({ page: page.toString() });
        if (query) params.append("query", query);
        return `users/${username}/inventory/?${params.toString()}`;
      },
    }),
    getWishlist: builder.query<PaginatedResponse<Wanted>, { page?: number; query?: string }>({
      query: ({ page = 1, query } = {}) => {
        const params = new URLSearchParams({ page: page.toString() });
        if (query) params.append("query", query);
        return `wishlist/?${params.toString()}`;
      },
    }),
    addToWishlist: builder.mutation<Wanted, CreateWantedRequest>({
      query: (body) => ({
        url: "wishlist/",
        method: "POST",
        body,
      }),
    }),
    deleteFromWishlist: builder.mutation<void, number>({
      query: (id) => ({
        url: `wishlist/${id}/`,
        method: "DELETE",
      }),
    }),
    getUserWishlist: builder.query<PaginatedResponse<Wanted>, { username: string; page: number; query?: string }>({
      query: ({ username, page, query }) => {
        const params = new URLSearchParams({ page: page.toString() });
        if (query) params.append("query", query);
        return `users/${username}/wishlist/?${params.toString()}`;
      },
    }),
    getUserProfile: builder.query<UserProfile, string>({
      query: (username) => `users/${username}/`,
    }),
    importInventory: builder.mutation<ImportInventoryResult, { file: File; format: string; clear: boolean }>({
      query: ({ file, format, clear }) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("format", format);
        formData.append("clear", clear.toString());
        return {
          url: "inventory/import/",
          method: "POST",
          body: formData,
        };
      },
    }),
  }),
});

export const {
  useSearchCardsQuery,
  useGetCardQuery,
  useGetVariantsQuery,
  useGetAvailableQuery,
  useGetLatestAvailableQuery,
  useGetInventoryQuery,
  useAddToInventoryMutation,
  useDeleteFromInventoryMutation,
  useGetUserInventoryQuery,
  useImportInventoryMutation,
  useGetWishlistQuery,
  useAddToWishlistMutation,
  useDeleteFromWishlistMutation,
  useGetUserWishlistQuery,
  useGetUserProfileQuery,
} = cardsApi;
