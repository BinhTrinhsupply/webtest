import { Star } from "lucide-react";
import a1 from "@/assets/avatar-1.jpg";
import a2 from "@/assets/avatar-2.jpg";
import a3 from "@/assets/avatar-3.jpg";

const items = [
  {
    name: "Nguyễn Minh Quân",
    role: "Founder, Studio Hà Nội",
    avatar: a1,
    quote: "Khóa học rất thực chiến, đi thẳng vào vấn đề. Sau 4 tuần mình đã áp dụng được hệ thống marketing cho cả team.",
  },
  {
    name: "Lê Phương Linh",
    role: "Product Manager",
    avatar: a2,
    quote: "Mình đặc biệt thích phong cách tối giản và rõ ràng. Mỗi bài học đều có template để áp dụng ngay.",
  },
  {
    name: "Trần Quốc Bảo",
    role: "Freelance Designer",
    avatar: a3,
    quote: "Ebook và bộ công cụ rất chỉn chu. Đáng giá hơn nhiều so với mức phí. Khuyên dùng cho ai mới bắt đầu.",
  },
];

export function Testimonials() {
  return (
    <section className="bg-secondary/50">
      <div className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
        <div className="max-w-2xl">
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Cảm nhận</span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl">
            Học viên nói gì về chúng tôi
          </h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => (
            <figure key={t.name} className="flex flex-col gap-6 rounded-2xl bg-card p-8">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-foreground text-foreground" />
                ))}
              </div>
              <blockquote className="text-[15px] leading-relaxed text-foreground">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-auto flex items-center gap-3 pt-4">
                <img
                  src={t.avatar}
                  alt={t.name}
                  loading="lazy"
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div>
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
