import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  cpf: text("cpf").notNull(),
  cep: text("cep").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  deliveryMethod: text("delivery_method").notNull(),
  paymentMethod: text("payment_method").notNull().default("pix"),
  shippingFee: real("shipping_fee").notNull().default(0),
  total: real("total").notNull(),
  status: text("status").notNull().default("novo"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_orders_status_created_at").on(table.status, table.createdAt)]);

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: text("order_id").notNull(),
  productId: text("product_id").notNull(),
  sku: text("sku").notNull(),
  name: text("name").notNull(),
  size: text("size").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
}, (table) => [index("idx_order_items_order_id").on(table.orderId)]);

export const inventory = sqliteTable("inventory", {
  sku: text("sku").primaryKey(),
  stock: integer("stock").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
