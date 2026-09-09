export const STORE_ORIGIN = "Lavras, MG • CEP 37200-000";

export function shippingForState(state: string, itemCount: number) {
  const uf = state.toUpperCase();
  const base = uf === "MG" ? 18.9 : ["SP","RJ","ES"].includes(uf) ? 24.9 : ["PR","SC","RS","GO","DF","MT","MS"].includes(uf) ? 31.9 : ["BA","SE","AL","PE","PB","RN","CE","PI","MA"].includes(uf) ? 39.9 : 48.9;
  const days = uf === "MG" ? "2 a 4 dias úteis" : ["SP","RJ","ES"].includes(uf) ? "3 a 6 dias úteis" : ["PR","SC","RS","GO","DF","MT","MS"].includes(uf) ? "5 a 8 dias úteis" : "7 a 12 dias úteis";
  return { fee: Number((base + Math.max(0, itemCount - 1) * 4.5).toFixed(2)), days };
}
