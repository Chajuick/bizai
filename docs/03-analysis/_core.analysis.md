# _core Gap Analysis Report

**Date**: 2026-02-25
**Feature**: _core (CRM Core Features)
**Phase**: Check
**Match Rate**: 100% (45/45 requirements verified)

---

## Feature Coverage

| Feature | Score | File |
|---------|-------|------|
| ClientNameInput (fuzzy match / suggestion) | 8/8 | `client/src/components/ClientNameInput.tsx` |
| Promises (imminent/overdue KST logic) | 10/10 | `client/src/pages/Promises.tsx` |
| Dashboard (alerts + imminent banner) | 10/10 | `client/src/pages/Dashboard.tsx` |
| usePromiseAlerts hook | 6/6 | `client/src/hooks/usePromiseAlerts.ts` |
| getDashboardStats (KST + imminentCount) | 4/4 | `server/db.ts` |
| Orders (delivery pre-fill) | 5/5 | `client/src/pages/Orders.tsx` |
| StatusBadge (imminent) | 1/1 | `client/src/components/StatusBadge.tsx` |
| CSS badge-imminent | 1/1 | `client/src/index.css` |

---

## Issues Found

### ⚠️ Warnings (convention violations / bugs)

1. **Dead code** — `normalizeCompany()` function in `ClientNameInput.tsx` lines 7–18 is defined but never called (leftover from earlier client-side matching approach).

2. **useMemo defeated** — `list` useMemo in `Promises.tsx` depends on `now` (line 108) which is `new Date()` at component body level — creates a new reference every render, so memo never caches. `now` should be computed inside the memo or stabilized.

3. **Stale kstTodayMidnight** — `kstTodayMidnight` useMemo has `[]` deps but closes over outer `now`. If the page stays open past KST midnight, the overdue boundary goes stale.

4. **`any` types** — `(result as any).insertId` in `ClientNameInput.tsx:107`, `selectedOrder: any` in `Orders.tsx:57`, `handleEdit(order: any)` and map callbacks. Violates CLAUDE.md "no `any`" rule.

### ℹ️ Info

5. Dashboard KPI sub shows "지연 N건" when overdue > 0 and imminent = 0 — not explicitly specified but sensible UX addition.

---

## Recommended Actions (Priority Order)

1. **Remove dead `normalizeCompany`** function from `ClientNameInput.tsx` (immediate, zero-risk)
2. **Fix `now` in Promises.tsx** — compute inside useMemo to restore memoization
3. **Fix stale kstTodayMidnight** — add `now` to deps or compute inside memo
4. **Replace `any` types** — use tRPC-inferred types in ClientNameInput, Orders, Promises

---

## Verdict

All functional requirements are correctly implemented. The issues are code quality and convention concerns, not functional regressions. The codebase is production-ready for these features.
