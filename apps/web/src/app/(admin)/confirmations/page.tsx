'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageSkeleton } from '@/components/PageSkeleton';

/** Redireciona para Autorizações → aba Confirmações. */
export default function ConfirmationsRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const extra = searchParams.toString();
    const target = extra
      ? `/authorizations?tab=operations&${extra}`
      : '/authorizations?tab=operations';
    router.replace(target);
  }, [router, searchParams]);

  return <PageSkeleton />;
}
