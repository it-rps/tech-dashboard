import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { BrandsTable } from "./_components/brands-table";
import { getBrands } from "./actions";

export default async function Page() {
  const brands = await getBrands();
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-medium text-3xl leading-none tracking-tight">Brands</h1>
        <p className="text-muted-foreground text-sm">Manage product brands</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Brands</CardTitle>
          <CardDescription>List of brands in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <BrandsTable brands={brands} />
        </CardContent>
      </Card>
    </div>
  );
}
