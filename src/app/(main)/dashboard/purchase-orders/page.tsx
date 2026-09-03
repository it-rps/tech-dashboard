import "server-only";

import { getPurchaseOrders } from "./actions";
import { PurchaseOrdersTable } from "./_components/purchase-orders-table";
import { createClient } from "@/lib/supabase/server";

async function getSuppliers() {
  const supabase = await createClient();
  const { data } = await supabase.from("suppliers").select("id, name").order("name", { ascending: true });
  return (data ?? []).map((s) => ({ id: s.id, name: s.name }));
}

async function getProducts() {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("id, sku, name_th").order("name_th", { ascending: true }).limit(20);
  return (data ?? []).map((p) => ({ id: p.id, sku: p.sku ?? "", name_th: p.name_th }));
}

export default async function Page() {
  const purchaseOrders = await getPurchaseOrders();
  const suppliers = await getSuppliers();
  const products = await getProducts();
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-medium text-3xl leading-none tracking-tight">Purchase Orders</h1>
        <p className="text-muted-foreground text-sm">Manage vendor purchase orders</p>
      </div>
      <PurchaseOrdersTable purchaseOrders={purchaseOrders} suppliers={suppliers} products={products} />
    </div>
  );
}