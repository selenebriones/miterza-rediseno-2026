import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ADMIN_NAV, hasPermission } from "@/lib/admin/permissions";
import { getAdminUser } from "@/lib/admin/session";

export default function AdminHome() {
  return (
    <Suspense fallback={null}>
      <AdminRedirect />
    </Suspense>
  );
}

async function AdminRedirect() {
  const user = await getAdminUser();
  if (!user) return redirect("/admin/login");
  const firstModule = ADMIN_NAV.find((item) => item.ready && hasPermission(user.permissions, item.permission));
  return redirect(firstModule?.href ?? "/admin/sin-acceso");
}
