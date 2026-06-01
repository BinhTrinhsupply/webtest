import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ===== My Courses (purchased + trial) =====
export const getMyCourses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // 1) Completed orders → purchased course ids
    const { data: orders } = await supabase
      .from("orders")
      .select("course_id, created_at")
      .eq("user_id", userId)
      .eq("status", "completed");

    const purchasedIds = Array.from(
      new Set((orders ?? []).map((o) => o.course_id).filter(Boolean)),
    ) as string[];

    // 2) Pull all published courses
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: allCourses } = await supabaseAdmin
      .from("courses")
      .select("id,slug,title,thumbnail_url,short_description,price,sale_price")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    const courses = allCourses ?? [];

    // 3) For each purchased course, count lessons + completed progress + first lesson
    const purchasedCourses = courses.filter((c) => purchasedIds.includes(c.id));
    const trialCourses = courses.filter((c) => !purchasedIds.includes(c.id));

    const enriched = await Promise.all(
      purchasedCourses.map(async (c) => {
        const { data: chapters } = await supabaseAdmin
          .from("chapters")
          .select("id")
          .eq("course_id", c.id);
        const chapterIds = (chapters ?? []).map((x) => x.id);

        let totalLessons = 0;
        let firstLessonId: string | null = null;
        if (chapterIds.length) {
          const { data: lessons } = await supabaseAdmin
            .from("lessons")
            .select("id, chapter_id, order_index")
            .in("chapter_id", chapterIds)
            .order("order_index", { ascending: true });
          totalLessons = (lessons ?? []).length;
          firstLessonId = lessons?.[0]?.id ?? null;
        }

        let completed = 0;
        if (totalLessons > 0) {
          const { data: prog } = await supabase
            .from("progress")
            .select("lesson_id")
            .eq("user_id", userId);
          const allLessonIds = new Set<string>();
          if (chapterIds.length) {
            const { data: ls } = await supabaseAdmin
              .from("lessons")
              .select("id")
              .in("chapter_id", chapterIds);
            (ls ?? []).forEach((l) => allLessonIds.add(l.id));
          }
          completed = (prog ?? []).filter((p) => allLessonIds.has(p.lesson_id)).length;
        }

        const progress = totalLessons ? Math.round((completed / totalLessons) * 100) : 0;
        return { ...c, totalLessons, completed, progress, firstLessonId };
      }),
    );

    // For trial, just return basic info + first preview lesson
    const trialEnriched = await Promise.all(
      trialCourses.slice(0, 6).map(async (c) => {
        const { data: chapters } = await supabaseAdmin
          .from("chapters")
          .select("id")
          .eq("course_id", c.id);
        const chapterIds = (chapters ?? []).map((x) => x.id);
        let firstPreviewId: string | null = null;
        let totalLessons = 0;
        if (chapterIds.length) {
          const { data: lessons } = await supabaseAdmin
            .from("lessons")
            .select("id, is_preview, order_index")
            .in("chapter_id", chapterIds)
            .order("order_index", { ascending: true });
          totalLessons = (lessons ?? []).length;
          firstPreviewId = lessons?.find((l) => l.is_preview)?.id ?? null;
        }
        return { ...c, totalLessons, firstPreviewId };
      }),
    );

    return { purchased: enriched, trial: trialEnriched };
  });

// ===== Course player tree =====
export const getCoursePlayer = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ courseId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: course } = await supabaseAdmin
      .from("courses")
      .select("id,slug,title,thumbnail_url")
      .eq("id", data.courseId)
      .maybeSingle();
    if (!course) throw new Error("Khóa học không tồn tại");

    // Access check
    const { data: access } = await supabase.rpc("user_has_course_access", {
      _user_id: userId,
      _course_id: data.courseId,
    });
    const hasAccess = Boolean(access);

    const { data: chapters } = await supabaseAdmin
      .from("chapters")
      .select("id,title,order_index")
      .eq("course_id", data.courseId)
      .order("order_index");

    const chapterIds = (chapters ?? []).map((c) => c.id);
    const { data: lessons } = chapterIds.length
      ? await supabaseAdmin
          .from("lessons")
          .select("id,chapter_id,title,video_url,is_preview,order_index,content_type,text_content")
          .in("chapter_id", chapterIds)
          .order("order_index")
      : { data: [] as Array<{ id: string; chapter_id: string; title: string; video_url: string | null; is_preview: boolean; order_index: number; content_type: string; text_content: string | null }> };

    // Progress
    const { data: prog } = await supabase
      .from("progress")
      .select("lesson_id")
      .eq("user_id", userId);
    const completedSet = new Set((prog ?? []).map((p) => p.lesson_id));

    const totalLessons = (lessons ?? []).length;
    const completedCount = (lessons ?? []).filter((l) => completedSet.has(l.id)).length;
    const percent = totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0;

    return {
      course,
      hasAccess,
      chapters: chapters ?? [],
      lessons: (lessons ?? []).map((l) => ({
        ...l,
        completed: completedSet.has(l.id),
        // hide video from unauth & non-preview
        video_url: hasAccess || l.is_preview ? l.video_url : null,
        text_content: hasAccess || l.is_preview ? l.text_content : null,
      })),
      totalLessons,
      completedCount,
      percent,
    };
  });

// ===== Mark lesson complete / incomplete =====
export const toggleLessonComplete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ lessonId: z.string().uuid(), completed: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.completed) {
      await supabase
        .from("progress")
        .delete()
        .eq("user_id", userId)
        .eq("lesson_id", data.lessonId);
      const { error } = await supabase
        .from("progress")
        .insert({ user_id: userId, lesson_id: data.lessonId });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("progress")
        .delete()
        .eq("user_id", userId)
        .eq("lesson_id", data.lessonId);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

// ===== My orders (purchase history) =====
export const getMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: orders } = await supabase
      .from("orders")
      .select("id,total_amount,status,created_at,paid_at,course_id,customer_name,customer_email")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const courseIds = Array.from(
      new Set((orders ?? []).map((o) => o.course_id).filter(Boolean)),
    ) as string[];
    const { data: courses } = courseIds.length
      ? await supabaseAdmin.from("courses").select("id,title,slug").in("id", courseIds)
      : { data: [] as Array<{ id: string; title: string; slug: string }> };
    const courseMap = new Map((courses ?? []).map((c) => [c.id, c]));

    return {
      orders: (orders ?? []).map((o) => ({
        ...o,
        course: o.course_id ? courseMap.get(o.course_id) ?? null : null,
      })),
    };
  });
