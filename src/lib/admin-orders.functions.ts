import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertAdmin } from "./admin-guard";

export const listOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const [{ data: orders, error }, { data: courses }] = await Promise.all([
      supabaseAdmin.from("orders").select("*").order("created_at", { ascending: false }).limit(500),
      supabaseAdmin.from("courses").select("id, title"),
    ]);
    if (error) throw new Error(error.message);

    const courseMap = new Map((courses ?? []).map((c) => [c.id, c.title]));
    const enriched = (orders ?? []).map((o) => ({
      ...o,
      course_title: o.course_id ? courseMap.get(o.course_id) ?? "—" : "—",
    }));

    const completed = enriched.filter((o) => o.status === "completed");
    const totalRevenue = completed.reduce((sum, o) => sum + Number(o.total_amount ?? 0), 0);

    return {
      orders: enriched,
      stats: {
        total: enriched.length,
        pending: enriched.filter((o) => o.status === "pending").length,
        completed: completed.length,
        revenue: totalRevenue,
      },
    };
  });

export const setOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["pending", "completed", "cancelled"]),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const patch = data.status === "completed"
      ? { status: data.status, paid_at: new Date().toISOString() }
      : { status: data.status };
    const { error } = await supabaseAdmin.from("orders").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
