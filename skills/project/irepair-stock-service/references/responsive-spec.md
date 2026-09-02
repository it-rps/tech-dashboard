# Responsive Spec (must be complete at every breakpoint)

### 9.1 Breakpoints (Tailwind v4 defaults)

| Token | Value | px | Target device |
|---|---|---|---|
| (base) | 0 | 0–639 | Phone, portrait (iPhone) |
| `sm:` | 40rem | ≥ 640 | Phone landscape / large phone |
| `md:` | 48rem | ≥ 768 | iPad, portrait |
| `lg:` | 64rem | ≥ 1024 | iPad landscape / small laptop |
| `xl:` | 80rem | ≥ 1280 | Laptop / desktop |
| `2xl:` | 96rem | ≥ 1536 | Large screen |

**Principle:** always write mobile-first — base classes target mobile, then add `sm: md: lg:` on top. Avoid `max-*:` unless truly necessary.

To add a custom breakpoint, define it in CSS (Tailwind v4 does not use `tailwind.config.js`):

```css
@theme {
  --breakpoint-xs: 24rem; /* 384px — very small screens */
}
```

### 9.2 Component Behavior per Breakpoint

| Component | base (< 640) | sm | md | lg | xl / 2xl |
|---|---|---|---|---|---|
| Sidebar | hidden → full-screen Sheet | Sheet | Sheet | permanent, can collapse to icons | permanent, full width |
| Header | logo + menu button + search icon | + search field | + breadcrumb | + language/theme switch | full layout |
| Page padding | `p-4` | `p-4` | `p-6` | `p-6` | `p-8` |
| KPI cards | `grid-cols-1` | `grid-cols-2` | `grid-cols-2` | `grid-cols-4` | `grid-cols-4` |
| Chart grid | 1 column | 1 | 1 | 2 columns | 3 columns (some sections) |
| Chart height | 220px | 280px | 280px | 340px | 340px |
| Chart Y axis | hidden | shown | shown | shown | shown |
| Data table | card list (default) | card list | full table | full table | full table + extra columns |
| View toggle | shown (table ⇄ card) | shown | shown | shown | shown |
| Form modal | `<Drawer>` from bottom | Drawer | `<Dialog>` | Dialog | Dialog |
| Filter bar | "Filter" Sheet | Sheet | inline, wraps | inline, single row | inline |
| Form grid | 1 column | 1 | 2 columns | 2–3 columns | 3 columns |
| Submit button | sticky, full width, `h-11` | sticky | inline right, `h-9` | inline | inline |
| Pagination | `‹ page 1/8 ›` | + page-size control | full | full | full |
| Barcode scan button | FAB, bottom-right | FAB | toolbar button | toolbar | toolbar |

### 9.3 Table Columns by Screen Size (example: Products page)

| Column | base | sm | md | lg | xl |
|---|---|---|---|---|---|
| Product name | ✅ | ✅ | ✅ | ✅ | ✅ |
| Qty remaining | ✅ | ✅ | ✅ | ✅ | ✅ |
| SKU | — | ✅ | ✅ | ✅ | ✅ |
| Category | — | — | ✅ | ✅ | ✅ |
| Compatible models | — | — | — | ✅ | ✅ |
| Cost (WAC) | — | — | ✅* | ✅* | ✅* |
| Latest cost | — | — | — | — | ✅* |
| Wholesale/retail price | — | — | ✅ | ✅ | ✅ |
| Reserved | — | — | — | ✅ | ✅ |
| Defective | — | — | — | — | ✅ |

`*` = shown only to roles allowed to see cost.

### 9.4 Responsive Data Table Pattern

