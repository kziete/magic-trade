"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Container, Center, Loader } from "@mantine/core";
import { useAuth } from "@/lib/AuthProvider";
import { userProfileRoutes, loginRoute } from "@/lib/routes";

function WishlistRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading, isLoggingOut } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    const qs = searchParams.toString();
    if (!user) {
      if (!isLoggingOut()) {
        router.replace(loginRoute(qs ? `${pathname}?${qs}` : pathname));
      }
      return;
    }
    router.replace(`${userProfileRoutes.wishlist(user.username)}${qs ? `?${qs}` : ""}`);
  }, [authLoading, user, pathname, searchParams, router, isLoggingOut]);

  return (
    <Container size="lg" py="xl">
      <Center>
        <Loader size="lg" />
      </Center>
    </Container>
  );
}

export default function WishlistPage() {
  return (
    <Suspense
      fallback={
        <Container size="lg" py="xl">
          <Center>
            <Loader size="lg" />
          </Center>
        </Container>
      }
    >
      <WishlistRedirect />
    </Suspense>
  );
}
