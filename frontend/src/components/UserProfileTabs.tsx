"use client";

import Link from "next/link";
import { Tabs } from "@mantine/core";
import { IconCards, IconHeart, IconArrowsExchange } from "@tabler/icons-react";
import { useAuth } from "@/lib/AuthProvider";
import { userProfileRoutes } from "@/lib/routes";

export type ProfileTab = "inventory" | "wishlist" | "matches";

interface UserProfileTabsProps {
  username: string;
  active: ProfileTab;
}

export default function UserProfileTabs({ username, active }: UserProfileTabsProps) {
  const { user } = useAuth();
  const showMatches = !!user && user.username !== username;

  return (
    <Tabs value={active}>
      <Tabs.List>
        <Tabs.Tab
          value="inventory"
          leftSection={<IconCards size={16} />}
          renderRoot={(props) => <Link href={userProfileRoutes.inventory(username)} {...props} />}
        >
          Inventario
        </Tabs.Tab>
        <Tabs.Tab
          value="wishlist"
          leftSection={<IconHeart size={16} />}
          renderRoot={(props) => <Link href={userProfileRoutes.wishlist(username)} {...props} />}
        >
          Wishlist
        </Tabs.Tab>
        {showMatches && (
          <Tabs.Tab
            value="matches"
            leftSection={<IconArrowsExchange size={16} />}
            renderRoot={(props) => <Link href={userProfileRoutes.matches(username)} {...props} />}
          >
            Matches
          </Tabs.Tab>
        )}
      </Tabs.List>
    </Tabs>
  );
}
