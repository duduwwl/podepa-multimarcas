"use client";

import { ArrowRight, Camera, CheckCircle2, ChevronLeft, ChevronRight, Hash, Heart, MapPin, Menu, MessageCircle, Minus, PackageCheck, Plus, Ruler, Search, ShieldCheck, ShoppingBag, Sparkles, Tag, Trash2, Truck, X, ZoomIn } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { catalog, CatalogProduct, productById } from "../lib/catalog";

type CartItem = { productId:string; size:string; quantity:number };
type ShippingQuote = { fee:number; days:string; destination:{ state:string; city:string; street:string; neighborhood:string } };

const money = (value:number) => value.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const heroProducts = [
  { name:"Camiseta Casa Blanca", front:"/products/camiseta-verde-frente.png", back:"/products/camiseta-verde-costas-transparent-v2.png" },
  { name:"Moletom Champion Preto", front:"/products/moletom-preto.png", back:"/products/moletom-preto.png" },
  { name:"Moletom Champion Off-white", front:"/products/moletom-offwhite.png", back:"/products/moletom-offwhite.png" },
  { name:"Bermuda Diesel Bege", front:"/products/bermuda-diesel.png", back:"/products/bermuda-diesel.png" },
  { name:"Bermuda Jeans Neon", front:"/products/bermuda-jeans-neon.png", back:"/products/bermuda-jeans-neon.png" },
];

