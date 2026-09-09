import { requireChatGPTUser } from "../chatgpt-auth";
import AdminDashboard from "./admin-dashboard";

export const dynamic = "force-dynamic";

export default async function GerenciaPage() {
  const user = await requireChatGPTUser("/gerencia");
  return <AdminDashboard managerName={user.displayName} />;
}
