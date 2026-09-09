"use client";

import { ArrowLeft, Boxes, Check, LogOut, PackageCheck, RefreshCw, ShoppingBag, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type Order = { id:string; customerName:string; city:string; state:string; deliveryMethod:string; shippingFee:number; total:number; status:string; createdAt:string; items:Array<{ name:string; size:string; quantity:number }> };
type Stock = { sku:string; name:string; category:string; stock:number };

export default function AdminDashboard({ managerName }: { managerName:string }) {
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
  return <main className="admin-shell">
    <aside className="admin-sidebar">
      <a className="brand admin-brand" href="/"><span>Pode Pá</span><small>GERÊNCIA</small></a>
      <div className="admin-nav"><button className="active"><TrendingUp /> Visão geral</button><button><ShoppingBag /> Pedidos</button><button><Boxes /> Estoque</button></div>
      <a className="admin-back" href="/"><ArrowLeft /> Voltar à loja</a>
    </aside>
    <section className="admin-main">
      <header className="admin-header"><div><p>PAINEL OPERACIONAL</p><h1>Bom trabalho, {managerName.split(" ")[0]}.</h1></div><div><button onClick={() => void load()} aria-label="Atualizar dados"><RefreshCw /></button><a href="/signout-with-chatgpt?return_to=/"><LogOut /> Sair</a></div></header>
      {error && <div className="admin-error">{error}</div>}
      <div className="metric-grid"><article><span><ShoppingBag /></span><p>Pedidos</p><strong>{loading ? "—" : orders.length}</strong></article><article><span><TrendingUp /></span><p>Faturamento registrado</p><strong>{loading ? "—" : revenue.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</strong></article><article><span><PackageCheck /></span><p>Estoque baixo</p><strong>{loading ? "—" : lowStock}</strong></article></div>
      <div className="admin-columns">
        <section className="admin-panel"><div className="panel-title"><div><p>FLUXO DE PEDIDOS</p><h2>Pedidos recentes</h2></div><span>{orders.length} registros</span></div>{loading ? <div className="loading-line">Carregando pedidos…</div> : orders.length === 0 ? <div className="admin-empty">Os novos pedidos aparecerão aqui.</div> : <div className="orders-list">{orders.map((order) => <article key={order.id}><div><strong>{order.id}</strong><span>{new Date(order.createdAt).toLocaleDateString("pt-BR")}</span></div><p>{order.customerName} • {order.city}/{order.state}</p><small>{order.items.map((item) => `${item.quantity}× ${item.name} (${item.size})`).join(" · ")}</small><footer><b>{Number(order.total).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</b><span className="status-chip">{order.status}</span></footer></article>)}</div>}</section>
        <section className="admin-panel"><div className="panel-title"><div><p>CONTROLE RÁPIDO</p><h2>Estoque</h2></div></div><div className="stock-list">{inventory.map((item) => <div key={item.sku}><span><strong>{item.name}</strong><small>{item.category} • {item.sku}</small></span><label><input aria-label={`Estoque de ${item.name}`} type="number" min="0" max="999" value={item.stock} onChange={(event) => void updateStock(item.sku,Number(event.target.value))}/>{saved === item.sku && <Check />}</label></div>)}</div></section>
      </div>
    </section>
  </main>;
}
