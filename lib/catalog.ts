export type CatalogProduct = {
  id: string;
  sku: string;
  name: string;
  category: "Camisetas" | "Moletons" | "Bermudas" | "Tênis" | "Kits";
  price: number;
  compareAt?: number;
  images: string[];
  colors?: Array<{ name: string; image: string }>;
  badge?: string;
  sizes: string[];
  initialStock: number;
  description: string;
  kitItems?: string[];
};

export const catalog: CatalogProduct[] = [
  { id:"camiseta-casa-blanca", sku:"CAM-CSB-VER", name:"Camiseta Casa Blanca", category:"Camisetas", price:119.9, images:["/products/camiseta-verde-frente.png","/products/camiseta-verde-costas-branco.png"], badge:"Destaque", sizes:["M","G","GG"], initialStock:14, description:"Modelagem oversized em verde profundo, estampa frontal minimal e arte clássica nas costas." },
  { id:"moletom-champion", sku:"MOL-CHP", name:"Moletom Champion", category:"Moletons", price:189.9, images:["/products/moletom-preto.png","/products/moletom-offwhite.png"], colors:[{name:"Preto",image:"/products/moletom-preto.png"},{name:"Off-white",image:"/products/moletom-offwhite.png"}], badge:"2 cores", sizes:["M","G","GG"], initialStock:13, description:"Moletom Champion de gola careca e punhos canelados, disponível nas cores preto e off-white." },
  { id:"bermuda-diesel-bege", sku:"BER-DSL-BG", name:"Bermuda Diesel Bege", category:"Bermudas", price:80, images:["/products/bermuda-diesel.png"], sizes:["M","G","GG"], initialStock:10, description:"Tecido leve, cintura elástica e lettering oversized em preto e off-white." },
  { id:"bermuda-jeans-neon", sku:"BER-JNS-NEO", name:"Bermuda Jeans Neon", category:"Bermudas", price:110, images:["/products/bermuda-jeans-neon.png"], badge:"Novo", sizes:["38","40","42","44"], initialStock:8, description:"Jeans destroyed escuro com acabamento de barra a fio e cordões neon." },
  { id:"tenis-plataforma-azul", sku:"TEN-PLT-AZ", name:"Tênis Plataforma Azul", category:"Tênis", price:219.9, images:["/products/tenis-azul.png"], badge:"Novo", sizes:["36","37","38","39","40"], initialStock:9, description:"Tênis low azul-claro com plataforma branca e acabamento monocromático." },
  { id:"tenis-plataforma-preto", sku:"TEN-PLT-PT", name:"Tênis Plataforma Preto", category:"Tênis", price:219.9, images:["/products/tenis-preto.png"], sizes:["36","37","38","39","40"], initialStock:11, description:"Clássico preto e branco com sola plataforma para elevar qualquer combinação." },
  { id:"kit-nike-blue-street", sku:"KIT-BLU-01", name:"Kit Blue Street", category:"Kits", price:389.9, compareAt:449.7, images:["/products/kit-01-blue-street-white.png"], badge:"Kit 01", sizes:["M / 38","G / 39","GG / 40"], initialStock:5, description:"Camiseta azul oversized, bermuda preta e tênis branco para um visual street completo." },
  { id:"kit-adidas-chocolate", sku:"KIT-CHO-02", name:"Kit Originals Chocolate", category:"Kits", price:419.9, compareAt:479.7, images:["/products/kit-02-originals-chocolate-white.png"], badge:"Kit 02", sizes:["M / 38","G / 39","GG / 40"], initialStock:4, description:"Camiseta chocolate, bermuda branca e tênis branco com contraste preto." },
  { id:"kit-air-sand", sku:"KIT-SND-03", name:"Kit Air Sand", category:"Kits", price:399.9, compareAt:459.7, images:["/products/kit-03-air-sand-white.png"], badge:"Kit 03", sizes:["M / 38","G / 40","GG / 42"], initialStock:4, description:"Camiseta areia, bermuda jeans preta destroyed e tênis branco com detalhe preto." },
  { id:"kit-air-blue", sku:"KIT-AIR-04", name:"Kit Air Blue", category:"Kits", price:429.9, compareAt:489.7, images:["/products/kit-04-air-blue-white.png"], badge:"Kit 04", sizes:["M / 38","G / 39","GG / 40"], initialStock:4, description:"Camiseta e bermuda pretas combinadas com tênis azul-claro para destacar o look." },
];

export const productById = new Map(catalog.map((product) => [product.id, product]));
