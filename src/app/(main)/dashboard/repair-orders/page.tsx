import {
  createRepairJob,
  getCustomersForSelect,
  getDeviceModelsForSelect,
  getProductsForRepair,
  getRepairJobs,
  getTechnicians,
} from "./actions";
import { RepairOrdersTable } from "./_components/repair-orders-table";

export default async function RepairOrdersPage() {
  const [jobs, customers, deviceModels, products, technicians] = await Promise.all([
    getRepairJobs(),
    getCustomersForSelect(),
    getDeviceModelsForSelect(),
    getProductsForRepair(),
    getTechnicians(),
  ]);

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-medium text-3xl leading-none tracking-tight">Repair Orders</h1>
        <p className="text-muted-foreground text-sm">Intake → reserve parts → close job (FIFO) → warranty → commission</p>
      </header>
      <RepairOrdersTable
        rows={jobs}
        customers={customers}
        deviceModels={deviceModels}
        products={products}
        technicians={technicians}
      />
    </div>
  );
}