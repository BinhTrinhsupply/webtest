import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertAdmin } from "./admin-guard";

export const listSepayLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await supabaseAdmin
      .from("sepay_webhook_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return { logs: data ?? [] };
  });

export const approveSepayLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      log_id: z.string().uuid(),
      order_id: z.string().uuid(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);

    // Mark order completed
    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .select("id,status")
      .eq("id", data.order_id)
      .single();
    if (oErr) throw new Error(oErr.message);
    if (!order) throw new Error("Đơn hàng không tồn tại");

    const { error: uErr } = await supabaseAdmin
      .from("orders")
      .update({ status: "completed", paid_at: new Date().toISOString() })
      .eq("id", data.order_id);
    if (uErr) throw new Error(uErr.message);

    const { error: lErr } = await supabaseAdmin
      .from("sepay_webhook_logs")
      .update({
        status: "approved",
        order_id: data.order_id,
        approved_by: context.userId,
        approved_at: new Date().toISOString(),
      })
      .eq("id", data.log_id);
    if (lErr) throw new Error(lErr.message);

    return { ok: true };
  });

export const listPendingOrdersBrief = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("id, customer_name, customer_email, total_amount, course_id, status, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { orders: data ?? [] };
  });
