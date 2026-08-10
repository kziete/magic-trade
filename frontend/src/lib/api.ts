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

export interface CardDetail extends Card {
  viewer_has_it: boolean;
  viewer_wants_it: boolean;
}

export interface Available {
  id: number;
  card_id: number;
  variant_id: number;
  card_name: string;
  set_name: string;
  image: string;
  finish: string;
  condition: string;
  language: string;
  username: string;
  wanted_count: number;
  quantity: number;
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
  quantity: number;
}

export interface Wanted {
  id: number;
  variant_id: number | null;
  card_name: string;
  set_name: string | null;
  image: string | null;
  finish: string | null;
  username: string;
  matches_count: number;
  card_id: number;
  quantity: number;
}

export interface CreateWantedRequest {
  card: number;
  variant?: number;
  finish?: string;
  quantity: number;
}

export interface ImportInventoryResult {
  created: number;
  skipped: number;
  errors: string[];
}

export interface UserProfile {
  username: string;
}

export const cardsApi = createApi({
  reducerPath: "cardsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Inventory", "Wishlist", "Available", "Wanted", "UserProfile"],
  endpoints: (builder) => ({
    searchCards: builder.query<Card[], string>({
      query: (searchQuery) => `cards/?query=${encodeURIComponent(searchQuery)}`,
    }),
    getCard: builder.query<Card, number>({
      query: (cardId) => `cards/${cardId}/`,
    }),
    getCardDetail: builder.query<CardDetail, number>({
      query: (cardId) => `cards/${cardId}/`,
    }),
    getCardWantedBy: builder.query<Wanted[], number>({
      query: (cardId) => `cards/${cardId}/wanted/`,
      providesTags: ["Wanted"],
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
      providesTags: ["Available"],
    }),
    getLatestAvailable: builder.query<Available[], void>({
      query: () => "available/latest/",
      providesTags: ["Available"],
    }),
    getInventory: builder.query<PaginatedResponse<Available>, { page?: number; query?: string }>({
      query: ({ page = 1, query } = {}) => {
        const params = new URLSearchParams({ page: page.toString() });
        if (query) params.append("query", query);
        return `inventory/?${params.toString()}`;
      },
      providesTags: ["Inventory"],
    }),
    addToInventory: builder.mutation<Available, CreateAvailableRequest>({
      query: (body) => ({
        url: "inventory/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Inventory", "Available", "Wanted"],
    }),
    deleteFromInventory: builder.mutation<void, number>({
      query: (id) => ({
        url: `inventory/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Inventory", "Available", "Wanted"],
    }),
    getInventoryWantedBy: builder.query<Wanted[], number>({
      query: (availableId) => `inventory/${availableId}/wanted/`,
      providesTags: ["Wanted"],
    }),
    getUserInventory: builder.query<PaginatedResponse<Available>, { username: string; page: number; query?: string }>({
      query: ({ username, page, query }) => {
        const params = new URLSearchParams({ page: page.toString() });
        if (query) params.append("query", query);
        return `users/${username}/inventory/?${params.toString()}`;
      },
      providesTags: ["Inventory"],
    }),
    getWishlist: builder.query<PaginatedResponse<Wanted>, { page?: number; query?: string }>({
      query: ({ page = 1, query } = {}) => {
        const params = new URLSearchParams({ page: page.toString() });
        if (query) params.append("query", query);
        return `wishlist/?${params.toString()}`;
      },
      providesTags: ["Wishlist"],
    }),
    addToWishlist: builder.mutation<Wanted, CreateWantedRequest>({
      query: (body) => ({
        url: "wishlist/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Wishlist", "Available", "Wanted"],
    }),
    deleteFromWishlist: builder.mutation<void, number>({
      query: (id) => ({
        url: `wishlist/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Wishlist", "Available", "Wanted"],
    }),
    getUserWishlist: builder.query<PaginatedResponse<Wanted>, { username: string; page: number; query?: string }>({
      query: ({ username, page, query }) => {
        const params = new URLSearchParams({ page: page.toString() });
        if (query) params.append("query", query);
        return `users/${username}/wishlist/?${params.toString()}`;
      },
      providesTags: ["Wishlist"],
    }),
    getWishlistMatches: builder.query<Available[], number>({
      query: (wantedId) => `wishlist/${wantedId}/matches/`,
      providesTags: ["Available"],
    }),
    getUserProfile: builder.query<UserProfile, string>({
      query: (username) => `users/${username}/`,
      providesTags: ["UserProfile"],
    }),
    getUserMatchesAvailable: builder.query<Available[], string>({
      query: (username) => `users/${username}/matches/available/`,
      providesTags: ["Available"],
    }),
    getUserMatchesWanted: builder.query<Wanted[], string>({
      query: (username) => `users/${username}/matches/wanted/`,
      providesTags: ["Wanted"],
    }),
    contactUser: builder.mutation<void, { username: string; message?: string }>({
      query: ({ username, message }) => ({
        url: `users/${username}/contact/`,
        method: "POST",
        body: { message },
      }),
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
      invalidatesTags: ["Inventory", "Available", "Wanted"],
    }),
  }),
});

export const {
  useSearchCardsQuery,
  useGetCardQuery,
  useGetCardDetailQuery,
  useGetCardWantedByQuery,
  useGetVariantsQuery,
  useGetAvailableQuery,
  useGetLatestAvailableQuery,
  useGetInventoryQuery,
  useAddToInventoryMutation,
  useDeleteFromInventoryMutation,
  useGetInventoryWantedByQuery,
  useGetUserInventoryQuery,
  useImportInventoryMutation,
  useGetWishlistQuery,
  useAddToWishlistMutation,
  useDeleteFromWishlistMutation,
  useGetUserWishlistQuery,
  useGetWishlistMatchesQuery,
  useGetUserProfileQuery,
  useContactUserMutation,
  useGetUserMatchesAvailableQuery,
  useGetUserMatchesWantedQuery,
} = cardsApi;
