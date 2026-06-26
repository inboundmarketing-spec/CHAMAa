'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type TabOption<T extends string> = { id: T };

export function useUrlTab<T extends string>({
  tabs,
  defaultTab,
  param = 'tab',
}: {
  tabs: readonly TabOption<T>[];
  defaultTab: T;
  param?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isValid = (id: string | null): id is T =>
    !!id && tabs.some((t) => t.id === id);

  const search = searchParams.toString();
  const tabFromUrl = searchParams.get(param);
  const resolvedTab: T = isValid(tabFromUrl) ? tabFromUrl : defaultTab;

  const [tab, setTabState] = useState<T>(resolvedTab);

  useEffect(() => {
    setTabState(resolvedTab);
  }, [resolvedTab]);

  useEffect(() => {
    if (tabs.length === 0) return;
    if (isValid(tabFromUrl)) return;

    const params = new URLSearchParams(search);
    params.set(param, defaultTab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [tabs, defaultTab, param, pathname, router, search, tabFromUrl]);

  const selectTab = useCallback(
    (next: T) => {
      setTabState(next);
      const params = new URLSearchParams(searchParams.toString());
      params.set(param, next);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [param, pathname, router, searchParams],
  );

  return { tab, selectTab };
}
