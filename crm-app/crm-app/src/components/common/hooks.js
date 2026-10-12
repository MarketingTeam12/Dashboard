import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCRM } from '../../context/CRMContext';
import { useToast } from './Toast';

/** Handles ?create=1 and ?open=<id> deep links (from global search, + menu, insights). */
export function useUrlActions({ onCreate, onOpen, onParams }) {
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    const create = params.get('create');
    const open = params.get('open');
    if (!create && !open && !params.toString()) return;
    if (create) onCreate?.(Object.fromEntries(params.entries()));
    if (open) onOpen?.(open);
    onParams?.(Object.fromEntries(params.entries()));
    setParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);
}

/** Refresh button: re-reads LocalStorage and shows a short loading state. */
export function useRefresh(label = 'Records') {
  const { reload } = useCRM();
  const toast = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      reload();
      setRefreshing(false);
      toast.success(`${label} refreshed`);
    }, 450);
  };
  return { refreshing, refresh };
}
