import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { loading, isAdmin, roles, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && roles.length > 0 && !isAdmin) {
      navigate({ to: "/my-courses", replace: true });
    }
  }, [loading, user, roles, isAdmin, navigate]);

  if (loading || roles.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        Đang kiểm tra quyền truy cập…
      </div>
    );
  }
  if (!isAdmin) return null;
  return <Outlet />;
}
