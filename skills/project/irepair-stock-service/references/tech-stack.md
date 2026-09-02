# Tech Stack (do not exceed)

| Layer | Choice | Version / note |
|---|---|---|
| Framework | Next.js App Router | v16, per template |
| Language | TypeScript | `strict: true` |
| CSS | Tailwind CSS v4 | Config lives in CSS via `@theme`, **not** `tailwind.config.js` |
| UI | shadcn/ui | Already in the template |
| DB / Auth / Storage | Supabase | Postgres + Auth (email+password) + RLS |
| Tables | TanStack Table v8 | Comes with the template |
| Charts | Recharts, via shadcn `<ChartContainer>` | No other chart library |
| Forms | react-hook-form + zod + `@hookform/resolvers` | |
| Dates | date-fns + `date-fns/locale/th` | |
| i18n | next-intl | Thai is the default locale |
| Barcode scan | `@zxing/browser` (phone camera) | Lazy-import only on the page that uses it |
| Toast | sonner | |

**Not used:** PWA/offline, image upload, multi-currency, Prisma/Drizzle (use the Supabase client directly).
