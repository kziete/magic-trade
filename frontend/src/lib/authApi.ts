import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  contact_email: string | null;
  facebook_url: string | null;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface SocialLoginRequest {
  access_token?: string;
  code?: string;
}

export interface UpdateProfileRequest {
  username?: string;
  phone?: string | null;
  contact_email?: string | null;
  facebook_url?: string | null;
}

const baseQuery = fetchBaseQuery({
  baseUrl: "/api/auth/",
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
      const refreshResult = await baseQuery(
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

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: "login/",
        method: "POST",
        body: credentials,
      }),
    }),
    register: builder.mutation<RegisterResponse, RegisterRequest>({
      query: (data) => ({
        url: "register/",
        method: "POST",
        body: data,
      }),
    }),
    googleLogin: builder.mutation<LoginResponse, SocialLoginRequest>({
      query: (data) => ({
        url: "google/",
        method: "POST",
        body: data,
      }),
    }),
    facebookLogin: builder.mutation<LoginResponse, SocialLoginRequest>({
      query: (data) => ({
        url: "facebook/",
        method: "POST",
        body: data,
      }),
    }),
    getMe: builder.query<User, void>({
      query: () => "me/",
    }),
    updateProfile: builder.mutation<User, UpdateProfileRequest>({
      query: (body) => ({
        url: "me/",
        method: "PATCH",
        body,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGoogleLoginMutation,
  useFacebookLoginMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
  useUpdateProfileMutation,
} = authApi;
