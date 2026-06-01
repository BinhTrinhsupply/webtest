import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertAdmin } from "./admin-guard";

export const listBlogPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await supabaseAdmin
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { posts: data ?? [] };
  });

export const upsertBlogPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid().optional(),
      slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, "slug chỉ gồm chữ thường, số, dấu -"),
      title: z.string().min(1).max(300),
      category: z.string().max(100).nullable().optional(),
      thumbnail_url: z.string().url().max(1000).nullable().optional().or(z.literal("")),
      excerpt: z.string().max(1000).nullable().optional(),
      content: z.string().max(100000).nullable().optional(),
      is_published: z.boolean().default(true),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const row = {
      slug: data.slug,
      title: data.title,
      category: data.category ?? null,
      thumbnail_url: data.thumbnail_url || null,
      excerpt: data.excerpt ?? null,
      content: data.content ?? null,
      is_published: data.is_published,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("blog_posts").update(row).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: inserted, error } = await supabaseAdmin.from("blog_posts").insert(row).select("id").single();
    if (error) throw new Error(error.message);
    return { id: inserted.id };
  });

export const deleteBlogPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await supabaseAdmin.from("blog_posts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