```tsx
// src/components/shared/data-table/responsive-data-table.tsx
"use client";

import { useEffect, useState } from "react";
import { LayoutGrid, Table as TableIcon } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type ViewMode = "auto" | "table" | "card";
const STORAGE_KEY = "stock:view-mode";

export function useViewMode(defaultMode: ViewMode = "auto") {
  const [mode, setMode] = useState<ViewMode>(defaultMode);
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ViewMode | null;
    if (saved) setMode(saved);
  }, []);
  const update = (m: ViewMode) => { setMode(m); localStorage.setItem(STORAGE_KEY, m); };
  return { mode, setMode: update };
}

export function ViewToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  return (
    <ToggleGroup type="single" value={mode} onValueChange={(v) => v && onChange(v as ViewMode)} size="sm">
      <ToggleGroupItem value="card" aria-label="Card view" className="size-9"><LayoutGrid className="size-4" /></ToggleGroupItem>
      <ToggleGroupItem value="table" aria-label="Table view" className="size-9"><TableIcon className="size-4" /></ToggleGroupItem>
    </ToggleGroup>
  );
}

// Usage: auto = CSS decides (no layout shift), manual = forced by the user
export function ProductView({ data, canSeeCost }: Props) {
  const { mode, setMode } = useViewMode("auto");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <SearchInput className="max-w-full sm:max-w-xs" />
        <ViewToggle mode={mode} onChange={setMode} />
      </div>

      {/* AUTO: card view below md, table view from md up — pure CSS, no JS media query */}
      {mode === "auto" && (
        <>
          <div className="md:hidden"><ProductCardList rows={data.rows} canSeeCost={canSeeCost} /></div>
          <div className="hidden md:block"><ProductTable rows={data.rows} canSeeCost={canSeeCost} /></div>
        </>
      )}
      {mode === "card"  && <ProductCardList rows={data.rows} canSeeCost={canSeeCost} />}
      {/* force table view on mobile → allow horizontal scroll */}
      {mode === "table" && (
        <div className="w-full overflow-x-auto">
          <div className="min-w-[720px]"><ProductTable rows={data.rows} canSeeCost={canSeeCost} /></div>
        </div>
      )}
    </div>
  );
}
```

### 9.5 TanStack Columns Hidden by Breakpoint

```tsx
// Use meta.className to add a Tailwind responsive class to both <th> and <td>
export const productColumns: ColumnDef<StockRow>[] = [
  { accessorKey: "name_th", header: "Product" },              // shown on every screen
  { accessorKey: "qty_available", header: "Remaining" },
  { accessorKey: "sku", header: "SKU",
    meta: { className: "hidden sm:table-cell" } },
  { accessorKey: "category_slug", header: "Category",
    meta: { className: "hidden md:table-cell" } },
  { accessorKey: "wac_cost", header: "Avg cost",
    meta: { className: "hidden md:table-cell text-right tabular-nums" } },
  { accessorKey: "last_cost", header: "Latest cost",
    meta: { className: "hidden xl:table-cell text-right tabular-nums" } },
];

// inside the table component:
<TableHead className={cn(header.column.columnDef.meta?.className)}>…</TableHead>
<TableCell className={cn(cell.column.columnDef.meta?.className)}>…</TableCell>
```

### 9.6 Must-Follow Responsive Rules

- Touch target ≥ 44×44px on mobile — buttons use `h-11 md:h-9`, icon buttons `size-10 md:size-8`
- `text-base sm:text-sm` on every `<input>` — prevents iOS Safari auto-zoom on focus
- Money values always use `tabular-nums text-right` so digits line up
- Never let the whole page scroll horizontally — if scrolling is required, wrap only the table in `overflow-x-auto`
- Safe area: `pb-[env(safe-area-inset-bottom)]` for sticky bottom bars (iPhone home indicator)
- `min-w-0` on flex children with long text, or the layout will break
- Test at 5 widths: 375 (iPhone SE/13 mini), 390 (iPhone 14/15), 768 (iPad), 1024 (iPad Pro landscape), 1440 (laptop)
- Check both light and dark mode on every page you touch
- Dialogs on mobile → always `<Drawer>`; use the template's `useIsMobile()` hook if it exists, otherwise create one at `src/hooks/use-is-mobile.ts` (breakpoint 768)