export default function Storefront({ mode = "home" }: { mode?: "home" | "catalog" } = {}) {
  const [active,setActive] = useState("Todos");
  const [query,setQuery] = useState("");
  const [sort,setSort] = useState("destaques");
  const [cart,setCart] = useState<CartItem[]>([]);
  const [selectedSizes,setSelectedSizes] = useState<Record<string,string>>({});
  const [selectedColors,setSelectedColors] = useState<Record<string,string>>({});
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
  const [spinKey,setSpinKey] = useState(0);
  const [heroIndex,setHeroIndex] = useState(0);
  const [detailProduct,setDetailProduct] = useState<CatalogProduct|null>(null);
  const [detailImage,setDetailImage] = useState(0);

  const visible = useMemo(() => {
    let result = catalog.filter((product) => (active === "Todos" || product.category === active) && (!query || `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(query.toLowerCase())));
    if (sort === "menor") result = [...result].sort((a,b) => a.price-b.price);
    if (sort === "maior") result = [...result].sort((a,b) => b.price-a.price);
    return result;
  },[active,query,sort]);
  const cartCount = cart.reduce((sum,item) => sum+item.quantity,0);
  const subtotal = cart.reduce((sum,item) => sum+(productById.get(item.productId)?.price ?? 0)*item.quantity,0);
  const total = subtotal + (deliveryMethod === "delivery" ? shipping?.fee ?? 0 : 0);

  function addToCart(product:CatalogProduct,size?:string,color?:string) {
    const chosen = size || selectedSizes[product.id] || product.sizes[0];
    const chosenColor = color || selectedColors[product.id] || product.colors?.[0]?.name;
    const cartSize = chosenColor ? `${chosen} • ${chosenColor}` : chosen;
    setCart((current) => {
      const found = current.find((item) => item.productId === product.id && item.size === cartSize);
      return found ? current.map((item) => item === found ? {...item,quantity:Math.min(10,item.quantity+1)} : item) : [...current,{productId:product.id,size:cartSize,quantity:1}];
    });
    setCartOpen(true); setCheckout(false); setOrderId("");
  }
  function updateQuantity(index:number,delta:number) { setCart((current) => current.flatMap((item,i) => i !== index ? [item] : item.quantity+delta <= 0 ? [] : [{...item,quantity:Math.min(10,item.quantity+delta)}])); setShipping(null); }
  function nextImage(product:CatalogProduct,direction:number) {
    const next = ((imageIndexes[product.id]??0)+direction+product.images.length)%product.images.length;
    setImageIndexes((current) => ({...current,[product.id]:next}));
    if (product.colors?.[next]) setSelectedColors((current)=>({...current,[product.id]:product.colors![next].name}));
  }
  function openProduct(product:CatalogProduct) {
    const color = selectedColors[product.id] || product.colors?.[0]?.name;
    setDetailProduct(product);
    setDetailImage(color ? Math.max(0,product.colors?.findIndex((option)=>option.name===color)??0) : 0);
  }
  function setDetailVariant(product:CatalogProduct,index:number) {
    setDetailImage(index);
    if (product.colors?.[index]) setSelectedColors((current)=>({...current,[product.id]:product.colors![index].name}));
  }

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
      const address = deliveryMethod === "delivery" ? `${form.get("street")}, ${form.get("number")}${form.get("complement") ? ` — ${form.get("complement")}` : ""} — Bairro ${form.get("neighborhood")}` : "";
      const body = { name:form.get("name"), email:form.get("email"), phone:form.get("phone"), cpf:form.get("cpf"), cep:deliveryMethod === "delivery" ? form.get("cep") : "", address, city:deliveryMethod === "delivery" ? form.get("city") : "", state:deliveryMethod === "delivery" ? form.get("state") : "", deliveryMethod, items:cart };
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
      await context.registerTool({ name:"add_product_to_cart", title:"Adicionar produto à sacola", description:"Adiciona um produto disponível da Pode Pá à sacola visível, usando o primeiro tamanho e a primeira cor quando não forem informados.", inputSchema:{type:"object",properties:{productId:{type:"string"},size:{type:"string"},color:{type:"string"}},required:["productId"],additionalProperties:false}, annotations:{readOnlyHint:false,untrustedContentHint:false}, execute:(input:unknown) => { const value=input as {productId?:string;size?:string;color?:string}; const product=productById.get(value.productId??""); if(!product) throw new Error("Produto não encontrado"); if(value.size && !product.sizes.includes(value.size)) throw new Error("Tamanho indisponível"); if(value.color && !product.colors?.some((option)=>option.name===value.color)) throw new Error("Cor indisponível"); addToCart(product,value.size,value.color); return {productId:product.id,size:value.size||product.sizes[0],color:value.color||product.colors?.[0]?.name,status:"added"}; } },{signal:lifecycle.signal});
      await context.registerTool({ name:"start_checkout", title:"Iniciar checkout", description:"Abre o checkout da sacola atual sem concluir o pedido.", inputSchema:{type:"object",properties:{},additionalProperties:false}, annotations:{readOnlyHint:false,untrustedContentHint:false}, execute:() => { if(cart.length===0) throw new Error("A sacola está vazia"); setCartOpen(true); setCheckout(true); return {status:"checkout_opened",items:cartCount}; } },{signal:lifecycle.signal});
    };
    void register().catch(() => undefined);
    return () => lifecycle.abort();
  },[cart.length,cartCount]);

  useEffect(() => {
    if (mode !== "catalog") return;
    const category = new URLSearchParams(window.location.search).get("categoria");
    if (["Camisetas","Moletons","Bermudas","Tênis","Kits"].includes(category??"")) setActive(category!);
  },[mode]);

  useEffect(() => {
    if (mode !== "home") return;
    const timer = window.setInterval(() => { setHeroIndex((current)=>(current+1)%heroProducts.length); setSpinKey((current)=>current+1); },4800);
    return () => window.clearInterval(timer);
  },[mode]);

  useEffect(() => {
    if (!detailProduct) return;
    const close = (event:KeyboardEvent) => { if (event.key === "Escape") setDetailProduct(null); };
    window.addEventListener("keydown",close);
    return () => window.removeEventListener("keydown",close);
  },[detailProduct]);

  return <main>
    <header className="nav-shell">
      <button className="icon-button mobile-only" onClick={() => setMobileMenu(true)} aria-label="Abrir menu"><Menu /></button>
      <a className="brand" href="/" aria-label="Pode Pá Multimarcas, início"><span>Pode Pá</span><small>MULTIMARCAS</small><img className="brand-mark" src="/podepa-peace-mark.png" alt=""/></a>
      <nav aria-label="Navegação principal"><a href="/produtos">Produtos</a><a href="#rodape">Sobre nós</a></nav>
      <div className="nav-actions">
        {mode === "catalog" ? <label className={`nav-search ${query ? "open" : ""}`}><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar no estoque" aria-label="Buscar no estoque" /></label> : <a className="icon-button" href="/produtos" aria-label="Buscar produtos"><Search /></a>}
        <button className="cart-button" onClick={() => setCartOpen(true)} aria-label={`Sacola com ${cartCount} itens`}><ShoppingBag /><span>{cartCount}</span></button>
      </div>
    </header>
    {mobileMenu && <div className="mobile-menu"><button onClick={() => setMobileMenu(false)} aria-label="Fechar menu"><X /></button><a href="/">Início</a><a href="/produtos">Produtos</a><a href="#rodape" onClick={()=>setMobileMenu(false)}>Sobre nós</a></div>}

    {mode === "home" ? <>
      <section id="inicio" className="hero">
        <div className="hero-copy"><p className="eyebrow">MODA MASCULINA • LAVRAS, MG</p><h1>Seu estilo<br/><em>fala primeiro.</em></h1><p className="hero-text">Vista sua identidade. Uma seleção de peças marcantes para quem não passa despercebido.</p><a className="primary-cta" href="/produtos">Explorar os produtos <span className="cta-arrow"><ArrowRight /></span></a></div>
        <div className="hero-visual"><span className="outline-word">PODE PÁ</span><button key={`${heroIndex}-${spinKey}`} className="shirt-spinner" onClick={()=>setSpinKey((current)=>current+1)} aria-label={`Girar ${heroProducts[heroIndex].name} em 360 graus`}><img className="shirt-front" src={heroProducts[heroIndex].front} alt={heroProducts[heroIndex].name}/><img className="shirt-back" src={heroProducts[heroIndex].back} alt={`Parte de trás de ${heroProducts[heroIndex].name}`}/></button><div className="hero-carousel-controls"><button onClick={()=>{setHeroIndex((heroIndex-1+heroProducts.length)%heroProducts.length);setSpinKey((current)=>current+1)}} aria-label="Peça anterior"><ChevronLeft/></button><div>{heroProducts.map((product,index)=><button key={product.name} className={heroIndex===index?"active":""} onClick={()=>{setHeroIndex(index);setSpinKey((current)=>current+1)}} aria-label={`Mostrar ${product.name}`}/>)}</div><button onClick={()=>{setHeroIndex((heroIndex+1)%heroProducts.length);setSpinKey((current)=>current+1)}} aria-label="Próxima peça"><ChevronRight/></button></div><span className="spin-hint">Clique para girar</span></div>
      </section>
      <section className="brand-strip"><span>PODE PÁ APRESENTA</span><Sparkles/><span>ESCOLHAS QUE FOGEM DO ÓBVIO</span><Sparkles/><span>DE LAVRAS PARA O SEU ESTILO</span></section>
      <section className="home-showcase">
        <div className="home-showcase-heading"><div><p className="eyebrow">ESCOLHA O SEU CORRE</p><h2>Um drop para cada momento.</h2></div><a href="/produtos">Ver catálogo <ArrowRight/></a></div>
        <div className="home-showcase-grid">
          <a href="/produtos?categoria=Camisetas"><span>01</span><img src="/products/camiseta-verde-frente.png" alt="Camiseta verde Casa Blanca"/><div><small>Camisetas</small><strong>Presença em cada detalhe</strong><ArrowRight/></div></a>
          <a href="/produtos?categoria=Moletons"><span>02</span><img src="/products/moletom-preto.png" alt="Moletom Champion preto"/><div><small>Moletons</small><strong>Conforto com assinatura</strong><ArrowRight/></div></a>
          <a href="/produtos?categoria=Bermudas"><span>03</span><img src="/products/bermuda-jeans-neon.png" alt="Bermuda jeans com cordões neon"/><div><small>Bermudas</small><strong>Do básico ao marcante</strong><ArrowRight/></div></a>
        </div>
      </section>
    </> : <section id="loja" className="shop-section catalog-page">
        <div className="section-heading"><div><p className="eyebrow">ESTOQUE SELECIONADO</p><h2>Encontre a peça que combina com você.</h2></div><p>Escolha uma categoria e descubra o que faz sentido para o seu estilo.</p></div>
        <div className="shop-toolbar"><div className="filters" role="group" aria-label="Filtrar produtos">{["Todos","Camisetas","Moletons","Bermudas","Tênis","Kits"].map((category)=><button key={category} className={active===category?"active":""} onClick={()=>setActive(category)}>{category}{category==="Kits"&&<sup>{catalog.filter((product)=>product.category==="Kits").length}</sup>}</button>)}</div><label className="sort-select">Ordenar<select value={sort} onChange={(event)=>setSort(event.target.value)}><option value="destaques">Destaques</option><option value="menor">Menor preço</option><option value="maior">Maior preço</option></select></label></div>
        <div className="result-count">{visible.length} {visible.length===1?"produto":"produtos"}</div>
        <div className="product-grid">{visible.map((product)=>{
          const imageIndex=imageIndexes[product.id]??0; const kit=product.category==="Kits"; const collage=kit&&product.images.length>1;
          return <article className={`product-card ${kit?"kit-card":""}`} key={product.id}>
            <div className={`product-image ${collage?"multi-image":""} ${product.id==="camiseta-casa-blanca"||kit?"white-backdrop":""}`} role="button" tabIndex={0} onClick={()=>openProduct(product)} onKeyDown={(event)=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();openProduct(product)}}} aria-label={`Ver detalhes de ${product.name}`}>{product.badge&&<span>{product.badge}</span>}<button className="wish-button" onClick={(event)=>event.stopPropagation()} aria-label={`Favoritar ${product.name}`}><Heart/></button>{collage?product.images.map((image,index)=><img key={image} src={image} alt="" style={{zIndex:index+1}}/>):<img src={product.images[imageIndex]} alt={product.name}/>} {product.images.length>1&&!kit&&<div className="image-controls"><button onClick={(event)=>{event.stopPropagation();nextImage(product,-1)}} aria-label="Imagem anterior"><ChevronLeft/></button><button onClick={(event)=>{event.stopPropagation();nextImage(product,1)}} aria-label="Próxima imagem"><ChevronRight/></button></div>}<div className="view-product"><ZoomIn/> Ver detalhes</div></div>
            <div className="product-info"><div><p>{product.category}</p><h3><button className="product-title-button" onClick={()=>openProduct(product)}>{product.name}</button></h3><span className="product-description">{product.description}</span><div className="price-line"><strong>{money(product.price)}</strong>{product.compareAt&&<del>{money(product.compareAt)}</del>}</div><div className="product-options">{product.colors&&<label>Cor<select className="color-select" value={selectedColors[product.id]||product.colors[0].name} onChange={(event)=>{const color=event.target.value;setSelectedColors((current)=>({...current,[product.id]:color}));setImageIndexes((current)=>({...current,[product.id]:product.colors!.findIndex((option)=>option.name===color)}))}} aria-label={`Cor de ${product.name}`}>{product.colors.map((option)=><option key={option.name}>{option.name}</option>)}</select></label>}<label>Tamanho<select className="size-select" value={selectedSizes[product.id]||product.sizes[0]} onChange={(event)=>setSelectedSizes((current)=>({...current,[product.id]:event.target.value}))} aria-label={`Tamanho de ${product.name}`}>{product.sizes.map((size)=><option key={size}>{size}</option>)}</select></label></div></div><button onClick={()=>addToCart(product)} aria-label={`Adicionar ${product.name} à sacola`}><ShoppingBag/></button></div>
          </article>})}{visible.length===0&&<div className="empty-state"><Search/><strong>Nenhuma peça encontrada.</strong><button onClick={()=>{setQuery("");setActive("Todos")}}>Limpar busca</button></div>}</div>
      </section>}

    <section className="service-grid"><article><Truck/><div><strong>Entrega nacional</strong><span>Frete calculado desde Lavras, MG</span></div></article><article><MapPin/><div><strong>Retirada grátis</strong><span>Reserve e busque na loja</span></div></article><article><ShieldCheck/><div><strong>Pedido protegido</strong><span>Dados validados no checkout</span></div></article></section>
    <footer id="rodape"><div><a className="brand footer-brand" href="/"><span>Pode Pá</span><small>MULTIMARCAS</small></a><p>Curadoria masculina sem cópia: peças escolhidas para quem veste atitude todos os dias.<br/>De Lavras para o Brasil.</p></div><div><strong>Atendimento</strong><a href="https://wa.me/5535984649336" target="_blank" rel="noreferrer">WhatsApp</a><a href="https://www.instagram.com/loja_podepa/" target="_blank" rel="noreferrer">Instagram @loja_podepa</a></div><div><strong>Loja</strong><a href="/produtos">Produtos</a><a href="/produtos?categoria=Kits">Kits</a><a href="/gerencia">Área da gerência</a></div></footer>
    <div className="floating-social"><a href="https://wa.me/5535984649336" target="_blank" rel="noreferrer" aria-label="Falar no WhatsApp"><MessageCircle/><span>WhatsApp</span></a><a href="https://www.instagram.com/loja_podepa/" target="_blank" rel="noreferrer" aria-label="Abrir Instagram"><Camera/></a></div>

    {detailProduct&&<>
      <button className="product-modal-backdrop" onClick={()=>setDetailProduct(null)} aria-label="Fechar detalhes do produto"/>
      <section className="product-modal" role="dialog" aria-modal="true" aria-labelledby="product-detail-title">
        <button className="product-modal-close" onClick={()=>setDetailProduct(null)} aria-label="Fechar"><X/></button>
        <div className={`product-modal-gallery ${detailProduct.id==="camiseta-casa-blanca"||detailProduct.category==="Kits"?"white-backdrop":""}`}>
          <img src={detailProduct.images[detailImage]} alt={`${detailProduct.name}, imagem ${detailImage+1}`}/>
          {detailProduct.images.length>1&&<>
            <button className="modal-prev" onClick={()=>setDetailVariant(detailProduct,(detailImage-1+detailProduct.images.length)%detailProduct.images.length)} aria-label="Imagem anterior"><ChevronLeft/></button>
            <button className="modal-next" onClick={()=>setDetailVariant(detailProduct,(detailImage+1)%detailProduct.images.length)} aria-label="Próxima imagem"><ChevronRight/></button>
            <div className="modal-thumbs">{detailProduct.images.map((image,index)=><button key={image} className={detailImage===index?"active":""} onClick={()=>setDetailVariant(detailProduct,index)} aria-label={`Ver imagem ${index+1}`}><img src={image} alt=""/></button>)}</div>
          </>}
        </div>
        <div className="product-modal-copy">
          <p className="eyebrow">{detailProduct.category} • {detailProduct.badge||"ESTOQUE DISPONÍVEL"}</p>
          <h2 id="product-detail-title">{detailProduct.name}</h2>
          <div className="modal-price"><strong>{money(detailProduct.price)}</strong>{detailProduct.compareAt&&<del>{money(detailProduct.compareAt)}</del>}</div>
          <p className="modal-description">{detailProduct.description}</p>
          <div className="spec-grid"><span><Tag/><small>Código</small><strong>{detailProduct.sku}</strong></span><span><Ruler/><small>Tamanhos</small><strong>{detailProduct.sizes.join(" • ")}</strong></span><span><PackageCheck/><small>Disponibilidade</small><strong>{detailProduct.initialStock} unidades</strong></span><span><Truck/><small>Envio</small><strong>Todo o Brasil</strong></span></div>
          {detailProduct.colors&&<label className="modal-size">Escolha a cor<select value={selectedColors[detailProduct.id]||detailProduct.colors[0].name} onChange={(event)=>{const index=detailProduct.colors!.findIndex((option)=>option.name===event.target.value);setDetailVariant(detailProduct,index)}}>{detailProduct.colors.map((option)=><option key={option.name}>{option.name}</option>)}</select></label>}
          <label className="modal-size">Escolha o tamanho<select value={selectedSizes[detailProduct.id]||detailProduct.sizes[0]} onChange={(event)=>setSelectedSizes((current)=>({...current,[detailProduct.id]:event.target.value}))}>{detailProduct.sizes.map((size)=><option key={size}>{size}</option>)}</select></label>
          <button className="modal-add" onClick={()=>{addToCart(detailProduct);setDetailProduct(null)}}>Adicionar à sacola <ShoppingBag/></button>
          <small className="modal-note"><MapPin/> Retirada grátis em Lavras ou entrega calculada pelo CEP.</small>
        </div>
      </section>
    </>}

    {cartOpen&&<><button className="drawer-backdrop" onClick={()=>setCartOpen(false)} aria-label="Fechar sacola"/><aside className="cart-drawer" aria-label="Sacola de compras"><header><div><p>{checkout?"CHECKOUT":"SUA SELEÇÃO"}</p><h2>{checkout?"Finalizar pedido":"Sacola"}</h2></div><button onClick={()=>setCartOpen(false)} aria-label="Fechar"><X/></button></header>
      {orderId?<div className="order-success"><CheckCircle2/><h3>Pedido registrado.</h3><p>Seu código é <strong>{orderId}</strong>. Guarde-o para acompanhar com a loja.</p><a href={`https://wa.me/5535984649336?text=${encodeURIComponent(`Olá! Acabei de fazer o pedido ${orderId} no site.`)}`} target="_blank" rel="noreferrer">Avisar no WhatsApp <ArrowRight/></a><button onClick={()=>{setCartOpen(false);setOrderId("");setCheckout(false)}}>Continuar comprando</button></div> : checkout ? <form className="checkout-form" onSubmit={placeOrder}><button type="button" className="back-checkout" onClick={()=>setCheckout(false)}><ChevronLeft/> Voltar à sacola</button><section className="checkout-block"><h3>Seus dados</h3><div className="checkout-grid"><label>Nome completo<input name="name" required autoComplete="name"/></label><label>E-mail<input name="email" type="email" required autoComplete="email"/></label><label>Telefone<input name="phone" required inputMode="tel" minLength={10} placeholder="(35) 99999-9999"/></label><label>CPF<input name="cpf" required inputMode="numeric" minLength={11} placeholder="000.000.000-00"/></label></div></section><fieldset><legend>Como você quer receber?</legend><label className={deliveryMethod==="delivery"?"selected":""}><input type="radio" name="delivery-choice" checked={deliveryMethod==="delivery"} onChange={()=>setDeliveryMethod("delivery")}/><Truck/><span><strong>Entrega para todo o Brasil</strong><small>{shipping?`${money(shipping.fee)} • ${shipping.days}`:"Frete calculado pelo CEP"}</small></span></label><label className={deliveryMethod==="pickup"?"selected":""}><input type="radio" name="delivery-choice" checked={deliveryMethod==="pickup"} onChange={()=>{setDeliveryMethod("pickup");setShipping(null);setShippingError("")}}/><MapPin/><span><strong>Retirar na loja</strong><small>Grátis • Lavras, MG</small></span></label></fieldset>{deliveryMethod==="delivery"&&<section className="checkout-block delivery-address"><h3>Endereço de entrega</h3><div className="checkout-grid"><label>CEP<input name="cep" required inputMode="numeric" minLength={8} placeholder="00000-000" onChange={()=>setShipping(null)}/></label><label>UF<input name="state" required maxLength={2} placeholder="MG" autoComplete="address-level1"/></label><label className="wide">Rua ou avenida<input name="street" required autoComplete="address-line1" placeholder="Nome da rua"/></label><label className="number-field">Número<div><Hash/><input name="number" required inputMode="numeric" placeholder="123" autoComplete="address-line2"/></div></label><label>Complemento<input name="complement" placeholder="Apto, bloco ou referência"/></label><label>Bairro<input name="neighborhood" required autoComplete="address-level3"/></label><label>Cidade<input name="city" required autoComplete="address-level2"/></label></div><button type="button" className="shipping-button" onClick={(event)=>{const form=event.currentTarget.form;if(form)void calculateShipping(String(new FormData(form).get("cep")??""))}}>{shippingLoading?"Calculando…":"Calcular frete pelo CEP"}</button></section>}{shippingError&&<p className="form-error">{shippingError}</p>}{orderError&&<p className="form-error">{orderError}</p>}<section className="checkout-review"><h3>Resumo do pedido</h3>{cart.map((item)=>{const product=productById.get(item.productId)!;return <div key={`${item.productId}-${item.size}`}><span>{item.quantity}× {product.name} <small>• {item.size}</small></span><strong>{money(product.price*item.quantity)}</strong></div>})}<div><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div><span>{deliveryMethod==="pickup"?"Retirada na loja":"Frete"}</span><strong>{deliveryMethod==="pickup"?"Grátis":shipping?money(shipping.fee):"A calcular"}</strong></div></section><div className="checkout-total"><span>Total</span><strong>{money(total)}</strong></div><p className="payment-note"><ShieldCheck/> Após confirmar, a loja entra em contato para combinar o pagamento com segurança.</p><button className="checkout-submit" disabled={orderLoading}>{orderLoading?"Registrando pedido…":"Confirmar pedido"}<ArrowRight/></button><small className="privacy-note"><ShieldCheck/> Seus dados são usados somente para preparar e entregar este pedido.</small></form> : cart.length===0?<div className="empty-cart"><ShoppingBag/><h3>Sua sacola está vazia.</h3><p>Escolha uma peça do drop para começar.</p><button onClick={()=>setCartOpen(false)}>Ver produtos</button></div>:<div className="cart-content"><div className="cart-items">{cart.map((item,index)=>{const product=productById.get(item.productId)!;return <article key={`${item.productId}-${item.size}`}><img src={product.images[0]} alt=""/><div><p>{product.category}</p><h3>{product.name}</h3><span>Tamanho {item.size}</span><div className="quantity"><button onClick={()=>updateQuantity(index,-1)} aria-label="Diminuir"><Minus/></button><b>{item.quantity}</b><button onClick={()=>updateQuantity(index,1)} aria-label="Aumentar"><Plus/></button><button className="remove" onClick={()=>updateQuantity(index,-item.quantity)} aria-label="Remover"><Trash2/></button></div></div><strong>{money(product.price*item.quantity)}</strong></article>})}</div><div className="cart-summary"><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div><p>Frete calculado no checkout ou retirada grátis em Lavras.</p><button onClick={()=>setCheckout(true)}>Ir para o checkout <ArrowRight/></button></div></div>}
    </aside></>}
  </main>;
}
