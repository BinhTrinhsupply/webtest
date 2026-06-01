import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  BookOpen,
  History,
  Play,
  ShoppingCart,
  User,
} from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/use-auth";
import { getMyCourses } from "@/lib/student.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/my-courses")({
  head: () => ({ meta: [{ title: "Khóa học của tôi — BinhTrinhAcademy" }] }),
  component: MyCoursesPage,
});

const sidebarItems = [
  { label: "Khóa học của tôi", icon: BookOpen, to: "/my-courses" as const, active: true },
  { label: "Lịch sử mua", icon: History, to: "/my-orders" as const },
  { label: "Hồ sơ", icon: User, to: "/my-courses" as const },
];

function MyCoursesPage() {
  const { user } = useAuth();
  const name = user?.email?.split("@")[0] ?? "Học viên";
  const fetchMyCourses = useServerFn(getMyCourses);
  const { data, isLoading } = useQuery({
    queryKey: ["my-courses"],
    queryFn: () => fetchMyCourses(),
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="border-b bg-gradient-to-r from-emerald-50 to-white">
        <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
          <nav className="text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Trang chủ</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">Khóa học của tôi</span>
          </nav>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Khóa học của tôi
          </h1>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="h-fit rounded-2xl border bg-card p-6">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-2xl font-semibold text-emerald-700">
              {name.charAt(0).toUpperCase()}
            </div>
            <h2 className="mt-4 text-lg font-semibold">{name}</h2>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <nav className="mt-6 space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                    item.active
                      ? "bg-emerald-500 text-white"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="space-y-10">
          <section>
            <h2 className="mb-4 text-xl font-semibold">Khóa đã mua</h2>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Đang tải…</p>
            ) : !data?.purchased.length ? (
              <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                Bạn chưa mua khóa học nào.{" "}
                <Link to="/courses" className="font-medium text-emerald-600 hover:underline">
                  Xem khóa học →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {data.purchased.map((c) => (
                  <PurchasedRow key={c.id} course={c} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold">Khóa học gợi ý</h2>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Đang tải…</p>
            ) : !data?.trial.length ? (
              <p className="text-sm text-muted-foreground">Không có khóa học gợi ý.</p>
            ) : (
              <div className="space-y-4">
                {data.trial.map((c) => (
                  <TrialRow key={c.id} course={c} />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

type PurchasedCourse = {
  id: string;
  slug: string;
  title: string;
  thumbnail_url: string | null;
  totalLessons: number;
  completed: number;
  progress: number;
  firstLessonId: string | null;
};

function PurchasedRow({ course }: { course: PurchasedCourse }) {
  const navigate = useNavigate();
  const start = () => {
    if (course.firstLessonId) {
      navigate({
        to: "/courses/$courseId/lessons/$lessonId",
        params: { courseId: course.id, lessonId: course.firstLessonId },
      });
    }
  };
  return (
    <article className="flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md md:flex-row">
      <div className="h-44 w-full overflow-hidden rounded-xl bg-muted md:h-32 md:w-56 md:shrink-0">
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt={course.title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3">
        <h3 className="text-base font-semibold leading-snug">{course.title}</h3>
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Play className="h-3.5 w-3.5" />
            Bài giảng {course.totalLessons}
          </span>
          <span>Hoàn thành {course.completed}/{course.totalLessons}</span>
        </div>
        <div className="space-y-1.5">
          <Progress value={course.progress} className="h-1.5 bg-emerald-100 [&>div]:bg-emerald-500" />
          <div className="flex justify-end text-xs font-medium text-emerald-600">{course.progress}%</div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <p className="text-xs text-muted-foreground">
            Thời hạn — <span className="font-semibold text-foreground">TRUY CẬP TRỌN ĐỜI</span>
          </p>
          <button
            type="button"
            onClick={start}
            disabled={!course.firstLessonId}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            {course.progress > 0 ? "Tiếp tục học" : "Bắt đầu ngay"}
          </button>
        </div>
      </div>
    </article>
  );
}

type TrialCourse = {
  id: string;
  slug: string;
  title: string;
  thumbnail_url: string | null;
  totalLessons: number;
  firstPreviewId: string | null;
};

function TrialRow({ course }: { course: TrialCourse }) {
  const navigate = useNavigate();
  return (
    <article className="flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md md:flex-row">
      <div className="relative h-44 w-full overflow-hidden rounded-xl bg-muted md:h-32 md:w-56 md:shrink-0">
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt={course.title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
        )}
        <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-1 text-[10px] font-semibold text-white">
          Khóa gợi ý
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3">
        <h3 className="text-base font-semibold leading-snug">{course.title}</h3>
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Play className="h-3.5 w-3.5" />
            Bài giảng {course.totalLessons}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          {course.firstPreviewId && (
            <button
              type="button"
              onClick={() =>
                navigate({
                  to: "/courses/$courseId/lessons/$lessonId",
                  params: { courseId: course.id, lessonId: course.firstPreviewId! },
                })
              }
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-600 transition-colors hover:bg-emerald-50"
            >
              <Play className="h-4 w-4" />
              Học thử
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate({ to: "/checkout/$slug", params: { slug: course.slug } })}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
          >
            <ShoppingCart className="h-4 w-4" />
            Mua ngay
          </button>
        </div>
      </div>
    </article>
  );
}
