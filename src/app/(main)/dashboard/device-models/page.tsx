import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { DeviceModelsTable } from "./_components/device-models-table";
import { getDeviceModels } from "./actions";

export default async function Page() {
  const models = await getDeviceModels();
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-medium text-3xl leading-none tracking-tight">Device Models</h1>
        <p className="text-muted-foreground text-sm">Manage supported device models (iPhone, iPad, MacBook)</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Device Models</CardTitle>
          <CardDescription>List of device models in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <DeviceModelsTable models={models} />
        </CardContent>
      </Card>
    </div>
  );
}