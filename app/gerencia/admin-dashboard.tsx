"use client";

import { ArrowLeft, Boxes, Check, LogOut, PackageCheck, RefreshCw, ShoppingBag, TrendingUp } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { apiUrl, appHref } from "../../lib/runtime";

type Order = { id:string; customerName:string; city:string; state:string; deliveryMethod:string; paymentMethod:string; shippingFee:number; total:number; status:string; createdAt:string; items:Array<{ name:string; size:string; quantity:number }> };
type Stock = { sku:string; name:string; category:string; stock:number };

const storageKey = "podepa-manager-code";
const testManagerCode = "PodePa-37V!9qL2";

export default function AdminDashboard({ managerName }: { managerName:string }) {
  const [view,setView] = useState<"overview"|"orders"|"stock">("overview");
  const [stockOnlyLow,setStockOnlyLow] = useState(false);
  const [orders,setOrders] = useState<Order[]>([]);
  const [inventory,setInventory] = useState<Stock[]>([]);
  const [managerCode,setManagerCode] = useState("");
  const [codeInput,setCodeInput] = useState(testManagerCode);
  const [managerDisplay,setManagerDisplay] = useState(managerName);
  const [authenticated,setAuthenticated] = useState(false);
  const [authReady,setAuthReady] = useState(false);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");
  const [saved,setSaved] = useState("");

  const load = useCallback(async (code:string) => {
    setLoading(true); setError("");
    try {
      const response = await fetch(apiUrl("/api/admin/dashboard"), { cache:"no-store", headers:{"X-Manager-Code":code} });
      const data = await response.json() as {orders:Order[];inventory:Stock[];manager?:{displayName?:string};error?:string};
      if (!response.ok) throw new Error(data.error);
      setOrders(data.orders); setInventory(data.inventory);
      setManagerDisplay(data.manager?.displayName || managerName);
      setAuthenticated(true); setManagerCode(code);
      window.sessionStorage.setItem(storageKey,code);
    } catch (err) {
      setAuthenticated(false);
      window.sessionStorage.removeItem(storageKey);
      setError(err instanceof Error ? err.message : "Não foi possível carregar o painel.");
    } finally { setLoading(false); setAuthReady(true); }
  },[managerName]);

  useEffect(() => {
    const stored = window.sessionStorage.getItem(storageKey);
    if (stored) { setCodeInput(stored); void load(stored); }
    else setAuthReady(true);
  },[load]);

  function signIn(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = codeInput.trim();
    if (!code) { setError("Digite a senha da gerência."); return; }
    void load(code);
  }

  function signOut() {
    window.sessionStorage.removeItem(storageKey);
    setAuthenticated(false); setManagerCode(""); setCodeInput(testManagerCode); setError("");
  }

  const revenue = useMemo(() => orders.reduce((sum,order) => sum + Number(order.total),0),[orders]);
  const lowInventory = inventory.filter((item) => item.stock <= 5);
  const lowStock = lowInventory.length;

  async function updateStock(sku:string, stock:number) {
    setInventory((current) => current.map((item) => item.sku === sku ? {...item,stock} : item));
    const response = await fetch(apiUrl("/api/admin/dashboard"), { method:"PATCH", headers:{"Content-Type":"application/json","X-Manager-Code":managerCode}, body:JSON.stringify({sku,stock}) });
    const data = await response.json() as {error?:string};
    if (!response.ok) { setError(data.error || "Não foi possível atualizar o estoque."); if (response.status === 401) signOut(); return; }
    setSaved(sku); window.setTimeout(() => setSaved(""),1800);
  }

  if (!authReady) return <main className="manager-login-page"><div className="manager-login-card"><p>GERÊNCIA PODE PÁ</p><h1>Verificando acesso…</h1></div></main>;
  if (!authenticated) return <main className="manager-login-page">
    <form className="manager-login-card" onSubmit={signIn}>
      <a className="brand manager-login-brand" href={appHref("/")}><span>Pode Pá</span><small>MULTIMARCAS</small></a>
      <p>ÁREA DA GERÊNCIA</p><h1>Acesso da loja</h1>
      <span>Use a senha administrativa da Pode Pá. Não é necessário entrar no ChatGPT.</span>
      <label>Senha da gerência<input type="text" value={codeInput} onChange={(event)=>setCodeInput(event.target.value)} autoComplete="off" required autoFocus/></label>
      {error&&<div className="admin-error">{error}</div>}
      <button type="submit" disabled={loading}>{loading?"Entrando…":"Acessar painel"}</button>
      <a className="manager-login-back" href={appHref("/")}><ArrowLeft/> Voltar à loja</a>
    </form>
  </main>;

  const paymentName = (method:string) => method === "credit" ? "cartão de crédito" : method === "debit" ? "cartão de débito" : "Pix";
  const ordersPanel = <section className="admin-panel"><div className="panel-title"><div><p>FLUXO DE PEDIDOS</p><h2>Pedidos recentes</h2></div><span>{orders.length} registros</span></div>{loading ? <div className="loading-line">Carregando pedidos…</div> : orders.length === 0 ? <div className="admin-empty">Os novos pedidos aparecerão aqui.</div> : <div className="orders-list">{orders.map((order) => <article key={order.id}><div><strong>{order.id}</strong><span>{new Date(order.createdAt).toLocaleDateString("pt-BR")}</span></div><p>{order.customerName} • {order.city}/{order.state}</p><small>{order.items.map((item) => `${item.quantity}× ${item.name} (${item.size})`).join(" · ")}</small><small>Pagamento: {paymentName(order.paymentMethod)}</small><footer><b>{Number(order.total).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</b><span className="status-chip">{order.status}</span></footer></article>)}</div>}</section>;
  const renderStockPanel = (items:Stock[], lowOnly=false) => <section className="admin-panel"><div className="panel-title"><div><p>{lowOnly?"ESTOQUE BAIXO":"CONTROLE DE ESTOQUE"}</p><h2>{lowOnly?"Reposição necessária":"Produtos disponíveis"}</h2></div><span>{items.length} {items.length===1?"item":"itens"}</span></div>{loading?<div className="loading-line">Carregando estoque…</div>:items.length===0?<div className="admin-empty">{lowOnly?"Nenhum produto com estoque baixo.":"Nenhum produto disponível."}</div>:<div className="stock-list">{items.map((item) => <div key={item.sku}><span><strong>{item.name}</strong><small>{item.category} • {item.sku}</small></span><label><input aria-label={`Estoque de ${item.name}`} type="number" min="0" max="999" value={item.stock} onChange={(event) => void updateStock(item.sku,Number(event.target.value))}/>{saved === item.sku && <Check />}</label></div>)}</div>}</section>;
  const stockPanel = renderStockPanel(stockOnlyLow?lowInventory:inventory,stockOnlyLow);
  const lowStockPanel = renderStockPanel(lowInventory,true);
  return <main className="admin-shell">
    <aside className="admin-sidebar">
      <a className="brand admin-brand" href={appHref("/")}><span>Pode Pá</span><small>GERÊNCIA</small></a>
      <div className="admin-nav"><button type="button" className={view==="overview"?"active":""} onClick={()=>setView("overview")}><TrendingUp /> Visão geral</button><button type="button" className={view==="orders"?"active":""} onClick={()=>setView("orders")}><ShoppingBag /> Pedidos</button><button type="button" className={view==="stock"?"active":""} onClick={()=>{setStockOnlyLow(false);setView("stock")}}><Boxes /> Estoque</button></div>
      <a className="admin-back" href={appHref("/")}><ArrowLeft /> Voltar à loja</a>
    </aside>
    <section className="admin-main">
      <header className="admin-header"><div><p>PAINEL OPERACIONAL</p><h1>Bom trabalho, {managerDisplay.split(" ")[0]}.</h1></div><div><button onClick={() => void load(managerCode)} aria-label="Atualizar dados"><RefreshCw /></button><button onClick={signOut}><LogOut /> Sair</button></div></header>
      {error && <div className="admin-error">{error}</div>}
      {view==="overview"&&<><div className="metric-grid"><button type="button" onClick={()=>setView("orders")}><span><ShoppingBag /></span><p>Pedidos</p><strong>{loading ? "—" : orders.length}</strong></button><article><span><TrendingUp /></span><p>Faturamento registrado</p><strong>{loading ? "—" : revenue.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</strong></article><button type="button" onClick={()=>{setStockOnlyLow(true);setView("stock")}}><span><PackageCheck /></span><p>Estoque baixo</p><strong>{loading ? "—" : lowStock}</strong></button></div><div className="admin-columns">{ordersPanel}{lowStockPanel}</div></>}
      {view==="orders"&&<div className="admin-focus"><div className="admin-focus-heading"><div><p>GESTÃO DE PEDIDOS</p><h2>Todos os pedidos</h2></div><button type="button" onClick={()=>void load(managerCode)}><RefreshCw/> Atualizar</button></div>{ordersPanel}</div>}
      {view==="stock"&&<div className="admin-focus"><div className="admin-focus-heading"><div><p>GESTÃO DE ESTOQUE</p><h2>{stockOnlyLow?"Produtos com estoque baixo":"Atualize as quantidades"}</h2></div>{stockOnlyLow?<button type="button" onClick={()=>setStockOnlyLow(false)}>Ver estoque completo</button>:<span>As alterações são salvas automaticamente.</span>}</div>{stockPanel}</div>}
    </section>
  </main>;
}
