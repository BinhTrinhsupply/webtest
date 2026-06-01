import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertAdmin } from "./admin-guard";

export const listStudents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    // Use admin client to bypass RLS for full listing + role join
    const [{ data: profiles, error: pErr }, { data: roles }, { data: orders }] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin.from("orders").select("user_id, course_id, status").eq("status", "completed"),
    ]);
    if (pErr) throw new Error(pErr.message);

    const rolesByUser = new Map<string, string[]>();
    for (const r of roles ?? []) {
      const list = rolesByUser.get(r.user_id) ?? [];
      list.push(r.role);
      rolesByUser.set(r.user_id, list);
    }
    const coursesByUser = new Map<string, string[]>();
    for (const o of orders ?? []) {
      if (!o.course_id) continue;
      const list = coursesByUser.get(o.user_id) ?? [];
      list.push(o.course_id);
      coursesByUser.set(o.user_id, list);
    }

    return {
      students: (profiles ?? []).map((p) => ({
        ...p,
        roles: rolesByUser.get(p.id) ?? [],
        course_ids: coursesByUser.get(p.id) ?? [],
      })),
    };
  });

export const toggleStudentLock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ user_id: z.string().uuid(), is_locked: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ is_locked: data.is_locked })
      .eq("id", data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const grantCourseAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      user_id: z.string().uuid(),
      course_id: z.string().uuid(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const { data: existing } = await supabaseAdmin
      .from("orders")
      .select("id")
      .eq("user_id", data.user_id)
      .eq("course_id", data.course_id)
      .eq("status", "completed")
      .maybeSingle();
    if (existing) return { ok: true, alreadyGranted: true };

    const { error } = await supabaseAdmin.from("orders").insert({
      user_id: data.user_id,
      course_id: data.course_id,
      total_amount: 0,
      status: "completed",
      payment_method: "sepay",
      paid_at: new Date().toISOString(),
      note: "Manual grant by admin",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const revokeCourseAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ user_id: z.string().uuid(), course_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ status: "cancelled" })
      .eq("user_id", data.user_id)
      .eq("course_id", data.course_id)
      .eq("status", "completed");
    if (error) throw new Error(error.message);
    return { ok: true };
  });
