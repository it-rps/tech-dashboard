import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { getProducts } from "./_lib/queries";
import { ProductsTable } from "./_components/products-table";
import { getCategories } from "../categories/_lib/queries";
import { getBrands } from "../brands/_lib/queries";

export default async function Page() {
  const [products, categories, brands] = await Promise.all([
    getProducts(),
    getCategories(),
    getBrands(),
  ]);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-medium text-3xl leading-none tracking-tight">Products</h1>
        <p className="text-muted-foreground text-sm">Manage products with price tiers and device model links</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
          <CardDescription>List of products in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <ProductsTable
            products={products}
            categories={categories.map((c) => ({ id: c.id, name: c.name_th }))}
            brands={brands.map((b) => ({ id: b.id, name: b.name }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}