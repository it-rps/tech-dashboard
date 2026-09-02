# Business Context

A shop that buys and sells iPhone / iPad / MacBook, and also runs a back-office repair service: battery replacement and repairs for other shops/dealers (e.g. **ITM**) and for walk-in retail customers.

**Main work:** battery replacement (highest volume) and device repair.

### 1.1 Three Job Types (important — affects commission and pricing)

| Type | Description | Price used | Technician commission |
|---|---|---|---|
| `DEALER` | A partner shop/dealer sends in a device to repair (e.g. ITM) | Wholesale price | ✅ 50 THB/device |
| `SERVICE` | A retail customer walks in | Retail price | ✅ 50 THB/device |
| `INTERNAL` | The shop's own device, repaired for resale | Cost price | ❌ No commission |

The 50 THB commission rate **must be editable** on the Settings page. Never hardcode it — read it from `app_settings.commission_per_unit`.

### 1.2 Real Job Example (primary test fixture — numbers must match exactly)

```
Job: iPhone 11 battery swap for ITM
  Battery, iPhone 11 (from SV Telecom)   230.00
  TagOn Aweshine 100%                    190.00
  Battery adhesive                        20.00
  Waterproof seal adhesive                40.00
  --------------------------------------
  Total cost                             480.00
  Sale price (wholesale)                 800.00
  Gross profit                           320.00
  Technician commission                   50.00  (job type = DEALER)
  Net profit after commission            270.00
```

### 1.3 Business Rules (must never be violated)

- **1 battery ↔ 1 IMEI** — when a battery is installed in a device, always link `device_imei`. Never close a job without an IMEI.
- **1 TagOn ↔ 1 IMEI** — but some jobs don't use a TagOn at all (it's an optional line item).
- **Parts drawn for a repair = reserved first.** Stock is not deducted for real until the job is **closed**.
- **Defective stock must be kept in a separate status.** Never mix it with good stock.
- **Cost changes per batch (lot)** → cost must be tracked per lot. Never store a single cost value on a product.

---

## Glossary (Thai UI term ↔ code term)

Use the English name in code; use the Thai name in the UI.

| Thai term | Code / EN name | Note |
|---|---|---|
| ใบสั่งซื้อ | `purchase_order` (PO) | Order placed with a supplier |
| รับของเข้า | `goods_receipt` (GR) | Can be received partially |
| ล็อตสินค้า | `inventory_lot` | The costing unit for FIFO |
| ใบงานซ่อม | `repair_job` | Intake → close job |
| ใบขาย/บิล | `sales_order` + `invoice` | |
| การจอง | `reservation` | Not yet deducted from stock |
| เคลม | `claim` | Send a defective item back to the supplier |
| ค่าคอม | `commission` | 50 THB/device |
| ราคาส่ง / ปลีก | `wholesale` / `retail` | Price tier |

