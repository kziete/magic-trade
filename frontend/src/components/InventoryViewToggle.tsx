"use client";

import { SegmentedControl, Center } from "@mantine/core";
import { IconList, IconGridDots } from "@tabler/icons-react";

export type ViewMode = "table" | "grid";

interface InventoryViewToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

export default function InventoryViewToggle({
  value,
  onChange,
}: InventoryViewToggleProps) {
  return (
    <SegmentedControl
      value={value}
      onChange={(val) => onChange(val as ViewMode)}
      data={[
        {
          value: "table",
          label: (
            <Center style={{ gap: 6 }}>
              <IconList size={16} />
            </Center>
          ),
        },
        {
          value: "grid",
          label: (
            <Center style={{ gap: 6 }}>
              <IconGridDots size={16} />
            </Center>
          ),
        },
      ]}
      size="sm"
    />
  );
}
