"use client";

import Link from "next/link";
import { Tabs } from "@mantine/core";
import { IconCards, IconHeart } from "@tabler/icons-react";
import { userProfileRoutes } from "@/lib/routes";

export type ProfileTab = "inventory" | "wishlist";

interface UserProfileTabsProps {
  username: string;
  active: ProfileTab;
}

export default function UserProfileTabs({ username, active }: UserProfileTabsProps) {
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
      </Tabs.List>
    </Tabs>
  );
}
