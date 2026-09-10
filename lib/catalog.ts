export type CatalogProduct = {
  id: string;
  sku: string;
  name: string;
  category: "Camisetas" | "Moletons" | "Bermudas" | "Tênis" | "Kits";
  price: number;
  compareAt?: number;
  images: string[];
  badge?: string;
  sizes: string[];
  initialStock: number;
  description: string;
  kitItems?: string[];
};

export const catalog: CatalogProduct[] = [
  { id:"camiseta-casa-blanca", sku:"CAM-CSB-VER", name:"Camiseta Casa Blanca", category:"Camisetas", price:119.9, images:["/products/camiseta-verde-frente.png","/products/camiseta-verde-costas.png"], badge:"Destaque", sizes:["M","G","GG"], initialStock:14, description:"Modelagem oversized em verde profundo, estampa frontal minimal e arte clássica nas costas." },
  { id:"moletom-champion-preto", sku:"MOL-CHP-PT", name:"Moletom Champion Preto", category:"Moletons", price:189.9, images:["/products/moletom-preto.png"], badge:"Últimas peças", sizes:["M","G","GG"], initialStock:6, description:"Moletom preto de gola careca, punhos canelados e assinatura na manga." },
  { id:"moletom-champion-offwhite", sku:"MOL-CHP-OW", name:"Moletom Champion Off-white", category:"Moletons", price:189.9, images:["/products/moletom-offwhite.png"], sizes:["M","G","GG"], initialStock:7, description:"Base off-white com contraste azul e vermelho para um visual limpo e marcante." },
  { id:"bermuda-diesel-bege", sku:"BER-DSL-BG", name:"Bermuda Diesel Bege", category:"Bermudas", price:139.9, images:["/products/bermuda-diesel.png"], sizes:["M","G","GG"], initialStock:10, description:"Tecido leve, cintura elástica e lettering oversized em preto e off-white." },
  { id:"tenis-plataforma-azul", sku:"TEN-PLT-AZ", name:"Tênis Plataforma Azul", category:"Tênis", price:219.9, images:["/products/tenis-azul.png"], badge:"Novo", sizes:["36","37","38","39","40"], initialStock:9, description:"Tênis low azul-claro com plataforma branca e acabamento monocromático." },
  { id:"tenis-plataforma-preto", sku:"TEN-PLT-PT", name:"Tênis Plataforma Preto", category:"Tênis", price:219.9, images:["/products/tenis-preto.png"], sizes:["36","37","38","39","40"], initialStock:11, description:"Clássico preto e branco com sola plataforma para elevar qualquer combinação." },
  { id:"kit-sneaker-match", sku:"KIT-TEN-03", name:"Kit Sneaker Match", category:"Kits", price:399.9, compareAt:439.8, images:["/products/tenis-azul.png","/products/tenis-preto.png"], badge:"Kit 03", sizes:["36","37","38","39","40"], initialStock:4, description:"Dois tênis plataforma para alternar entre azul e preto.", kitItems:["tenis-plataforma-azul","tenis-plataforma-preto"] },
  { id:"bermuda-jeans-neon", sku:"BER-JNS-NEO", name:"Bermuda Jeans Neon", category:"Bermudas", price:149.9, images:["/products/bermuda-jeans-neon.png"], badge:"Novo", sizes:["38","40","42","44"], initialStock:8, description:"Jeans destroyed escuro com acabamento de barra a fio e cordões neon." },
];

export const productById = new Map(catalog.map((product) => [product.id, product]));
