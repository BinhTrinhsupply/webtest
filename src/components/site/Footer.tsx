import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-brand shadow-[0_0_18px_-2px_color-mix(in_oklab,var(--brand-glow)_70%,transparent)]" />
              <span className="text-base font-semibold tracking-tight">BinhTrinhAcademy</span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Nền tảng học kỹ năng thực chiến và sản phẩm số dành cho người làm nghề chuyên nghiệp.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium">Liên hệ</h4>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>Hotline: 1900 6868</li>
              <li>Email: hello@minim.vn</li>
              <li>Số 1 Lý Thái Tổ, Hà Nội</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium">Khám phá</h4>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li><Link to="/courses" className="hover:text-foreground">Khóa học</Link></li>
              <li><Link to="/ebooks" className="hover:text-foreground">Ebook</Link></li>
              <li><Link to="/tools" className="hover:text-foreground">Công cụ</Link></li>
              <li><Link to="/blog" className="hover:text-foreground">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium">Pháp lý</h4>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>Về chúng tôi</li>
              <li>Chính sách bảo mật</li>
              <li>Điều khoản dịch vụ</li>
            </ul>
          </div>
        </div>
        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} BinhTrinhAcademy. All rights reserved.</span>
          <span>Made with care in Hà Nội.</span>
        </div>
      </div>
    </footer>
  );
}
