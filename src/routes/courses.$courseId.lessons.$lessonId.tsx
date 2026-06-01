import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo } from "react";
import {
  Bell,
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  Circle,
  Lock,
  PlayCircle,
  BookOpen,
  Clock,
  Megaphone,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/lib/use-auth";
import { getCoursePlayer, toggleLessonComplete } from "@/lib/student.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/courses/$courseId/lessons/$lessonId")({
  head: () => ({ meta: [{ title: "Bài giảng — BinhTrinhAcademy" }] }),
  component: CoursePlayerPage,
});

function CoursePlayerPage() {
  const { courseId, lessonId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const fetchPlayer = useServerFn(getCoursePlayer);
  const toggleFn = useServerFn(toggleLessonComplete);

  const { data, isLoading, error } = useQuery({
    queryKey: ["course-player", courseId],
    queryFn: () => fetchPlayer({ data: { courseId } }),
    enabled: !!user,
  });

  const mutate = useMutation({
    mutationFn: (vars: { lessonId: string; completed: boolean }) =>
      toggleFn({ data: vars }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["course-player", courseId] }),
  });

  const current = useMemo(
    () => data?.lessons.find((l) => l.id === lessonId) ?? data?.lessons[0] ?? null,
    [data, lessonId],
  );
  const currentChapter = useMemo(
    () => data?.chapters.find((c) => c.id === current?.chapter_id) ?? null,
    [data, current],
  );

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Đang tải…</div>;
  }
  if (error || !data || !current) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 text-center">
        <p className="text-lg font-semibold">Không tải được bài giảng</p>
        <p className="text-sm text-muted-foreground">{(error as Error)?.message ?? "Khóa học không có bài học"}</p>
        <Link to="/my-courses" className="mt-2 text-sm font-medium text-emerald-600 hover:underline">← Về Khóa học của tôi</Link>
      </div>
    );
  }

  const goToLesson = (id: string) =>
    navigate({ to: "/courses/$courseId/lessons/$lessonId", params: { courseId, lessonId: id } });

  const canPlay = data.hasAccess || current.is_preview;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-zinc-900 text-white">
        <div className="mx-auto flex h-16 items-center gap-3 px-4 lg:px-6">
          <Link to="/my-courses" className="flex shrink-0 items-center gap-1 text-sm text-zinc-300 hover:text-white">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1 text-center">
            <p className="line-clamp-1 text-sm font-medium lg:text-base">{data.course.title}</p>
            <p className="text-xs text-emerald-400">
              {data.percent}% Hoàn thành ({data.completedCount}/{data.totalLessons})
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button className="relative text-zinc-300 hover:text-white">
              <Bell className="h-5 w-5" />
            </button>
            <Avatar className="h-8 w-8 ring-2 ring-emerald-500">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback>{(user?.email ?? "U").charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-screen-2xl px-0 lg:px-6 lg:py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Player */}
          <div className="lg:col-span-2">
            <div className="relative aspect-video w-full overflow-hidden bg-black lg:rounded-2xl">
              {canPlay && current.video_url ? (
                current.video_url.includes("youtube") || current.video_url.includes("youtu.be") ? (
                  <iframe
                    src={toEmbedUrl(current.video_url)}
                    className="h-full w-full"
                    title={current.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video src={current.video_url} controls className="h-full w-full" />
                )
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-white">
                  {canPlay ? (
                    <>
                      <PlayCircle className="h-16 w-16 text-emerald-500" />
                      <p className="text-sm text-zinc-300">Chưa có video cho bài học này</p>
                    </>
                  ) : (
                    <>
                      <Lock className="h-12 w-12 text-zinc-500" />
                      <p className="text-sm font-medium">Bạn cần mua khóa học để xem bài này</p>
                      <Link
                        to="/checkout/$slug"
                        params={{ slug: data.course.slug }}
                        className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
                      >
                        Mua ngay
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="bg-card px-4 py-4 lg:mt-4 lg:rounded-2xl lg:px-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {currentChapter && (
                    <p className="mb-1 text-xs text-muted-foreground">📁 {currentChapter.title}</p>
                  )}
                  <h1 className="text-lg font-semibold leading-snug lg:text-xl">{current.title}</h1>
                </div>
                {current.is_preview ? (
                  <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">MIỄN PHÍ</Badge>
                ) : (
                  <Badge className="bg-amber-200 text-amber-900 hover:bg-amber-200">PREMIUM</Badge>
                )}
              </div>

              {canPlay && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => mutate.mutate({ lessonId: current.id, completed: !current.completed })}
                    disabled={mutate.isPending}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50",
                      current.completed
                        ? "border border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                        : "bg-emerald-500 text-white hover:bg-emerald-600",
                    )}
                  >
                    {current.completed ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                    {current.completed ? "Đã hoàn thành" : "Đánh dấu hoàn thành"}
                  </button>
                </div>
              )}

              {canPlay && current.text_content && (
                <div className="prose prose-sm mt-6 max-w-none whitespace-pre-wrap">{current.text_content}</div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="bg-card px-4 py-4 lg:rounded-2xl">
            <Tabs defaultValue="lessons" className="flex h-full flex-col">
              <TabsList className="w-full justify-start gap-1 bg-transparent p-0 border-b rounded-none h-auto">
                {[
                  { v: "lessons", icon: BookOpen, label: "Bài học" },
                  { v: "recent", icon: Clock, label: "Mới nhất" },
                  { v: "saved", icon: Bookmark, label: "Đã lưu" },
                  { v: "notify", icon: Megaphone, label: "Thông báo" },
                ].map((t) => (
                  <TabsTrigger
                    key={t.v}
                    value={t.v}
                    className="gap-1.5 rounded-none border-b-2 border-transparent bg-transparent px-3 py-2.5 text-sm data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent data-[state=active]:text-emerald-600 data-[state=active]:shadow-none"
                  >
                    <t.icon className="h-4 w-4" />
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="lessons" className="mt-4 flex-1 overflow-y-auto lg:max-h-[calc(100vh-180px)]">
                <Accordion type="multiple" defaultValue={currentChapter ? [currentChapter.id] : []} className="space-y-2">
                  {data.chapters.map((ch) => {
                    const chLessons = data.lessons.filter((l) => l.chapter_id === ch.id);
                    const done = chLessons.filter((l) => l.completed).length;
                    return (
                      <AccordionItem key={ch.id} value={ch.id} className="overflow-hidden rounded-xl border bg-card">
                        <AccordionTrigger className="px-4 py-3 hover:no-underline">
                          <div className="flex-1 text-left">
                            <p className="text-sm font-semibold">{ch.title}</p>
                            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {chLessons.length} Bài học</span>
                              <span className={cn("flex items-center gap-1", done === chLessons.length && chLessons.length > 0 && "text-emerald-600")}>
                                <CheckCircle2 className="h-3 w-3" /> Xong {done}/{chLessons.length}
                              </span>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2 px-2 pb-2">
                          {chLessons.map((l) => (
                            <button
                              key={l.id}
                              onClick={() => goToLesson(l.id)}
                              className={cn(
                                "relative flex w-full gap-3 rounded-xl p-2 text-left transition-colors hover:bg-muted/60",
                                l.id === current.id && "ring-2 ring-emerald-500 bg-emerald-50/40",
                              )}
                            >
                              <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-800 text-white">
                                {data.hasAccess || l.is_preview ? <PlayCircle className="h-6 w-6" /> : <Lock className="h-5 w-5" />}
                              </div>
                              <div className="flex-1 min-w-0 pr-6">
                                <div className="mb-1 flex items-center gap-1.5">
                                  {l.is_preview ? (
                                    <Badge className="h-4 bg-emerald-500 px-1.5 text-[9px] font-bold text-white hover:bg-emerald-500">MIỄN PHÍ</Badge>
                                  ) : (
                                    <Badge className="h-4 bg-amber-200 px-1.5 text-[9px] font-bold text-amber-900 hover:bg-amber-200">PREMIUM</Badge>
                                  )}
                                </div>
                                <p className="line-clamp-2 text-sm font-medium leading-snug">{l.title}</p>
                              </div>
                              {l.completed && (
                                <CheckCircle2 className="absolute bottom-2 right-2 h-5 w-5 fill-emerald-500 text-white" />
                              )}
                            </button>
                          ))}
                          {chLessons.length === 0 && (
                            <p className="px-2 py-3 text-xs text-muted-foreground">Chưa có bài học.</p>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                  {data.chapters.length === 0 && (
                    <p className="text-sm text-muted-foreground">Khóa học chưa có nội dung.</p>
                  )}
                </Accordion>
              </TabsContent>
              <TabsContent value="recent" className="mt-4 text-sm text-muted-foreground">Chưa có bài học mới.</TabsContent>
              <TabsContent value="saved" className="mt-4 text-sm text-muted-foreground">Chưa có bài đã lưu.</TabsContent>
              <TabsContent value="notify" className="mt-4 text-sm text-muted-foreground">Không có thông báo.</TabsContent>
            </Tabs>
          </aside>
        </div>
      </div>
    </div>
  );
}

function toEmbedUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    return url;
  } catch {
    return url;
  }
}
