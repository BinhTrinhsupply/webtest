import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { listStudents, toggleStudentLock, grantCourseAccess, revokeCourseAccess } from "@/lib/admin-students.functions";
import { listCourses } from "@/lib/admin-courses.functions";
import { Loader2, Lock, Unlock, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/students")({
  component: AdminStudentsPage,
});

function AdminStudentsPage() {
  const fetchStudents = useServerFn(listStudents);
  const fetchCourses = useServerFn(listCourses);
  const toggleLock = useServerFn(toggleStudentLock);
  const grant = useServerFn(grantCourseAccess);
  const revoke = useServerFn(revokeCourseAccess);

  const sQ = useQuery({ queryKey: ["admin-students"], queryFn: () => fetchStudents() });
  const cQ = useQuery({ queryKey: ["admin-courses-min"], queryFn: () => fetchCourses() });

  const [search, setSearch] = useState("");
  const [granting, setGranting] = useState<{ user_id: string; name: string } | null>(null);
  const [chosenCourse, setChosenCourse] = useState<string>("");

  const filtered = useMemo(() => {
    const list = sQ.data?.students ?? [];
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(
      (s) => (s.email ?? "").toLowerCase().includes(q) || (s.full_name ?? "").toLowerCase().includes(q) || (s.phone ?? "").toLowerCase().includes(q),
    );
  }, [sQ.data, search]);

  const courseMap = new Map((cQ.data?.courses ?? []).map((c) => [c.id, c.title]));

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Quản lý Học viên</h1>
      <p className="mt-1 text-sm text-muted-foreground">Kích hoạt khóa học, khóa / mở tài khoản học viên.</p>

      <input
        placeholder="Tìm theo email / tên / số điện thoại…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mt-6 h-10 w-full max-w-md rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
      />

      {sQ.isLoading && <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải…</div>}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Học viên</th>
              <th className="px-4 py-3 text-left">Liên hệ</th>
              <th className="px-4 py-3 text-left">Khóa học đã có</th>
              <th className="px-4 py-3 text-left">Trạng thái</th>
              <th className="px-4 py-3 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-secondary/20">
                <td className="px-4 py-3">
                  <div className="font-medium">{s.full_name || "—"}</div>
                  <div className="text-xs text-muted-foreground">{s.roles.join(", ") || "student"}</div>
                </td>
                <td className="px-4 py-3">
                  <div>{s.email}</div>
                  <div className="text-xs text-muted-foreground">{s.phone || "—"}</div>
                </td>
                <td className="px-4 py-3">
                  {s.course_ids.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                  <div className="flex flex-wrap gap-1">
                    {s.course_ids.map((cid) => (
                      <span key={cid} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                        {courseMap.get(cid) ?? cid.slice(0, 6)}
                        <button
                          title="Thu hồi"
                          onClick={async () => {
                            if (!confirm("Thu hồi quyền học khóa này?")) return;
                            await revoke({ data: { user_id: s.id, course_id: cid } });
                            sQ.refetch();
                          }}
                          className="ml-1 text-primary/60 hover:text-destructive"
                        >×</button>
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${s.is_locked ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary"}`}>
                    {s.is_locked ? "Đã khoá" : "Hoạt động"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => { setGranting({ user_id: s.id, name: s.full_name ?? s.email ?? "" }); setChosenCourse(""); }}
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-xs hover:bg-secondary"
                    >
                      <Plus className="h-3 w-3" /> Cấp khóa
                    </button>
                    <button
                      onClick={async () => { await toggleLock({ data: { user_id: s.id, is_locked: !s.is_locked } }); sQ.refetch(); }}
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-xs hover:bg-secondary"
                    >
                      {s.is_locked ? <><Unlock className="h-3 w-3" /> Mở</> : <><Lock className="h-3 w-3" /> Khoá</>}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && !sQ.isLoading && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">Không có học viên.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {granting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setGranting(null)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">Cấp khóa học cho {granting.name}</h2>
            <select
              value={chosenCourse}
              onChange={(e) => setChosenCourse(e.target.value)}
              className="mt-4 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
            >
              <option value="">— Chọn khóa học —</option>
              {(cQ.data?.courses ?? []).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setGranting(null)} className="h-10 rounded-xl border border-border px-5 text-sm">Huỷ</button>
              <button
                disabled={!chosenCourse}
                onClick={async () => {
                  await grant({ data: { user_id: granting.user_id, course_id: chosenCourse } });
                  setGranting(null);
                  sQ.refetch();
                }}
                className="btn-glow h-10 rounded-xl px-5 text-sm font-medium disabled:opacity-50"
              >Cấp quyền</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
