import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { CustomersTable } from "./_components/customers-table";
import { getCustomers } from "./_lib/queries";

export default async function Page() {
  const customers = await getCustomers();
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-medium text-3xl leading-none tracking-tight">Customers</h1>
        <p className="text-muted-foreground text-sm">Manage customers (dealers, walk-in, internal)</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
          <CardDescription>List of customers in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <CustomersTable customers={customers} />
        </CardContent>
      </Card>
    </div>
  );
}