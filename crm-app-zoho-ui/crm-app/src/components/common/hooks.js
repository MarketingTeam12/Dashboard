import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCRM } from '../../context/crmContextInstance';
import { useToast } from './toastContext';
import { loadKey, saveKey } from '../../utils/storage';

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

/**
 * Hook that manages a persistent resizable width (in px or %) in localStorage.
 */
export function useResizableDimension(storageKey, defaultSize, minSize, maxSize) {
  const [size, setSize] = useState(() => {
    const saved = loadKey(storageKey, defaultSize);
    const num = Number(saved);
    if (Number.isNaN(num)) return defaultSize;
    return Math.min(maxSize, Math.max(minSize, num));
  });

  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startSizeRef = useRef(size);

  useEffect(() => {
    saveKey(storageKey, size);
  }, [storageKey, size]);

  const startResize = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      startXRef.current = clientX;
      startSizeRef.current = size;
      setIsDragging(true);
    },
    [size]
  );

  useEffect(() => {
    if (!isDragging) return undefined;

    const handleMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const delta = clientX - startXRef.current;
      const next = Math.min(maxSize, Math.max(minSize, Math.round(startSizeRef.current + delta)));
      setSize(next);
    };

    const handleUp = () => {
      setIsDragging(false);
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);

    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging, minSize, maxSize]);

  const resetSize = useCallback(() => {
    setSize(defaultSize);
    saveKey(storageKey, defaultSize);
  }, [defaultSize, storageKey]);

  return { size, setSize, isDragging, startResize, resetSize };
}

