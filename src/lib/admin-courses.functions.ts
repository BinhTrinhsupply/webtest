import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { assertAdmin } from "./admin-guard";

// ----- Courses -----
export const listCourses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { courses: data ?? [] };
  });

export const upsertCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid().optional(),
      slug: z.string().min(1).max(120),
      title: z.string().min(1).max(200),
      short_description: z.string().max(500).nullable().optional(),
      long_description: z.string().max(20000).nullable().optional(),
      category: z.string().max(50).nullable().optional(),
      price: z.number().min(0),
      sale_price: z.number().min(0).nullable().optional(),
      thumbnail_url: z.string().max(500).nullable().optional(),
      is_published: z.boolean(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    if (data.id) {
      const { id, ...patch } = data;
      const { error } = await supabase.from("courses").update(patch).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    } else {
      const { data: ins, error } = await supabase.from("courses").insert(data).select("id").single();
      if (error) throw new Error(error.message);
      return { id: ins.id };
    }
  });

export const deleteCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { error } = await supabase.from("courses").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ----- Course detail with chapters & lessons -----
export const getCourseTree = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const [{ data: course }, { data: chapters }, { data: lessons }] = await Promise.all([
      supabase.from("courses").select("*").eq("id", data.id).single(),
      supabase.from("chapters").select("*").eq("course_id", data.id).order("order_index"),
      supabase.from("lessons").select("*, chapters!inner(course_id)").eq("chapters.course_id", data.id).order("order_index"),
    ]);
    return { course, chapters: chapters ?? [], lessons: lessons ?? [] };
  });

// ----- Chapters -----
export const upsertChapter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid().optional(),
      course_id: z.string().uuid(),
      title: z.string().min(1).max(200),
      order_index: z.number().int().min(0),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    if (data.id) {
      const { id, ...patch } = data;
      const { error } = await supabase.from("chapters").update(patch).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    } else {
      const { data: ins, error } = await supabase.from("chapters").insert(data).select("id").single();
      if (error) throw new Error(error.message);
      return { id: ins.id };
    }
  });

export const deleteChapter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    await supabase.from("lessons").delete().eq("chapter_id", data.id);
    const { error } = await supabase.from("chapters").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ----- Lessons -----
export const upsertLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid().optional(),
      chapter_id: z.string().uuid(),
      title: z.string().min(1).max(200),
      content_type: z.enum(["video", "text", "file"]),
      video_url: z.string().max(500).nullable().optional(),
      text_content: z.string().max(50000).nullable().optional(),
      attachment_url: z.string().max(500).nullable().optional(),
      tags: z.array(z.string().max(40)).max(20).default([]),
      order_index: z.number().int().min(0),
      is_preview: z.boolean(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    if (data.id) {
      const { id, ...patch } = data;
      const { error } = await supabase.from("lessons").update(patch).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    } else {
      const { data: ins, error } = await supabase.from("lessons").insert(data).select("id").single();
      if (error) throw new Error(error.message);
      return { id: ins.id };
    }
  });

export const deleteLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { error } = await supabase.from("lessons").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ----- Bump products -----
export const listBumps = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data, error } = await supabase.from("bump_products").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { bumps: data ?? [] };
  });

export const upsertBump = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid().optional(),
      title: z.string().min(1).max(200),
      description: z.string().max(500).nullable().optional(),
      price: z.number().min(0),
      sale_price: z.number().min(0).nullable().optional(),
      thumbnail_url: z.string().max(500).nullable().optional(),
      is_active: z.boolean(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    if (data.id) {
      const { id, ...patch } = data;
      const { error } = await supabase.from("bump_products").update(patch).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: ins, error } = await supabase.from("bump_products").insert(data).select("id").single();
    if (error) throw new Error(error.message);
    return { id: ins.id };
  });

export const deleteBump = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { error } = await supabase.from("bump_products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
