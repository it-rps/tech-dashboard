import {
  deleteGoodsReceipt,
  getGoodsReceipts,
  getProductsForSelect,
  getPurchaseOrdersForSelect,
  getSuppliersForSelect,
  upsertGoodsReceipt,
} from "./actions";
import { GoodsReceiptsTable } from "./_components/goods-receipts-table";

export default async function Page() {
  const [goodsReceipts, purchaseOrders, products, suppliers] = await Promise.all([
    getGoodsReceipts(),
    getPurchaseOrdersForSelect(),
    getProductsForSelect(),
    getSuppliersForSelect(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-medium text-3xl leading-none tracking-tight">Goods Receipts</h1>
        <p className="text-muted-foreground text-sm">Record incoming goods from suppliers</p>
      </div>
      <GoodsReceiptsTable
        goodsReceipts={goodsReceipts}
        purchaseOrders={purchaseOrders}
        products={products}
        suppliers={suppliers}
      />
    </div>
  );
}
