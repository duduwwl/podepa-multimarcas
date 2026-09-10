import React from "react";
import { createRoot } from "react-dom/client";
import Storefront from "../app/page";
import AdminDashboard from "../app/gerencia/admin-dashboard";
import "../app/globals.css";

const path = window.location.pathname.replace(/\/+$/, "");
const page = path.endsWith("/gerencia")
  ? <AdminDashboard managerName="Gerência" />
  : <Storefront mode={path.endsWith("/produtos") ? "catalog" : "home"} />;

createRoot(document.getElementById("root")!).render(page);
