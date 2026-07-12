import { configureStore } from "@reduxjs/toolkit";
import { cardsApi } from "./api";
import { authApi } from "./authApi";

export const makeStore = () => {
  return configureStore({
    reducer: {
      [cardsApi.reducerPath]: cardsApi.reducer,
      [authApi.reducerPath]: authApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(cardsApi.middleware, authApi.middleware),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
