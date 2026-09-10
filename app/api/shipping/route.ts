import { shippingForState, STORE_ORIGIN } from "../../../lib/shipping";
import { corsPreflight, jsonWithCors } from "../../../lib/cors";

function stateFromCep(cep:string) {
  const value = Number(cep);
  const ranges:[number,number,string][] = [[1000000,19999999,"SP"],[20000000,28999999,"RJ"],[29000000,29999999,"ES"],[30000000,39999999,"MG"],[40000000,48999999,"BA"],[49000000,49999999,"SE"],[50000000,56999999,"PE"],[57000000,57999999,"AL"],[58000000,58999999,"PB"],[59000000,59999999,"RN"],[60000000,63999999,"CE"],[64000000,64999999,"PI"],[65000000,65999999,"MA"],[66000000,68899999,"PA"],[68900000,68999999,"AP"],[69000000,69299999,"AM"],[69300000,69399999,"RR"],[69400000,69899999,"AM"],[69900000,69999999,"AC"],[70000000,72799999,"DF"],[72800000,72999999,"GO"],[73000000,73699999,"DF"],[73700000,76799999,"GO"],[76800000,76999999,"RO"],[77000000,77999999,"TO"],[78000000,78899999,"MT"],[79000000,79999999,"MS"],[80000000,87999999,"PR"],[88000000,89999999,"SC"],[90000000,99999999,"RS"]];
  return ranges.find(([min,max]) => value>=min && value<=max)?.[2] ?? null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const cep = (url.searchParams.get("cep") ?? "").replace(/\D/g, "");
  const items = Math.max(1, Number(url.searchParams.get("items") ?? 1));
  if (cep.length !== 8) return jsonWithCors(request,{ error:"Informe um CEP válido com 8 números." },{ status:400 });

  try {
    let address: { state?: string; city?: string; street?: string; neighborhood?: string } | null = null;
    const primary = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`, { cache:"no-store" });
    if (primary.ok) address = await primary.json();
    if (!address?.state) {
      const fallback = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { cache:"no-store" });
      if (fallback.ok) {
        const data = await fallback.json() as { erro?: boolean; uf?: string; localidade?: string; logradouro?: string; bairro?: string };
        if (!data.erro) address = { state:data.uf, city:data.localidade, street:data.logradouro, neighborhood:data.bairro };
      }
    }
    if (!address?.state) address = { state:stateFromCep(cep) ?? undefined };
    if (!address.state) throw new Error("CEP não localizado");
    const quote = shippingForState(address.state, items);
    return jsonWithCors(request,{ ...quote, origin:STORE_ORIGIN, destination:{ cep, state:address.state, city:address.city ?? "", street:address.street ?? "", neighborhood:address.neighborhood ?? "" } });
  } catch {
    return jsonWithCors(request,{ error:"Não conseguimos calcular agora. Confira o CEP e tente novamente." },{ status:502 });
  }
}

export function OPTIONS(request:Request) {
  return corsPreflight(request);
}
