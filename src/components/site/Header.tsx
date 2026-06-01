import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Search, ShieldCheck, User as UserIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/use-auth";

const nav = [
  { to: "/", label: "Trang chủ" },
  { to: "/courses", label: "Khóa học" },
  { to: "/ebooks", label: "Ebook" },
  { to: "/tools", label: "Công cụ" },
  { to: "/blog", label: "Blog" },
] as const;

export function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-5 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-brand shadow-[0_0_18px_-2px_color-mix(in_oklab,var(--brand-glow)_70%,transparent)]" />
            <span className="text-base font-semibold tracking-tight">BinhTrinhAcademy</span>
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "text-sm text-foreground font-medium" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Tìm kiếm..."
              className="h-10 w-48 rounded-xl border border-border bg-secondary/60 pl-9 pr-3 text-sm outline-none transition focus:border-brand focus:bg-background lg:w-64"
            />
          </div>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="btn-outline-brand inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium">
                  <UserIcon className="h-4 w-4" />
                  <span className="hidden max-w-[140px] truncate sm:inline">{user.email}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
                  {user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/my-courses">Lớp học của tôi</Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-brand" />
                      Trang quản trị
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await signOut();
                    navigate({ to: "/" });
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/login"
              className="btn-glow inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
