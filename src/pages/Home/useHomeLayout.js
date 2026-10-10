import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { defaultComponents, defaultState, loadHomeState, saveHomeState, uid } from './homeConfig';

/**
 * Persistent Home page customisation: home pages (views), their components and
 * records of user-defined components. Saved on every change.
 */
export function useHomeLayout(onSaveError) {
  const [state, setState] = useState(loadHomeState);
  const errRef = useRef(onSaveError);
  errRef.current = onSaveError;

  useEffect(() => {
    if (!saveHomeState(state)) errRef.current?.('Could not save Home page settings (browser storage is full or blocked).');
  }, [state]);

  // keep other tabs in sync
  useEffect(() => {
    const onStorage = (e) => { if (e.key === 'zcrm.home.v1') setState(loadHomeState()); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const view = useMemo(() => state.views.find((v) => v.id === state.activeViewId) || state.views[0], [state]);

  const patchView = useCallback((fn, viewId) => {
    setState((s) => ({ ...s, views: s.views.map((v) => (v.id === (viewId || s.activeViewId) ? fn(v) : v)) }));
  }, []);

  const updateComponent = useCallback((id, patch) => {
    patchView((v) => ({ ...v, components: v.components.map((c) => (c.id === id ? { ...c, ...(typeof patch === 'function' ? patch(c) : patch) } : c)) }));
  }, [patchView]);

  const addComponent = useCallback((cmp) => {
    const record = { ...cmp, id: uid('cmp'), hidden: false };
    patchView((v) => ({ ...v, components: [...v.components, record] }));
    return record;
  }, [patchView]);

  const removeComponent = useCallback((id) => {
    setState((s) => {
      const views = s.views.map((v) => (v.id === s.activeViewId ? { ...v, components: v.components.filter((c) => c.id !== id) } : v));
      const customRecords = { ...s.customRecords };
      delete customRecords[id]; // records of a removed custom component go with it
      return { ...s, views, customRecords };
    });
  }, []);

  const setComponents = useCallback((components) => patchView((v) => ({ ...v, components })), [patchView]);

  const restoreDefaultComponents = useCallback(() => patchView((v) => ({ ...v, components: defaultComponents() })), [patchView]);

  // ---- views (home pages) ----
  const switchView = useCallback((id) => setState((s) => ({ ...s, activeViewId: id })), []);

  const createView = useCallback(({ name, welcome, start }) => {
    let created;
    setState((s) => {
      const current = s.views.find((v) => v.id === s.activeViewId) || s.views[0];
      let components = [];
      if (start === 'default') components = defaultComponents();
      if (start === 'copy') components = current.components.map((c) => ({ ...c, id: uid('cmp') }));
      // copied custom components keep their own record stores
      const customRecords = { ...s.customRecords };
      if (start === 'copy') {
        current.components.forEach((c, i) => {
          if (c.kind === 'custom') customRecords[components[i].id] = (s.customRecords[c.id] || []).map((r) => ({ ...r }));
        });
      }
      created = { id: uid('home'), name, welcome, components };
      return { ...s, views: [...s.views, created], activeViewId: created.id, customRecords };
    });
    return created;
  }, []);

  const updateView = useCallback((id, patch) => {
    setState((s) => ({ ...s, views: s.views.map((v) => (v.id === id ? { ...v, ...patch } : v)) }));
  }, []);

  const deleteView = useCallback((id) => {
    setState((s) => {
      if (s.views.length <= 1) return s;
      const views = s.views.filter((v) => v.id !== id);
      return { ...s, views, activeViewId: s.activeViewId === id ? views[0].id : s.activeViewId };
    });
  }, []);

  const resetAll = useCallback(() => setState(defaultState()), []);

  // ---- custom component records ----
  const customRecords = state.customRecords;
  const saveCustomRecord = useCallback((cmpId, record) => {
    setState((s) => {
      const list = s.customRecords[cmpId] || [];
      const exists = record.id && list.some((r) => r.id === record.id);
      const now = new Date().toISOString();
      const next = exists
        ? list.map((r) => (r.id === record.id ? { ...r, ...record, updatedAt: now } : r))
        : [{ ...record, id: uid('rec'), createdAt: now }, ...list];
      return { ...s, customRecords: { ...s.customRecords, [cmpId]: next } };
    });
  }, []);
  const deleteCustomRecord = useCallback((cmpId, recordId) => {
    setState((s) => ({ ...s, customRecords: { ...s.customRecords, [cmpId]: (s.customRecords[cmpId] || []).filter((r) => r.id !== recordId) } }));
  }, []);

  return {
    state, view, views: state.views,
    updateComponent, addComponent, removeComponent, setComponents, restoreDefaultComponents,
    switchView, createView, updateView, deleteView, resetAll,
    customRecords, saveCustomRecord, deleteCustomRecord,
  };
}
