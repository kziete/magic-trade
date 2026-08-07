"use client";

import { Card, Stack, Avatar, Text, Divider, Group, Anchor } from "@mantine/core";
import { IconUser, IconPhone, IconMail, IconBrandFacebook } from "@tabler/icons-react";
import { UserProfile } from "@/lib/api";

interface UserProfileSidebarProps {
  username: string;
  profile?: UserProfile;
}

export default function UserProfileSidebar({ username, profile }: UserProfileSidebarProps) {
  const hasContactInfo =
    profile && (profile.phone || profile.contact_email || profile.facebook_url);

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md" align="center">
        <Avatar size={64} radius="xl">
          <IconUser size={32} />
        </Avatar>
        <Text fw={600} size="lg">
          {username}
        </Text>

        {hasContactInfo && (
          <>
            <Divider w="100%" />
            <Stack gap="xs" w="100%">
              {profile.phone && (
                <Group gap={6} wrap="nowrap">
                  <IconPhone size={16} />
                  <Text size="sm">{profile.phone}</Text>
                </Group>
              )}
              {profile.contact_email && (
                <Group gap={6} wrap="nowrap">
                  <IconMail size={16} />
                  <Text size="sm">{profile.contact_email}</Text>
                </Group>
              )}
              {profile.facebook_url && (
                <Group gap={6} wrap="nowrap">
                  <IconBrandFacebook size={16} />
                  <Anchor
                    href={profile.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="sm"
                  >
                    Facebook
                  </Anchor>
                </Group>
              )}
            </Stack>
          </>
        )}
      </Stack>
    </Card>
  );
}
