import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// SePay webhook payload (https://docs.sepay.vn/tich-hop-webhooks)
// Posts JSON with fields: id, transferType ('in'/'out'), transferAmount, content, referenceCode, ...
// Authorization header configured by user: "Apikey <secret>"
export const Route = createFileRoute("/api/public/sepay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization") || "";
        const provided = auth.replace(/^Apikey\s+/i, "").replace(/^Bearer\s+/i, "").trim();

        const { data: settings } = await supabaseAdmin
          .from("site_settings").select("sepay_webhook_secret").eq("id", 1).maybeSingle();
        const expected = settings?.sepay_webhook_secret?.trim();
        if (!expected || !provided || provided !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        let payload: Record<string, unknown>;
        try { payload = await request.json(); }
        catch { return new Response("Invalid JSON", { status: 400 }); }

        const transferType = String(payload.transferType ?? "");
        const amount = Number(payload.transferAmount ?? payload.amount ?? 0);
        const content = String(payload.content ?? payload.description ?? "");
        const ref = String(payload.referenceCode ?? payload.id ?? "");

        // Always log the webhook event for admin audit / manual approval.
        const logBase = { ref, amount, content, payload: payload as never };


        if (transferType && transferType !== "in") {
          await supabaseAdmin.from("sepay_webhook_logs").insert({ ...logBase, status: "ignored", reason: "not incoming" });
          return Response.json({ ignored: true, reason: "not incoming" });
        }

        const match = content.match(/DH([0-9a-fA-F]{8,})/);
        if (!match) {
          await supabaseAdmin.from("sepay_webhook_logs").insert({ ...logBase, status: "pending", reason: "no order ref in content" });
          return Response.json({ logged: true, reason: "no order ref in content", content });
        }
        const shortId = match[1].toLowerCase();

        const { data: orders, error } = await supabaseAdmin
          .from("orders")
          .select("id,total_amount,status")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(50);
        if (error) {
          await supabaseAdmin.from("sepay_webhook_logs").insert({ ...logBase, status: "failed", reason: error.message });
          return new Response(error.message, { status: 500 });
        }

        const order = (orders ?? []).find((o) => o.id.replace(/-/g, "").toLowerCase().startsWith(shortId));
        if (!order) {
          await supabaseAdmin.from("sepay_webhook_logs").insert({ ...logBase, status: "pending", reason: "order not found" });
          return Response.json({ logged: true, reason: "order not found", shortId });
        }
        if (amount && amount < Number(order.total_amount)) {
          await supabaseAdmin.from("sepay_webhook_logs").insert({ ...logBase, status: "pending", reason: "amount mismatch", order_id: order.id });
          return Response.json({ logged: true, reason: "amount mismatch", amount, expected: order.total_amount });
        }

        const { error: uErr } = await supabaseAdmin
          .from("orders")
          .update({ status: "completed", paid_at: new Date().toISOString(), sepay_ref: ref })
          .eq("id", order.id);
        if (uErr) {
          await supabaseAdmin.from("sepay_webhook_logs").insert({ ...logBase, status: "failed", reason: uErr.message, order_id: order.id });
          return new Response(uErr.message, { status: 500 });
        }

        await supabaseAdmin.from("sepay_webhook_logs").insert({
          ...logBase, status: "matched", order_id: order.id, matched_at: new Date().toISOString(),
        });
        return Response.json({ ok: true, orderId: order.id });
      },
      GET: async () => Response.json({ ok: true, endpoint: "sepay-webhook" }),
    },
  },
});
