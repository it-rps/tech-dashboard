export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          commission_per_unit: number
          costing_method: Database["public"]["Enums"]["costing_method"]
          dead_stock_days: number
          default_tax_mode: Database["public"]["Enums"]["tax_mode"]
          default_warranty_days: number
          id: number
          low_stock_default: number
          updated_at: string
          vat_rate: number
        }
        Insert: {
          commission_per_unit?: number
          costing_method?: Database["public"]["Enums"]["costing_method"]
          dead_stock_days?: number
          default_tax_mode?: Database["public"]["Enums"]["tax_mode"]
          default_warranty_days?: number
          id?: number
          low_stock_default?: number
          updated_at?: string
          vat_rate?: number
        }
        Update: {
          commission_per_unit?: number
          costing_method?: Database["public"]["Enums"]["costing_method"]
          dead_stock_days?: number
          default_tax_mode?: Database["public"]["Enums"]["tax_mode"]
          default_warranty_days?: number
          id?: number
          low_stock_default?: number
          updated_at?: string
          vat_rate?: number
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: number
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: number
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: number
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          note: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          note?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          note?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          is_active: boolean
          name_en: string
          name_th: string
          requires_imei: boolean
          slug: string
          sort_order: number
        }
        Insert: {
          id?: string
          is_active?: boolean
          name_en: string
          name_th: string
          requires_imei?: boolean
          slug: string
          sort_order?: number
        }
        Update: {
          id?: string
          is_active?: boolean
          name_en?: string
          name_th?: string
          requires_imei?: boolean
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      claim_items: {
        Row: {
          claim_id: string
          id: string
          lot_id: string | null
          product_id: string
          qty: number
          reason: string | null
          replacement_lot_id: string | null
          resolved_qty: number
          stock_item_id: string | null
        }
        Insert: {
          claim_id: string
          id?: string
          lot_id?: string | null
          product_id: string
          qty: number
          reason?: string | null
          replacement_lot_id?: string | null
          resolved_qty?: number
          stock_item_id?: string | null
        }
        Update: {
          claim_id?: string
          id?: string
          lot_id?: string | null
          product_id?: string
          qty?: number
          reason?: string | null
          replacement_lot_id?: string | null
          resolved_qty?: number
          stock_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "claim_items_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_items_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "inventory_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_claim_rate_by_product"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "claim_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_stock_summary"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "claim_items_replacement_lot_id_fkey"
            columns: ["replacement_lot_id"]
            isOneToOne: false
            referencedRelation: "inventory_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_items_stock_item_id_fkey"
            columns: ["stock_item_id"]
            isOneToOne: false
            referencedRelation: "stock_items"
            referencedColumns: ["id"]
          },
        ]
      }
      claims: {
        Row: {
          closed_at: string | null
          created_by: string | null
          doc_no: string
          id: string
          note: string | null
          opened_at: string
          sent_at: string | null
          status: Database["public"]["Enums"]["claim_status"]
          supplier_id: string
        }
        Insert: {
          closed_at?: string | null
          created_by?: string | null
          doc_no: string
          id?: string
          note?: string | null
          opened_at?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["claim_status"]
          supplier_id: string
        }
        Update: {
          closed_at?: string | null
          created_by?: string | null
          doc_no?: string
          id?: string
          note?: string | null
          opened_at?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["claim_status"]
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "claims_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_supplier_price_compare"
            referencedColumns: ["supplier_id"]
          },
        ]
      }
      commission_entries: {
        Row: {
          amount: number | null
          created_at: string
          customer_id: string | null
          id: string
          is_paid: boolean
          paid_at: string | null
          period_month: string
          qty: number
          rate: number
          repair_job_id: string | null
          technician_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          customer_id?: string | null
          id?: string
          is_paid?: boolean
          paid_at?: string | null
          period_month: string
          qty?: number
          rate: number
          repair_job_id?: string | null
          technician_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          customer_id?: string | null
          id?: string
          is_paid?: boolean
          paid_at?: string | null
          period_month?: string
          qty?: number
          rate?: number
          repair_job_id?: string | null
          technician_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_entries_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_entries_repair_job_id_fkey"
            columns: ["repair_job_id"]
            isOneToOne: false
            referencedRelation: "repair_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_entries_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          code: string | null
          commission_eligible: boolean
          created_at: string
          credit_limit: number
          credit_terms_days: number
          default_price_tier: Database["public"]["Enums"]["price_tier"]
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["party_kind"]
          line_id: string | null
          name: string
          note: string | null
          phone: string | null
          tax_id: string | null
        }
        Insert: {
          address?: string | null
          code?: string | null
          commission_eligible?: boolean
          created_at?: string
          credit_limit?: number
          credit_terms_days?: number
          default_price_tier?: Database["public"]["Enums"]["price_tier"]
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["party_kind"]
          line_id?: string | null
          name: string
          note?: string | null
          phone?: string | null
          tax_id?: string | null
        }
        Update: {
          address?: string | null
          code?: string | null
          commission_eligible?: boolean
          created_at?: string
          credit_limit?: number
          credit_terms_days?: number
          default_price_tier?: Database["public"]["Enums"]["price_tier"]
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["party_kind"]
          line_id?: string | null
          name?: string
          note?: string | null
          phone?: string | null
          tax_id?: string | null
        }
        Relationships: []
      }
      device_models: {
        Row: {
          device_type: string
          id: string
          is_active: boolean
          name: string
          release_year: number | null
          series: string | null
          sort_order: number
        }
        Insert: {
          device_type: string
          id?: string
          is_active?: boolean
          name: string
          release_year?: number | null
          series?: string | null
          sort_order?: number
        }
        Update: {
          device_type?: string
          id?: string
          is_active?: boolean
          name?: string
          release_year?: number | null
          series?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      goods_receipt_items: {
        Row: {
          goods_receipt_id: string
          id: string
          product_id: string
          purchase_order_item_id: string | null
          qty: number
          unit_cost: number
        }
        Insert: {
          goods_receipt_id: string
          id?: string
          product_id: string
          purchase_order_item_id?: string | null
          qty: number
          unit_cost: number
        }
        Update: {
          goods_receipt_id?: string
          id?: string
          product_id?: string
          purchase_order_item_id?: string | null
          qty?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "goods_receipt_items_goods_receipt_id_fkey"
            columns: ["goods_receipt_id"]
            isOneToOne: false
            referencedRelation: "goods_receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipt_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipt_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_claim_rate_by_product"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "goods_receipt_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_stock_summary"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "goods_receipt_items_purchase_order_item_id_fkey"
            columns: ["purchase_order_item_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      goods_receipts: {
        Row: {
          created_at: string
          created_by: string | null
          doc_no: string
          id: string
          note: string | null
          purchase_order_id: string | null
          received_date: string
          shipping_cost: number
          supplier_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          doc_no: string
          id?: string
          note?: string | null
          purchase_order_id?: string | null
          received_date?: string
          shipping_cost?: number
          supplier_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          doc_no?: string
          id?: string
          note?: string | null
          purchase_order_id?: string | null
          received_date?: string
          shipping_cost?: number
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goods_receipts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipts_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_supplier_price_compare"
            referencedColumns: ["supplier_id"]
          },
        ]
      }
      inventory_lots: {
        Row: {
          condition: Database["public"]["Enums"]["stock_condition"]
          goods_receipt_item_id: string | null
          id: string
          landed_unit_cost: number
          lot_no: string
          note: string | null
          product_id: string
          qty_received: number
          qty_remaining: number
          qty_reserved: number
          received_at: string
          supplier_id: string | null
          unit_cost: number
          warranty_days: number | null
        }
        Insert: {
          condition?: Database["public"]["Enums"]["stock_condition"]
          goods_receipt_item_id?: string | null
          id?: string
          landed_unit_cost: number
          lot_no: string
          note?: string | null
          product_id: string
          qty_received: number
          qty_remaining: number
          qty_reserved?: number
          received_at?: string
          supplier_id?: string | null
          unit_cost: number
          warranty_days?: number | null
        }
        Update: {
          condition?: Database["public"]["Enums"]["stock_condition"]
          goods_receipt_item_id?: string | null
          id?: string
          landed_unit_cost?: number
          lot_no?: string
          note?: string | null
          product_id?: string
          qty_received?: number
          qty_remaining?: number
          qty_reserved?: number
          received_at?: string
          supplier_id?: string | null
          unit_cost?: number
          warranty_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_lots_goods_receipt_item_id_fkey"
            columns: ["goods_receipt_item_id"]
            isOneToOne: false
            referencedRelation: "goods_receipt_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_lots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_lots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_claim_rate_by_product"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_lots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_stock_summary"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_lots_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_lots_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_supplier_price_compare"
            referencedColumns: ["supplier_id"]
          },
        ]
      }
      product_device_models: {
        Row: {
          device_model_id: string
          product_id: string
        }
        Insert: {
          device_model_id: string
          product_id: string
        }
        Update: {
          device_model_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_device_models_device_model_id_fkey"
            columns: ["device_model_id"]
            isOneToOne: false
            referencedRelation: "device_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_device_models_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_device_models_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_claim_rate_by_product"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_device_models_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_stock_summary"
            referencedColumns: ["product_id"]
          },
        ]
      }
      product_prices: {
        Row: {
          created_at: string
          effective_from: string
          id: string
          price: number
          product_id: string
          tier: Database["public"]["Enums"]["price_tier"]
        }
        Insert: {
          created_at?: string
          effective_from?: string
          id?: string
          price: number
          product_id: string
          tier: Database["public"]["Enums"]["price_tier"]
        }
        Update: {
          created_at?: string
          effective_from?: string
          id?: string
          price?: number
          product_id?: string
          tier?: Database["public"]["Enums"]["price_tier"]
        }
        Relationships: [
          {
            foreignKeyName: "product_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_claim_rate_by_product"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_stock_summary"
            referencedColumns: ["product_id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          brand_id: string | null
          capacity_mah: number | null
          category_id: string
          created_at: string
          id: string
          is_active: boolean
          name_en: string
          name_th: string
          reorder_point: number
          requires_tagon: boolean
          sku: string
          track_serial: boolean
          unit: string
          updated_at: string
          warranty_days: number | null
        }
        Insert: {
          barcode?: string | null
          brand_id?: string | null
          capacity_mah?: number | null
          category_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name_en: string
          name_th: string
          reorder_point?: number
          requires_tagon?: boolean
          sku: string
          track_serial?: boolean
          unit?: string
          updated_at?: string
          warranty_days?: number | null
        }
        Update: {
          barcode?: string | null
          brand_id?: string | null
          capacity_mah?: number | null
          category_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name_en?: string
          name_th?: string
          reorder_point?: number
          requires_tagon?: boolean
          sku?: string
          track_serial?: boolean
          unit?: string
          updated_at?: string
          warranty_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          id: string
          line_total: number | null
          product_id: string
          purchase_order_id: string
          qty_ordered: number
          qty_received: number
          unit_cost: number
        }
        Insert: {
          id?: string
          line_total?: number | null
          product_id: string
          purchase_order_id: string
          qty_ordered: number
          qty_received?: number
          unit_cost: number
        }
        Update: {
          id?: string
          line_total?: number | null
          product_id?: string
          purchase_order_id?: string
          qty_ordered?: number
          qty_received?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_claim_rate_by_product"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_stock_summary"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          created_by: string | null
          doc_no: string
          expected_date: string | null
          grand_total: number
          id: string
          note: string | null
          order_date: string
          other_cost: number
          shipping_cost: number
          status: Database["public"]["Enums"]["po_status"]
          subtotal: number
          supplier_id: string
          tax_mode: Database["public"]["Enums"]["tax_mode"]
          vat_amount: number
          vat_rate: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          doc_no: string
          expected_date?: string | null
          grand_total?: number
          id?: string
          note?: string | null
          order_date?: string
          other_cost?: number
          shipping_cost?: number
          status?: Database["public"]["Enums"]["po_status"]
          subtotal?: number
          supplier_id: string
          tax_mode?: Database["public"]["Enums"]["tax_mode"]
          vat_amount?: number
          vat_rate?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          doc_no?: string
          expected_date?: string | null
          grand_total?: number
          id?: string
          note?: string | null
          order_date?: string
          other_cost?: number
          shipping_cost?: number
          status?: Database["public"]["Enums"]["po_status"]
          subtotal?: number
          supplier_id?: string
          tax_mode?: Database["public"]["Enums"]["tax_mode"]
          vat_amount?: number
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_supplier_price_compare"
            referencedColumns: ["supplier_id"]
          },
        ]
      }
      repair_job_items: {
        Row: {
          id: string
          is_issued: boolean
          is_optional: boolean
          lot_id: string | null
          product_id: string
          qty: number
          repair_job_id: string
          stock_item_id: string | null
          unit_cost: number
          unit_price: number
        }
        Insert: {
          id?: string
          is_issued?: boolean
          is_optional?: boolean
          lot_id?: string | null
          product_id: string
          qty?: number
          repair_job_id: string
          stock_item_id?: string | null
          unit_cost?: number
          unit_price?: number
        }
        Update: {
          id?: string
          is_issued?: boolean
          is_optional?: boolean
          lot_id?: string | null
          product_id?: string
          qty?: number
          repair_job_id?: string
          stock_item_id?: string | null
          unit_cost?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "repair_job_items_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "inventory_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repair_job_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repair_job_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_claim_rate_by_product"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "repair_job_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_stock_summary"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "repair_job_items_repair_job_id_fkey"
            columns: ["repair_job_id"]
            isOneToOne: false
            referencedRelation: "repair_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repair_job_items_stock_item_id_fkey"
            columns: ["stock_item_id"]
            isOneToOne: false
            referencedRelation: "stock_items"
            referencedColumns: ["id"]
          },
        ]
      }
      repair_jobs: {
        Row: {
          closed_at: string | null
          created_by: string | null
          customer_id: string
          delivered_at: string | null
          device_color: string | null
          device_imei: string
          device_model_id: string | null
          diagnosis: string | null
          discount: number
          doc_no: string
          grand_total: number
          gross_profit: number
          id: string
          job_kind: Database["public"]["Enums"]["party_kind"]
          labor_fee: number
          note: string | null
          parts_cost_total: number
          parts_total: number
          passcode: string | null
          price_tier: Database["public"]["Enums"]["price_tier"]
          received_at: string
          status: Database["public"]["Enums"]["job_status"]
          symptom: string | null
          tax_mode: Database["public"]["Enums"]["tax_mode"]
          technician_id: string | null
          vat_rate: number
        }
        Insert: {
          closed_at?: string | null
          created_by?: string | null
          customer_id: string
          delivered_at?: string | null
          device_color?: string | null
          device_imei: string
          device_model_id?: string | null
          diagnosis?: string | null
          discount?: number
          doc_no: string
          grand_total?: number
          gross_profit?: number
          id?: string
          job_kind: Database["public"]["Enums"]["party_kind"]
          labor_fee?: number
          note?: string | null
          parts_cost_total?: number
          parts_total?: number
          passcode?: string | null
          price_tier?: Database["public"]["Enums"]["price_tier"]
          received_at?: string
          status?: Database["public"]["Enums"]["job_status"]
          symptom?: string | null
          tax_mode?: Database["public"]["Enums"]["tax_mode"]
          technician_id?: string | null
          vat_rate?: number
        }
        Update: {
          closed_at?: string | null
          created_by?: string | null
          customer_id?: string
          delivered_at?: string | null
          device_color?: string | null
          device_imei?: string
          device_model_id?: string | null
          diagnosis?: string | null
          discount?: number
          doc_no?: string
          grand_total?: number
          gross_profit?: number
          id?: string
          job_kind?: Database["public"]["Enums"]["party_kind"]
          labor_fee?: number
          note?: string | null
          parts_cost_total?: number
          parts_total?: number
          passcode?: string | null
          price_tier?: Database["public"]["Enums"]["price_tier"]
          received_at?: string
          status?: Database["public"]["Enums"]["job_status"]
          symptom?: string | null
          tax_mode?: Database["public"]["Enums"]["tax_mode"]
          technician_id?: string | null
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "repair_jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repair_jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repair_jobs_device_model_id_fkey"
            columns: ["device_model_id"]
            isOneToOne: false
            referencedRelation: "device_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repair_jobs_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_order_items: {
        Row: {
          id: string
          lot_id: string | null
          product_id: string
          qty: number
          sales_order_id: string
          stock_item_id: string | null
          unit_cost: number
          unit_price: number
        }
        Insert: {
          id?: string
          lot_id?: string | null
          product_id: string
          qty: number
          sales_order_id: string
          stock_item_id?: string | null
          unit_cost?: number
          unit_price: number
        }
        Update: {
          id?: string
          lot_id?: string | null
          product_id?: string
          qty?: number
          sales_order_id?: string
          stock_item_id?: string | null
          unit_cost?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_order_items_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "inventory_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_claim_rate_by_product"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "sales_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_stock_summary"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "sales_order_items_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_items_stock_item_id_fkey"
            columns: ["stock_item_id"]
            isOneToOne: false
            referencedRelation: "stock_items"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_orders: {
        Row: {
          cost_total: number
          created_by: string | null
          customer_id: string
          discount: number
          doc_no: string
          grand_total: number
          gross_profit: number
          id: string
          note: string | null
          price_tier: Database["public"]["Enums"]["price_tier"]
          sold_at: string
          subtotal: number
          tax_mode: Database["public"]["Enums"]["tax_mode"]
          vat_amount: number
          vat_rate: number
        }
        Insert: {
          cost_total?: number
          created_by?: string | null
          customer_id: string
          discount?: number
          doc_no: string
          grand_total?: number
          gross_profit?: number
          id?: string
          note?: string | null
          price_tier?: Database["public"]["Enums"]["price_tier"]
          sold_at?: string
          subtotal?: number
          tax_mode?: Database["public"]["Enums"]["tax_mode"]
          vat_amount?: number
          vat_rate?: number
        }
        Update: {
          cost_total?: number
          created_by?: string | null
          customer_id?: string
          discount?: number
          doc_no?: string
          grand_total?: number
          gross_profit?: number
          id?: string
          note?: string | null
          price_tier?: Database["public"]["Enums"]["price_tier"]
          sold_at?: string
          subtotal?: number
          tax_mode?: Database["public"]["Enums"]["tax_mode"]
          vat_amount?: number
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_items: {
        Row: {
          condition: Database["public"]["Enums"]["stock_condition"]
          created_at: string
          id: string
          installed_device_imei: string | null
          lot_id: string
          product_id: string
          repair_job_id: string | null
          sales_order_id: string | null
          serial_no: string | null
        }
        Insert: {
          condition?: Database["public"]["Enums"]["stock_condition"]
          created_at?: string
          id?: string
          installed_device_imei?: string | null
          lot_id: string
          product_id: string
          repair_job_id?: string | null
          sales_order_id?: string | null
          serial_no?: string | null
        }
        Update: {
          condition?: Database["public"]["Enums"]["stock_condition"]
          created_at?: string
          id?: string
          installed_device_imei?: string | null
          lot_id?: string
          product_id?: string
          repair_job_id?: string | null
          sales_order_id?: string | null
          serial_no?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_items_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "inventory_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_claim_rate_by_product"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "stock_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_stock_summary"
            referencedColumns: ["product_id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          condition_from: Database["public"]["Enums"]["stock_condition"] | null
          condition_to: Database["public"]["Enums"]["stock_condition"] | null
          created_at: string
          created_by: string | null
          device_imei: string | null
          id: string
          lot_id: string | null
          movement_type: Database["public"]["Enums"]["movement_type"]
          note: string | null
          product_id: string
          qty: number
          ref_id: string | null
          ref_table: string | null
          stock_item_id: string | null
          unit_cost: number
        }
        Insert: {
          condition_from?: Database["public"]["Enums"]["stock_condition"] | null
          condition_to?: Database["public"]["Enums"]["stock_condition"] | null
          created_at?: string
          created_by?: string | null
          device_imei?: string | null
          id?: string
          lot_id?: string | null
          movement_type: Database["public"]["Enums"]["movement_type"]
          note?: string | null
          product_id: string
          qty: number
          ref_id?: string | null
          ref_table?: string | null
          stock_item_id?: string | null
          unit_cost?: number
        }
        Update: {
          condition_from?: Database["public"]["Enums"]["stock_condition"] | null
          condition_to?: Database["public"]["Enums"]["stock_condition"] | null
          created_at?: string
          created_by?: string | null
          device_imei?: string | null
          id?: string
          lot_id?: string | null
          movement_type?: Database["public"]["Enums"]["movement_type"]
          note?: string | null
          product_id?: string
          qty?: number
          ref_id?: string | null
          ref_table?: string | null
          stock_item_id?: string | null
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "inventory_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_claim_rate_by_product"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_stock_summary"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "stock_movements_stock_item_id_fkey"
            columns: ["stock_item_id"]
            isOneToOne: false
            referencedRelation: "stock_items"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_products: {
        Row: {
          id: string
          last_price: number | null
          last_purchased_at: string | null
          product_id: string
          supplier_id: string
          supplier_sku: string | null
        }
        Insert: {
          id?: string
          last_price?: number | null
          last_purchased_at?: string | null
          product_id: string
          supplier_id: string
          supplier_sku?: string | null
        }
        Update: {
          id?: string
          last_price?: number | null
          last_purchased_at?: string | null
          product_id?: string
          supplier_id?: string
          supplier_sku?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_claim_rate_by_product"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "supplier_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_stock_summary"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "supplier_products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_supplier_price_compare"
            referencedColumns: ["supplier_id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          bank_account: string | null
          code: string | null
          contact_person: string | null
          created_at: string
          id: string
          is_active: boolean
          lead_time_days: number | null
          line_id: string | null
          name: string
          note: string | null
          payment_terms_days: number
          phone: string | null
          rating: number | null
          shop_name: string | null
          tax_id: string | null
        }
        Insert: {
          address?: string | null
          bank_account?: string | null
          code?: string | null
          contact_person?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          lead_time_days?: number | null
          line_id?: string | null
          name: string
          note?: string | null
          payment_terms_days?: number
          phone?: string | null
          rating?: number | null
          shop_name?: string | null
          tax_id?: string | null
        }
        Update: {
          address?: string | null
          bank_account?: string | null
          code?: string | null
          contact_person?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          lead_time_days?: number | null
          line_id?: string | null
          name?: string
          note?: string | null
          payment_terms_days?: number
          phone?: string | null
          rating?: number | null
          shop_name?: string | null
          tax_id?: string | null
        }
        Relationships: []
      }
      warranties: {
        Row: {
          customer_id: string | null
          days: number
          device_imei: string | null
          end_date: string | null
          id: string
          is_void: boolean
          lot_id: string | null
          note: string | null
          product_id: string
          source_id: string
          source_table: string
          start_date: string
          stock_item_id: string | null
        }
        Insert: {
          customer_id?: string | null
          days: number
          device_imei?: string | null
          end_date?: string | null
          id?: string
          is_void?: boolean
          lot_id?: string | null
          note?: string | null
          product_id: string
          source_id: string
          source_table: string
          start_date?: string
          stock_item_id?: string | null
        }
        Update: {
          customer_id?: string | null
          days?: number
          device_imei?: string | null
          end_date?: string | null
          id?: string
          is_void?: boolean
          lot_id?: string | null
          note?: string | null
          product_id?: string
          source_id?: string
          source_table?: string
          start_date?: string
          stock_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warranties_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranties_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "inventory_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranties_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranties_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_claim_rate_by_product"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "warranties_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_stock_summary"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "warranties_stock_item_id_fkey"
            columns: ["stock_item_id"]
            isOneToOne: false
            referencedRelation: "stock_items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_claim_rate_by_product: {
        Row: {
          claim_rate_pct: number | null
          name_th: string | null
          product_id: string | null
          qty_claimed: number | null
          qty_sold: number | null
          sku: string | null
        }
        Relationships: []
      }
      v_stock_summary: {
        Row: {
          brand_name: string | null
          category_slug: string | null
          last_cost: number | null
          name_en: string | null
          name_th: string | null
          product_id: string | null
          qty_available: number | null
          qty_defective: number | null
          qty_good: number | null
          qty_reserved: number | null
          qty_scrap: number | null
          reorder_point: number | null
          sku: string | null
          stock_value: number | null
          wac_cost: number | null
        }
        Relationships: []
      }
      v_supplier_price_compare: {
        Row: {
          last_price: number | null
          last_purchased_at: string | null
          name_th: string | null
          price_rank: number | null
          product_id: string | null
          sku: string | null
          supplier_id: string | null
          supplier_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_claim_rate_by_product"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "supplier_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_stock_summary"
            referencedColumns: ["product_id"]
          },
        ]
      }
    }
    Functions: {
      auth_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      generate_goods_receipt_doc_no: { Args: never; Returns: string }
      generate_lot_no: { Args: never; Returns: string }
      generate_purchase_order_doc_no: { Args: never; Returns: string }
      is_active_user: { Args: never; Returns: boolean }
      receive_goods: {
        Args: {
          p_items: Json
          p_note: string
          p_purchase_order_id: string
          p_received_date: string
          p_shipping_cost: number
          p_supplier_id: string
        }
        Returns: string
      }
    }
    Enums: {
      claim_status:
        | "open"
        | "sent"
        | "replaced"
        | "refunded"
        | "rejected"
        | "closed"
      costing_method: "fifo" | "wac" | "last"
      job_status:
        | "received"
        | "diagnosing"
        | "waiting_parts"
        | "in_progress"
        | "done"
        | "delivered"
        | "cancelled"
      movement_type:
        | "receipt"
        | "issue_sale"
        | "issue_repair"
        | "adjust_in"
        | "adjust_out"
        | "claim_out"
        | "claim_in"
        | "return_in"
        | "transfer_condition"
      party_kind: "dealer" | "walkin" | "internal"
      po_status: "draft" | "ordered" | "partial" | "received" | "cancelled"
      price_tier: "wholesale" | "retail"
      stock_condition:
        | "good"
        | "defective_pending_claim"
        | "scrap"
        | "sent_to_supplier"
      tax_mode: "none" | "inclusive" | "exclusive"
      user_role: "owner" | "manager" | "technician" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      claim_status: [
        "open",
        "sent",
        "replaced",
        "refunded",
        "rejected",
        "closed",
      ],
      costing_method: ["fifo", "wac", "last"],
      job_status: [
        "received",
        "diagnosing",
        "waiting_parts",
        "in_progress",
        "done",
        "delivered",
        "cancelled",
      ],
      movement_type: [
        "receipt",
        "issue_sale",
        "issue_repair",
        "adjust_in",
        "adjust_out",
        "claim_out",
        "claim_in",
        "return_in",
        "transfer_condition",
      ],
      party_kind: ["dealer", "walkin", "internal"],
      po_status: ["draft", "ordered", "partial", "received", "cancelled"],
      price_tier: ["wholesale", "retail"],
      stock_condition: [
        "good",
        "defective_pending_claim",
        "scrap",
        "sent_to_supplier",
      ],
      tax_mode: ["none", "inclusive", "exclusive"],
      user_role: ["owner", "manager", "technician", "viewer"],
    },
  },
} as const
