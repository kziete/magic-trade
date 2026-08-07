"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { Container, Center, Loader } from "@mantine/core";
import { userProfileRoutes } from "@/lib/routes";

function LegacyUserInventoryRedirect() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const username = params.username as string;

  useEffect(() => {
    const qs = searchParams.toString();
    router.replace(`${userProfileRoutes.inventory(username)}${qs ? `?${qs}` : ""}`);
  }, [username, searchParams, router]);

  return (
    <Container size="lg" py="xl">
      <Center>
        <Loader size="lg" />
      </Center>
    </Container>
  );
}

export default function LegacyUserInventoryPage() {
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
      <LegacyUserInventoryRedirect />
    </Suspense>
  );
}
