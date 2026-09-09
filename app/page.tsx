"use client";

import { ArrowRight, Camera, CheckCircle2, ChevronLeft, ChevronRight, Heart, MapPin, Menu, MessageCircle, Minus, PackageCheck, Plus, Search, ShieldCheck, ShoppingBag, Sparkles, Trash2, Truck, UserRound, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { catalog, CatalogProduct, productById } from "../lib/catalog";

type CartItem = { productId:string; size:string; quantity:number };
type ShippingQuote = { fee:number; days:string; destination:{ state:string; city:string; street:string; neighborhood:string } };

const money = (value:number) => value.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

export default function Home() {
  const [active,setActive] = useState("Todos");
  const [query,setQuery] = useState("");
  const [sort,setSort] = useState("destaques");
  const [cart,setCart] = useState<CartItem[]>([]);
  const [selectedSizes,setSelectedSizes] = useState<Record<string,string>>({});
  const [imageIndexes,setImageIndexes] = useState<Record<string,number>>({});
  const [cartOpen,setCartOpen] = useState(false);
  const [checkout,setCheckout] = useState(false);
  const [mobileMenu,setMobileMenu] = useState(false);
  const [deliveryMethod,setDeliveryMethod] = useState<"delivery"|"pickup">("delivery");
  const [shipping,setShipping] = useState<ShippingQuote|null>(null);
  const [shippingError,setShippingError] = useState("");
  const [shippingLoading,setShippingLoading] = useState(false);
  const [orderLoading,setOrderLoading] = useState(false);
  const [orderError,setOrderError] = useState("");
  const [orderId,setOrderId] = useState("");

  const visible = useMemo(() => {
    let result = catalog.filter((product) => (active === "Todos" || product.category === active) && (!query || `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(query.toLowerCase())));
    if (sort === "menor") result = [...result].sort((a,b) => a.price-b.price);
    if (sort === "maior") result = [...result].sort((a,b) => b.price-a.price);
    return result;
  },[active,query,sort]);
  const cartCount = cart.reduce((sum,item) => sum+item.quantity,0);
  const subtotal = cart.reduce((sum,item) => sum+(productById.get(item.productId)?.price ?? 0)*item.quantity,0);
  const total = subtotal + (deliveryMethod === "delivery" ? shipping?.fee ?? 0 : 0);

  function addToCart(product:CatalogProduct,size?:string) {
    const chosen = size || selectedSizes[product.id] || product.sizes[0];
    setCart((current) => {
      const found = current.find((item) => item.productId === product.id && item.size === chosen);
      return found ? current.map((item) => item === found ? {...item,quantity:Math.min(10,item.quantity+1)} : item) : [...current,{productId:product.id,size:chosen,quantity:1}];
    });
    setCartOpen(true); setCheckout(false); setOrderId("");
  }
  function updateQuantity(index:number,delta:number) { setCart((current) => current.flatMap((item,i) => i !== index ? [item] : item.quantity+delta <= 0 ? [] : [{...item,quantity:Math.min(10,item.quantity+delta)}])); setShipping(null); }
  function nextImage(product:CatalogProduct,direction:number) { setImageIndexes((current) => ({...current,[product.id]:((current[product.id]??0)+direction+product.images.length)%product.images.length})); }

  async function calculateShipping(cep:string) {
    const clean = cep.replace(/\D/g,"");
    if (clean.length !== 8) { setShippingError("Digite um CEP com 8 números."); return null; }
    setShippingLoading(true); setShippingError("");
    try { const response = await fetch(`/api/shipping?cep=${clean}&items=${Math.max(1,cartCount)}`); const data = await response.json(); if (!response.ok) throw new Error(data.error); setShipping(data); return data as ShippingQuote; }
    catch (error) { setShippingError(error instanceof Error ? error.message : "Não foi possível calcular o frete."); return null; }
    finally { setShippingLoading(false); }
  }

  async function placeOrder(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); setOrderError(""); setOrderLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      let quote = shipping;
      if (deliveryMethod === "delivery" && !quote) quote = await calculateShipping(String(form.get("cep")??""));
      if (deliveryMethod === "delivery" && !quote) throw new Error("Calcule o frete antes de concluir.");
      const body = { name:form.get("name"), email:form.get("email"), phone:form.get("phone"), cpf:form.get("cpf"), cep:form.get("cep"), address:form.get("address"), city:form.get("city"), state:form.get("state"), deliveryMethod, items:cart };
      const response = await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      setOrderId(data.orderId); setCart([]);
    } catch (error) { setOrderError(error instanceof Error ? error.message : "Não foi possível concluir o pedido."); }
    finally { setOrderLoading(false); }
  }

  useEffect(() => {
    const context = (document as unknown as { modelContext?: { registerTool:(tool:Record<string,unknown>,options?:{signal?:AbortSignal})=>void|Promise<void> } }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = async () => {
      await context.registerTool({ name:"add_product_to_cart", title:"Adicionar produto à sacola", description:"Adiciona um produto disponível da Pode Pá à sacola visível, usando o primeiro tamanho quando nenhum for informado.", inputSchema:{type:"object",properties:{productId:{type:"string"},size:{type:"string"}},required:["productId"],additionalProperties:false}, annotations:{readOnlyHint:false,untrustedContentHint:false}, execute:(input:unknown) => { const value=input as {productId?:string;size?:string}; const product=productById.get(value.productId??""); if(!product) throw new Error("Produto não encontrado"); if(value.size && !product.sizes.includes(value.size)) throw new Error("Tamanho indisponível"); addToCart(product,value.size); return {productId:product.id,size:value.size||product.sizes[0],status:"added"}; } },{signal:lifecycle.signal});
      await context.registerTool({ name:"start_checkout", title:"Iniciar checkout", description:"Abre o checkout da sacola atual sem concluir o pedido.", inputSchema:{type:"object",properties:{},additionalProperties:false}, annotations:{readOnlyHint:false,untrustedContentHint:false}, execute:() => { if(cart.length===0) throw new Error("A sacola está vazia"); setCartOpen(true); setCheckout(true); return {status:"checkout_opened",items:cartCount}; } },{signal:lifecycle.signal});
    };
    void register().catch(() => undefined);
    return () => lifecycle.abort();
  },[cart.length,cartCount]);

  return <main>
    <div className="topbar">Lavras → Todo o Brasil <span>•</span> Retire grátis na loja</div>
    <header className="nav-shell">
      <button className="icon-button mobile-only" onClick={() => setMobileMenu(true)} aria-label="Abrir menu"><Menu /></button>
      <a className="brand" href="#inicio" aria-label="Pode Pá Multimarcas, início"><span>Pode Pá</span><small>MULTIMARCAS</small></a>
      <nav aria-label="Navegação principal"><a href="#novidades">Novidades</a><a href="#loja">Loja</a><a href="#loja" onClick={() => setActive("Kits")}>Kits</a><a href="#rodape">A loja</a></nav>
      <div className="nav-actions">
        <label className={`nav-search ${query ? "open" : ""}`}><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar no estoque" aria-label="Buscar no estoque" /></label>
        <a className="icon-button" href="/gerencia" aria-label="Área da gerência"><UserRound /></a>
        <button className="cart-button" onClick={() => setCartOpen(true)} aria-label={`Sacola com ${cartCount} itens`}><ShoppingBag /><span>{cartCount}</span></button>
      </div>
    </header>
    {mobileMenu && <div className="mobile-menu"><button onClick={() => setMobileMenu(false)} aria-label="Fechar menu"><X /></button><a href="#novidades" onClick={() => setMobileMenu(false)}>Novidades</a><a href="#loja" onClick={() => setMobileMenu(false)}>Loja</a><a href="#loja" onClick={() => {setActive("Kits");setMobileMenu(false)}}>Kits</a><a href="/gerencia">Gerência</a></div>}

    <section id="inicio" className="hero">
      <div className="hero-copy"><p className="eyebrow">CURADORIA MASCULINA • DROP 09</p><h1>Seu estilo<br/><em>fala primeiro.</em></h1><p className="hero-text">Peças que chegam com presença — do street ao essencial, escolhidas em Lavras para vestir o Brasil.</p><a className="primary-cta" href="#loja">Explorar o drop <ArrowRight /></a><div className="hero-proof"><strong>+1,9 mil</strong><span>seguem nosso estilo<br/>no Instagram</span></div></div>
      <div className="hero-visual"><span className="outline-word">DROP</span><img src="/products/bermuda-jeans-neon.png" alt="Bermuda jeans escura com cordões neon"/><div className="hero-tag"><span>01</span><p>Jeans com atitude<br/><strong>acabou de chegar</strong></p></div></div>
    </section>

    <section id="novidades" className="brand-strip"><span>PEÇAS QUE CHEGAM COM PRESENÇA</span><Sparkles/><span>ESTOQUE REAL • CURADORIA LOCAL</span><Sparkles/><span>LAVRAS / MG</span></section>
    <section id="loja" className="shop-section">
      <div className="section-heading"><div><p className="eyebrow">ESTOQUE SELECIONADO</p><h2>Escolha o seu corre.</h2></div><p>Filtre por categoria e encontre a peça certa sem perder tempo.</p></div>
      <div className="shop-toolbar"><div className="filters" role="group" aria-label="Filtrar produtos">{["Todos","Camisetas","Moletons","Bermudas","Tênis","Kits"].map((category)=><button key={category} className={active===category?"active":""} onClick={()=>setActive(category)}>{category}{category==="Kits"&&<sup>4</sup>}</button>)}</div><label className="sort-select">Ordenar<select value={sort} onChange={(event)=>setSort(event.target.value)}><option value="destaques">Destaques</option><option value="menor">Menor preço</option><option value="maior">Maior preço</option></select></label></div>
      <div className="result-count">{visible.length} {visible.length===1?"produto":"produtos"}</div>
      <div className="product-grid">{visible.map((product)=>{
        const imageIndex=imageIndexes[product.id]??0; const kit=product.category==="Kits";
        return <article className={`product-card ${kit?"kit-card":""}`} key={product.id}>
          <div className={`product-image ${kit?"multi-image":""}`}>{product.badge&&<span>{product.badge}</span>}<button className="wish-button" aria-label={`Favoritar ${product.name}`}><Heart/></button>{kit?product.images.map((image,index)=><img key={image} src={image} alt="" style={{zIndex:index+1}}/>):<img src={product.images[imageIndex]} alt={product.name}/>} {product.images.length>1&&!kit&&<div className="image-controls"><button onClick={()=>nextImage(product,-1)} aria-label="Imagem anterior"><ChevronLeft/></button><button onClick={()=>nextImage(product,1)} aria-label="Próxima imagem"><ChevronRight/></button></div>}</div>
          <div className="product-info"><div><p>{product.category}</p><h3>{product.name}</h3><span className="product-description">{product.description}</span><div className="price-line"><strong>{money(product.price)}</strong>{product.compareAt&&<del>{money(product.compareAt)}</del>}</div><select className="size-select" value={selectedSizes[product.id]||product.sizes[0]} onChange={(event)=>setSelectedSizes((current)=>({...current,[product.id]:event.target.value}))} aria-label={`Tamanho de ${product.name}`}>{product.sizes.map((size)=><option key={size}>{size}</option>)}</select></div><button onClick={()=>addToCart(product)} aria-label={`Adicionar ${product.name} à sacola`}><ShoppingBag/></button></div>
        </article>})}{visible.length===0&&<div className="empty-state"><Search/><strong>Nenhuma peça encontrada.</strong><button onClick={()=>{setQuery("");setActive("Todos")}}>Limpar busca</button></div>}</div>
    </section>

    <section className="service-grid"><article><Truck/><div><strong>Entrega nacional</strong><span>Frete calculado desde Lavras, MG</span></div></article><article><MapPin/><div><strong>Retirada grátis</strong><span>Reserve e busque na loja</span></div></article><article><ShieldCheck/><div><strong>Pedido protegido</strong><span>Dados validados no checkout</span></div></article></section>
    <footer id="rodape"><div><a className="brand footer-brand" href="#inicio"><span>Pode Pá</span><small>MULTIMARCAS</small></a><p>Sua mais nova opção em moda masculina.<br/>Lavras, Minas Gerais.</p></div><div><strong>Atendimento</strong><a href="https://wa.me/5535984649336" target="_blank" rel="noreferrer">WhatsApp</a><a href="https://www.instagram.com/loja_podepa/" target="_blank" rel="noreferrer">Instagram @loja_podepa</a></div><div><strong>Loja</strong><a href="#loja">Catálogo</a><a href="#loja" onClick={()=>setActive("Kits")}>Kits</a><a href="/gerencia">Área da gerência</a></div></footer>
    <div className="floating-social"><a href="https://wa.me/5535984649336" target="_blank" rel="noreferrer" aria-label="Falar no WhatsApp"><MessageCircle/><span>WhatsApp</span></a><a href="https://www.instagram.com/loja_podepa/" target="_blank" rel="noreferrer" aria-label="Abrir Instagram"><Camera/></a></div>

    {cartOpen&&<><button className="drawer-backdrop" onClick={()=>setCartOpen(false)} aria-label="Fechar sacola"/><aside className="cart-drawer" aria-label="Sacola de compras"><header><div><p>{checkout?"CHECKOUT":"SUA SELEÇÃO"}</p><h2>{checkout?"Finalizar pedido":"Sacola"}</h2></div><button onClick={()=>setCartOpen(false)} aria-label="Fechar"><X/></button></header>
      {orderId?<div className="order-success"><CheckCircle2/><h3>Pedido registrado.</h3><p>Seu código é <strong>{orderId}</strong>. Guarde-o para acompanhar com a loja.</p><a href={`https://wa.me/5535984649336?text=${encodeURIComponent(`Olá! Acabei de fazer o pedido ${orderId} no site.`)}`} target="_blank" rel="noreferrer">Avisar no WhatsApp <ArrowRight/></a><button onClick={()=>{setCartOpen(false);setOrderId("");setCheckout(false)}}>Continuar comprando</button></div> : checkout ? <form className="checkout-form" onSubmit={placeOrder}><button type="button" className="back-checkout" onClick={()=>setCheckout(false)}><ChevronLeft/> Voltar à sacola</button><div className="checkout-grid"><label>Nome completo<input name="name" required autoComplete="name"/></label><label>E-mail<input name="email" type="email" required autoComplete="email"/></label><label>Telefone<input name="phone" required inputMode="tel" placeholder="(35) 99999-9999"/></label><label>CPF<input name="cpf" required inputMode="numeric" placeholder="000.000.000-00"/></label><label>CEP<input name="cep" required inputMode="numeric" placeholder="00000-000" onChange={()=>setShipping(null)}/></label><label>UF<input name="state" required maxLength={2} placeholder="MG"/></label><label className="wide">Endereço completo<input name="address" required autoComplete="street-address" placeholder="Rua, número e complemento"/></label><label>Cidade<input name="city" required autoComplete="address-level2"/></label></div><fieldset><legend>Como você quer receber?</legend><label className={deliveryMethod==="delivery"?"selected":""}><input type="radio" checked={deliveryMethod==="delivery"} onChange={()=>setDeliveryMethod("delivery")}/><Truck/><span><strong>Entrega para todo o Brasil</strong><small>{shipping?`${money(shipping.fee)} • ${shipping.days}`:"Calcule pelo CEP"}</small></span></label><label className={deliveryMethod==="pickup"?"selected":""}><input type="radio" checked={deliveryMethod==="pickup"} onChange={()=>{setDeliveryMethod("pickup");setShipping(null)}}/><MapPin/><span><strong>Retirar na loja</strong><small>Grátis • Lavras, MG</small></span></label></fieldset>{deliveryMethod==="delivery"&&<button type="button" className="shipping-button" onClick={(event)=>{const form=event.currentTarget.form;if(form)void calculateShipping(String(new FormData(form).get("cep")??""))}}>{shippingLoading?"Calculando…":"Calcular frete pelo CEP"}</button>}{shippingError&&<p className="form-error">{shippingError}</p>}{orderError&&<p className="form-error">{orderError}</p>}<div className="checkout-total"><span>Total</span><strong>{money(total)}</strong></div><button className="checkout-submit" disabled={orderLoading}>{orderLoading?"Registrando pedido…":"Confirmar pedido"}<ArrowRight/></button><small className="privacy-note"><ShieldCheck/> Seus dados são usados somente para preparar e entregar este pedido.</small></form> : cart.length===0?<div className="empty-cart"><ShoppingBag/><h3>Sua sacola está vazia.</h3><p>Escolha uma peça do drop para começar.</p><button onClick={()=>setCartOpen(false)}>Ver produtos</button></div>:<div className="cart-content"><div className="cart-items">{cart.map((item,index)=>{const product=productById.get(item.productId)!;return <article key={`${item.productId}-${item.size}`}><img src={product.images[0]} alt=""/><div><p>{product.category}</p><h3>{product.name}</h3><span>Tamanho {item.size}</span><div className="quantity"><button onClick={()=>updateQuantity(index,-1)} aria-label="Diminuir"><Minus/></button><b>{item.quantity}</b><button onClick={()=>updateQuantity(index,1)} aria-label="Aumentar"><Plus/></button><button className="remove" onClick={()=>updateQuantity(index,-item.quantity)} aria-label="Remover"><Trash2/></button></div></div><strong>{money(product.price*item.quantity)}</strong></article>})}</div><div className="cart-summary"><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div><p>Frete calculado no checkout ou retirada grátis em Lavras.</p><button onClick={()=>setCheckout(true)}>Ir para o checkout <ArrowRight/></button></div></div>}
    </aside></>}
  </main>;
}
