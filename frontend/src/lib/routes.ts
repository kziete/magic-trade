export const userProfileRoutes = {
  inventory: (username: string) => `/profile/${username}`,
  wishlist: (username: string) => `/profile/${username}/wishlist`,
  matches: (username: string) => `/profile/${username}/matches`,
};
