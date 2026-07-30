import type { NextConfig } from "next";

const backendInternalUrl = process.env.BACKEND_INTERNAL_URL || "http://localhost:9000";

const nextConfig: NextConfig = {
  output: "standalone",
  // Django's URLs require trailing slashes (APPEND_SLASH). Without this,
  // Next.js strips trailing slashes before proxying /api, /admin and /static
  // to the backend, which breaks POSTs (Django can't redirect a POST without
  // losing the body) and causes redirect loops on GET requests.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      // Django routes (api/admin) always end in a slash. The `:path*` catch-all
      // by itself drops a trailing slash when reconstructing the destination, so
      // a dedicated rule with an explicit trailing slash in both source and
      // destination is needed to preserve it.
      {
        source: "/api/:path*/",
        destination: `${backendInternalUrl}/api/:path*/`,
      },
      {
        source: "/api/:path*",
        destination: `${backendInternalUrl}/api/:path*`,
      },
      {
        source: "/admin/:path*/",
        destination: `${backendInternalUrl}/admin/:path*/`,
      },
      {
        source: "/admin/:path*",
        destination: `${backendInternalUrl}/admin/:path*`,
      },
      {
        source: "/static/:path*",
        destination: `${backendInternalUrl}/static/:path*`,
      },
    ];
  },
};

export default nextConfig;
