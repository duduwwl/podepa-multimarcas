import { env } from "cloudflare:workers";
import { catalog } from "../../../../lib/catalog";
import { corsPreflight, jsonWithCors } from "../../../../lib/cors";

function authorized(request:Request) {
  const expected = (env as unknown as { MANAGER_ACCESS_CODE?:string }).MANAGER_ACCESS_CODE;
  return Boolean(expected && request.headers.get("x-manager-code") === expected);
}

export function OPTIONS(request:Request) {
  return corsPreflight(request);
}

export async function GET(request:Request) {
  if (!authorized(request)) return jsonWithCors(request,{ error:"Senha da gerência incorreta." },{ status:401 });
  try {
    const db = env.DB;
    if (!db) throw new Error("Banco de dados não configurado.");
    const [ordersResult, itemsResult, inventoryResult] = await db.batch([
      db.prepare("SELECT id, customer_name as customerName, email, phone, cep, city, state, delivery_method as deliveryMethod, payment_method as paymentMethod, shipping_fee as shippingFee, total, status, created_at as createdAt FROM orders ORDER BY created_at DESC LIMIT 100"),
      db.prepare("SELECT order_id as orderId, name, size, quantity, unit_price as unitPrice FROM order_items ORDER BY id ASC"),
      db.prepare("SELECT sku, stock, updated_at as updatedAt FROM inventory"),
    ]);
    const items = itemsResult.results as Array<{ orderId:string; name:string; size:string; quantity:number; unitPrice:number }>;
    const orders = (ordersResult.results as Array<Record<string, unknown>>).map((order) => ({ ...order, items:items.filter((item) => item.orderId === order.id) }));
    const overrides = new Map((inventoryResult.results as Array<{ sku:string; stock:number }>).map((row) => [row.sku, row.stock]));
    const inventory = catalog.map((product) => ({ sku:product.sku, name:product.name, category:product.category, stock:overrides.get(product.sku) ?? product.initialStock }));
    return jsonWithCors(request,{ orders, inventory, manager:{ displayName:"Gerência" } });
  } catch (error) {
    return jsonWithCors(request,{ error:error instanceof Error ? error.message : "Painel temporariamente indisponível." },{ status:500 });
  }
}

export async function PATCH(request: Request) {
  if (!authorized(request)) return jsonWithCors(request,{ error:"Senha da gerência incorreta." },{ status:401 });
  const data = await request.json() as { sku?: string; stock?: number };
  const product = catalog.find((item) => item.sku === data.sku);
  const stock = Number(data.stock);
  if (!product || !Number.isInteger(stock) || stock < 0 || stock > 999) return jsonWithCors(request,{ error:"Estoque inválido." },{ status:400 });
  const db = env.DB;
  if (!db) return jsonWithCors(request,{ error:"Banco de dados não configurado." },{ status:500 });
  await db.prepare("INSERT INTO inventory (sku, stock, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(sku) DO UPDATE SET stock = excluded.stock, updated_at = CURRENT_TIMESTAMP").bind(product.sku, stock).run();
  return jsonWithCors(request,{ sku:product.sku, stock });
}
