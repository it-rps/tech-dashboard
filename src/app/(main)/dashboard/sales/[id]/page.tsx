import { PrintButton } from "./_components/print-button";
import { getReceipt } from "./actions";

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { order, items } = await getReceipt(id);
  const nf = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" });

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="font-medium text-2xl">Receipt preview</h1>
        <PrintButton />
      </div>

      <div className="mx-auto w-full max-w-md rounded-lg border bg-card p-6 font-mono text-sm print:border-0 print:shadow-none">
        <div className="text-center">
          <div className="font-semibold text-lg">iRepair Stock & Service</div>
          <div className="text-muted-foreground text-xs">Sales receipt</div>
        </div>

        <div className="my-3 border-t border-dashed" />

        <div className="space-y-1">
          <div className="flex justify-between">
            <span>Doc</span>
            <span className="font-medium">{order.doc_no}</span>
          </div>
          <div className="flex justify-between">
            <span>Date</span>
            <span>{new Date(order.sold_at).toLocaleString("th-TH")}</span>
          </div>
          <div className="flex justify-between">
            <span>Customer</span>
            <span>{order.customer_name ?? "—"}</span>
          </div>
        </div>

        <div className="my-3 border-t border-dashed" />

        <div>
          {items.map((it) => (
            <div key={it.id} className="mb-2">
              <div className="font-medium">{it.product_name}</div>
              <div className="flex justify-between text-muted-foreground">
                <span>
                  {it.qty} × {nf.format(it.unit_price)}
                </span>
                <span className="tabular-nums">{nf.format(it.line_total)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="my-3 border-t border-dashed" />

        <div className="space-y-1">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="tabular-nums">{nf.format(order.subtotal + order.discount)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between">
              <span>Discount</span>
              <span className="tabular-nums">-{nf.format(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>VAT ({order.vat_rate}%, {order.tax_mode})</span>
            <span className="tabular-nums">{nf.format(order.vat_amount)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t pt-2 font-semibold">
            <span>TOTAL</span>
            <span className="tabular-nums">{nf.format(order.grand_total)}</span>
          </div>
        </div>

        {order.note && (
          <>
            <div className="my-3 border-t border-dashed" />
            <div className="text-muted-foreground">Note: {order.note}</div>
          </>
        )}

        <div className="my-3 border-t border-dashed" />
        <div className="text-center text-muted-foreground text-xs">Thank you</div>
      </div>
    </div>
  );
}