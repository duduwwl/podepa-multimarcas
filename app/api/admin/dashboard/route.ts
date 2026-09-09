import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { catalog } from "../../../../lib/catalog";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error:"Faça login para acessar a gerência." }, { status:401 });
  try {
    const [ordersResult, itemsResult, inventoryResult] = await env.DB.batch([
      env.DB.prepare("SELECT id, customer_name as customerName, email, phone, cep, city, state, delivery_method as deliveryMethod, shipping_fee as shippingFee, total, status, created_at as createdAt FROM orders ORDER BY created_at DESC LIMIT 100"),
      env.DB.prepare("SELECT order_id as orderId, name, size, quantity, unit_price as unitPrice FROM order_items ORDER BY id ASC"),
      env.DB.prepare("SELECT sku, stock, updated_at as updatedAt FROM inventory"),
    ]);
    const items = itemsResult.results as Array<{ orderId:string; name:string; size:string; quantity:number; unitPrice:number }>;
    const orders = (ordersResult.results as Array<Record<string, unknown>>).map((order) => ({ ...order, items:items.filter((item) => item.orderId === order.id) }));
    const overrides = new Map((inventoryResult.results as Array<{ sku:string; stock:number }>).map((row) => [row.sku, row.stock]));
    const inventory = catalog.map((product) => ({ sku:product.sku, name:product.name, category:product.category, stock:overrides.get(product.sku) ?? product.initialStock }));
    return Response.json({ orders, inventory, manager:{ displayName:user.displayName, email:user.email } });
  } catch (error) {
    return Response.json({ error:error instanceof Error ? error.message : "Painel temporariamente indisponível." }, { status:500 });
  }
}

export async function PATCH(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error:"Não autorizado." }, { status:401 });
  const data = await request.json() as { sku?: string; stock?: number };
  const product = catalog.find((item) => item.sku === data.sku);
  const stock = Number(data.stock);
  if (!product || !Number.isInteger(stock) || stock < 0 || stock > 999) return Response.json({ error:"Estoque inválido." }, { status:400 });
  await env.DB.prepare("INSERT INTO inventory (sku, stock, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(sku) DO UPDATE SET stock = excluded.stock, updated_at = CURRENT_TIMESTAMP").bind(product.sku, stock).run();
  return Response.json({ sku:product.sku, stock });
}
