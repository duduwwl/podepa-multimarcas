"use client";

import { ArrowLeft, Boxes, Check, LogOut, PackageCheck, RefreshCw, ShoppingBag, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type Order = { id:string; customerName:string; city:string; state:string; deliveryMethod:string; paymentMethod:string; shippingFee:number; total:number; status:string; createdAt:string; items:Array<{ name:string; size:string; quantity:number }> };
type Stock = { sku:string; name:string; category:string; stock:number };

export default function AdminDashboard({ managerName }: { managerName:string }) {
  const [view,setView] = useState<"overview"|"orders"|"stock">("overview");
  const [orders,setOrders] = useState<Order[]>([]);
  const [inventory,setInventory] = useState<Stock[]>([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");
  const [saved,setSaved] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const response = await fetch("/api/admin/dashboard", { cache:"no-store" }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setOrders(data.orders); setInventory(data.inventory); }
    catch (err) { setError(err instanceof Error ? err.message : "Não foi possível carregar o painel."); }
    finally { setLoading(false); }
  },[]);
  useEffect(() => { void load(); },[load]);
  const revenue = useMemo(() => orders.reduce((sum,order) => sum + Number(order.total),0),[orders]);
  const lowStock = inventory.filter((item) => item.stock <= 5).length;
  async function updateStock(sku:string, stock:number) {
    setInventory((current) => current.map((item) => item.sku === sku ? {...item,stock} : item));
    const response = await fetch("/api/admin/dashboard", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({sku,stock}) });
    const data = await response.json();
    if (!response.ok) { setError(data.error); return; }
    setSaved(sku); window.setTimeout(() => setSaved(""),1800);
  }
  const ordersPanel = <section className="admin-panel"><div className="panel-title"><div><p>FLUXO DE PEDIDOS</p><h2>Pedidos recentes</h2></div><span>{orders.length} registros</span></div>{loading ? <div className="loading-line">Carregando pedidos…</div> : orders.length === 0 ? <div className="admin-empty">Os novos pedidos aparecerão aqui.</div> : <div className="orders-list">{orders.map((order) => <article key={order.id}><div><strong>{order.id}</strong><span>{new Date(order.createdAt).toLocaleDateString("pt-BR")}</span></div><p>{order.customerName} • {order.city}/{order.state}</p><small>{order.items.map((item) => `${item.quantity}× ${item.name} (${item.size})`).join(" · ")}</small><small>Pagamento: {order.paymentMethod === "card" ? "cartão" : "Pix"}</small><footer><b>{Number(order.total).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</b><span className="status-chip">{order.status}</span></footer></article>)}</div>}</section>;
  const stockPanel = <section className="admin-panel"><div className="panel-title"><div><p>CONTROLE DE ESTOQUE</p><h2>Produtos disponíveis</h2></div><span>{inventory.length} itens</span></div>{loading?<div className="loading-line">Carregando estoque…</div>:<div className="stock-list">{inventory.map((item) => <div key={item.sku}><span><strong>{item.name}</strong><small>{item.category} • {item.sku}</small></span><label><input aria-label={`Estoque de ${item.name}`} type="number" min="0" max="999" value={item.stock} onChange={(event) => void updateStock(item.sku,Number(event.target.value))}/>{saved === item.sku && <Check />}</label></div>)}</div>}</section>;
  return <main className="admin-shell">
    <aside className="admin-sidebar">
      <a className="brand admin-brand" href="/"><span>Pode Pá</span><small>GERÊNCIA</small></a>
      <div className="admin-nav"><button type="button" className={view==="overview"?"active":""} onClick={()=>setView("overview")}><TrendingUp /> Visão geral</button><button type="button" className={view==="orders"?"active":""} onClick={()=>setView("orders")}><ShoppingBag /> Pedidos</button><button type="button" className={view==="stock"?"active":""} onClick={()=>setView("stock")}><Boxes /> Estoque</button></div>
      <a className="admin-back" href="/"><ArrowLeft /> Voltar à loja</a>
    </aside>
    <section className="admin-main">
      <header className="admin-header"><div><p>PAINEL OPERACIONAL</p><h1>Bom trabalho, {managerName.split(" ")[0]}.</h1></div><div><button onClick={() => void load()} aria-label="Atualizar dados"><RefreshCw /></button><a href="/signout-with-chatgpt?return_to=/"><LogOut /> Sair</a></div></header>
      {error && <div className="admin-error">{error}</div>}
      {view==="overview"&&<><div className="metric-grid"><button type="button" onClick={()=>setView("orders")}><span><ShoppingBag /></span><p>Pedidos</p><strong>{loading ? "—" : orders.length}</strong></button><article><span><TrendingUp /></span><p>Faturamento registrado</p><strong>{loading ? "—" : revenue.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</strong></article><button type="button" onClick={()=>setView("stock")}><span><PackageCheck /></span><p>Estoque baixo</p><strong>{loading ? "—" : lowStock}</strong></button></div><div className="admin-columns">{ordersPanel}{stockPanel}</div></>}
      {view==="orders"&&<div className="admin-focus"><div className="admin-focus-heading"><div><p>GESTÃO DE PEDIDOS</p><h2>Todos os pedidos</h2></div><button type="button" onClick={()=>void load()}><RefreshCw/> Atualizar</button></div>{ordersPanel}</div>}
      {view==="stock"&&<div className="admin-focus"><div className="admin-focus-heading"><div><p>GESTÃO DE ESTOQUE</p><h2>Atualize as quantidades</h2></div><span>As alterações são salvas automaticamente.</span></div>{stockPanel}</div>}
    </section>
  </main>;
}
