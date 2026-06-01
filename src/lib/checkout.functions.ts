import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getCheckoutData = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) =>
    z.object({ slug: z.string().min(1).max(120) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: course }, { data: bump }, { data: settings }] = await Promise.all([
      supabaseAdmin.from("courses").select("id,slug,title,price,sale_price,short_description,thumbnail_url").eq("slug", data.slug).maybeSingle(),
      supabaseAdmin.from("bump_products").select("id,title,description,price,sale_price").eq("is_active", true).limit(1).maybeSingle(),
      supabaseAdmin.from("site_settings").select("sepay_bank,sepay_account_number,sepay_account_name").eq("id", 1).maybeSingle(),
    ]);
    if (!course) throw new Error("Khóa học không tồn tại");
    return { course, bump, settings };
  });

export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      courseSlug: z.string().min(1).max(120),
      includeBump: z.boolean().default(false),
      customerName: z.string().min(1).max(120),
      customerPhone: z.string().min(6).max(30),
      customerEmail: z.string().email().max(200),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: course, error: cErr } = await supabaseAdmin
      .from("courses").select("id,title,price,sale_price").eq("slug", data.courseSlug).maybeSingle();
    if (cErr || !course) throw new Error("Khóa học không tồn tại");

    type BumpRow = { id: string; title: string; price: number; sale_price: number | null };
    let bumpRow: BumpRow | null = null;
    if (data.includeBump) {
      const { data: b } = await supabaseAdmin
        .from("bump_products").select("id,title,price,sale_price").eq("is_active", true).limit(1).maybeSingle();
      if (b) bumpRow = b as BumpRow;
    }

    const coursePrice = Number(course.sale_price ?? course.price);
    const bumpPrice = bumpRow ? Number(bumpRow.sale_price ?? bumpRow.price) : 0;
    const total = coursePrice + bumpPrice;

    const { data: order, error: oErr } = await supabase.from("orders").insert({
      user_id: userId,
      course_id: course.id,
      bump_product_id: bumpRow?.id ?? null,
      total_amount: total,
      status: "pending",
      payment_method: "sepay",
      customer_name: data.customerName,
      customer_phone: data.customerPhone,
      customer_email: data.customerEmail,
    }).select("id").single();
    if (oErr || !order) throw new Error(oErr?.message || "Không tạo được đơn hàng");

    const items = [
      { order_id: order.id, product_type: "course", product_id: course.id, title: course.title, amount: coursePrice },
      ...(bumpRow ? [{ order_id: order.id, product_type: "bump", product_id: bumpRow.id, title: bumpRow.title, amount: bumpPrice }] : []),
    ];
    await supabaseAdmin.from("order_items").insert(items);

    return { orderId: order.id };
  });

export const getOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: order, error } = await supabase
      .from("orders")
      .select("id,total_amount,status,customer_name,customer_email,course_id,paid_at,created_at")
      .eq("id", data.id).maybeSingle();
    if (error || !order) throw new Error("Đơn hàng không tồn tại");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: items }, { data: settings }, { data: course }] = await Promise.all([
      supabaseAdmin.from("order_items").select("title,amount").eq("order_id", order.id),
      supabaseAdmin.from("site_settings").select("sepay_bank,sepay_account_number,sepay_account_name").eq("id", 1).maybeSingle(),
      order.course_id
        ? supabaseAdmin.from("courses").select("slug,title").eq("id", order.course_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    return { order, items: items ?? [], settings, course };
  });
