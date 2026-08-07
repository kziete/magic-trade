export const userProfileRoutes = {
  inventory: (username: string) => `/profile/${username}`,
  wishlist: (username: string) => `/profile/${username}/wishlist`,
  matches: (username: string) => `/profile/${username}/matches`,
};

// Only allow same-site relative paths as a redirect target, so a crafted
// `?redirect=` (which round-trips through the OAuth `state` param) can't be
// used to bounce a logged-in user to an external site.
export function sanitizeRedirectPath(path: string | null | undefined): string {
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.includes("://")) {
    return "/";
  }
  return path;
}

export function loginRoute(redirectTo: string): string {
  const safe = sanitizeRedirectPath(redirectTo);
  return safe === "/" ? "/login" : `/login?redirect=${encodeURIComponent(safe)}`;
}
