"use client";

import type { ReactNode } from "react";
import { Tabs } from "radix-ui";

export function ContentTabs({ items }: { items: { value: string; label: string; content: ReactNode }[] }) {
  return (
    <Tabs.Root defaultValue={items[0]?.value} className="mt-6">
      <Tabs.List aria-label="Secciones de la página de inicio" className="flex gap-1 overflow-x-auto rounded-xl bg-mist p-1">
        {items.map((item) => (
          <Tabs.Trigger key={item.value} value={item.value} className="min-h-10 shrink-0 rounded-lg px-4 text-sm font-semibold text-heading transition-colors hover:bg-white/70 data-[state=active]:bg-white data-[state=active]:text-brand data-[state=active]:shadow-sm">
            {item.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {items.map((item) => (
        <Tabs.Content key={item.value} value={item.value} className="mt-5 focus-visible:outline-none">
          {item.content}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}
