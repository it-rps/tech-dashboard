import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { CategoriesTable } from "./_components/categories-table";
import { getCategories } from "./actions";

export default async function Page() {
  const categories = await getCategories();
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-medium text-3xl leading-none tracking-tight">Categories</h1>
        <p className="text-muted-foreground text-sm">Manage product categories</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
          <CardDescription>List of categories in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <CategoriesTable categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}