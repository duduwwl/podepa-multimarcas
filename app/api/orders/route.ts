import { env } from "cloudflare:workers";
import { catalog, productById } from "../../../lib/catalog";
import { shippingForState } from "../../../lib/shipping";
import { corsPreflight, jsonWithCors } from "../../../lib/cors";

type OrderItemInput = { productId?: string; size?: string; quantity?: number };

function validCPF(value: string) {
  const cpf = value.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  const calc = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(cpf[i]) * (length + 1 - i);
    const digit = (sum * 10) % 11;
    return digit === 10 ? 0 : digit;
  };
  return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]);
}

export async function POST(request: Request) {
  try {
    const db = env.DB;
    if (!db) throw new Error("Banco de dados não configurado.");
    const data = await request.json() as Record<string, unknown> & { items?: OrderItemInput[] };
    const deliveryMethod = String(data.deliveryMethod) === "pickup" ? "pickup" : "delivery";
    const paymentMethod = String(data.paymentMethod);
    const required = ["name","email","phone","cpf","deliveryMethod","paymentMethod",...(deliveryMethod === "delivery" ? ["cep","address","city","state"] : [])];
    if (required.some((key) => typeof data[key] !== "string" || !(data[key] as string).trim())) return jsonWithCors(request,{ error:"Preencha todos os dados do checkout." },{ status:400 });
    if (!["pix","credit","debit"].includes(paymentMethod)) return jsonWithCors(request,{ error:"Escolha uma forma de pagamento válida." },{ status:400 });
    if (!/^\S+@\S+\.\S+$/.test(String(data.email))) return jsonWithCors(request,{ error:"E-mail inválido." },{ status:400 });
    if (!validCPF(String(data.cpf))) return jsonWithCors(request,{ error:"CPF inválido." },{ status:400 });
    if (!Array.isArray(data.items) || data.items.length === 0) return jsonWithCors(request,{ error:"Sua sacola está vazia." },{ status:400 });

    const normalized = data.items.map((item) => {
      const product = productById.get(String(item.productId ?? ""));
      const quantity = Math.max(1, Math.min(10, Number(item.quantity ?? 1)));
      const size = String(item.size ?? "");
      const selectedSize = size.split(" • ")[0];
      if (!product || !product.sizes.includes(selectedSize)) throw new Error("Um item ou tamanho da sacola não é válido.");
      return { product, quantity, size };
    });
    const subtotal = normalized.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const quantity = normalized.reduce((sum, item) => sum + item.quantity, 0);
    const shippingFee = deliveryMethod === "pickup" ? 0 : shippingForState(String(data.state), quantity).fee;
    const total = Number((subtotal + shippingFee).toFixed(2));
    const orderId = `PP-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0,4).toUpperCase()}`;

    const statements = [
      db.prepare("INSERT INTO orders (id, customer_name, email, phone, cpf, cep, address, city, state, delivery_method, payment_method, shipping_fee, total, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'novo')").bind(orderId, String(data.name).trim(), String(data.email).trim(), String(data.phone).trim(), String(data.cpf).replace(/\D/g,""), deliveryMethod === "pickup" ? "" : String(data.cep).replace(/\D/g,""), deliveryMethod === "pickup" ? "Retirada na loja" : String(data.address).trim(), deliveryMethod === "pickup" ? "Lavras" : String(data.city).trim(), deliveryMethod === "pickup" ? "MG" : String(data.state).trim().toUpperCase(), deliveryMethod, paymentMethod, shippingFee, total),
      ...normalized.flatMap(({ product, quantity, size }) => [
        db.prepare("INSERT INTO order_items (order_id, product_id, sku, name, size, quantity, unit_price) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(orderId, product.id, product.sku, product.name, size, quantity, product.price),
        db.prepare("INSERT INTO inventory (sku, stock, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(sku) DO UPDATE SET stock = MAX(0, inventory.stock - ?), updated_at = CURRENT_TIMESTAMP").bind(product.sku, Math.max(0, product.initialStock - quantity), quantity),
      ]),
    ];
    await db.batch(statements);
    return jsonWithCors(request,{ orderId, subtotal:Number(subtotal.toFixed(2)), shippingFee, total, catalogSize:catalog.length },{ status:201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível registrar o pedido.";
    return jsonWithCors(request,{ error:message },{ status:500 });
  }
}

export function OPTIONS(request:Request) {
  return corsPreflight(request);
}
