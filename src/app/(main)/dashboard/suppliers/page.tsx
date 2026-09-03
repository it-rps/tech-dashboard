import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { getSuppliers, type SupplierRow } from "./_lib/queries";
import { SuppliersTable } from "./_components/suppliers-table";

export default async function Page() {
  const suppliers = await getSuppliers();
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-medium text-3xl leading-none tracking-tight">Suppliers</h1>
        <p className="text-muted-foreground text-sm">Manage product suppliers</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Suppliers</CardTitle>
          <CardDescription>List of suppliers in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <SuppliersTable suppliers={suppliers as SupplierRow[]} />
        </CardContent>
      </Card>
    </div>
  );
}