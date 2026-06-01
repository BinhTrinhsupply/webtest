import c1 from "@/assets/course-1.jpg";
import c2 from "@/assets/course-2.jpg";
import c3 from "@/assets/course-3.jpg";
import c4 from "@/assets/course-4.jpg";
import c5 from "@/assets/course-5.jpg";
import c6 from "@/assets/course-6.jpg";

export type Category = "course" | "ebook" | "service" | "guide";

export interface Product {
  id: string;
  title: string;
  category: Category;
  categoryLabel: string;
  price: string;
  image: string;
  description: string;
  lessons?: { title: string; duration: string }[];
}

export const categoryFilters: { id: "all" | Category; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "course", label: "Khóa học" },
  { id: "ebook", label: "Sách & Ebooks" },
  { id: "service", label: "Dịch vụ" },
  { id: "guide", label: "Hướng dẫn" },
];

const defaultLessons = [
  { title: "Giới thiệu khóa học", duration: "08:24" },
  { title: "Tư duy nền tảng cho người mới", duration: "14:10" },
  { title: "Xây dựng quy trình thực chiến", duration: "22:45" },
  { title: "Case study: Triển khai dự án thực tế", duration: "31:02" },
  { title: "Tối ưu hiệu suất & đo lường", duration: "18:36" },
  { title: "Tổng kết và lộ trình tiếp theo", duration: "12:08" },
];

export const products: Product[] = [
  {
    id: "thuc-chien-marketing",
    title: "Marketing Thực Chiến Cho Người Bận Rộn",
    category: "course",
    categoryLabel: "Khóa học",
    price: "1.490.000đ",
    image: c1,
    description: "Lộ trình 30 ngày xây dựng hệ thống marketing bài bản từ con số 0, với case study thực tế từ doanh nghiệp Việt.",
    lessons: defaultLessons,
  },
  {
    id: "ebook-tu-duy-san-pham",
    title: "Tư Duy Sản Phẩm — Ebook 240 trang",
    category: "ebook",
    categoryLabel: "Ebook",
    price: "199.000đ",
    image: c2,
    description: "Cuốn sách điện tử đúc kết 10 năm làm sản phẩm, đi kèm bộ template và checklist triển khai.",
  },
  {
    id: "khoa-hoc-productivity",
    title: "Productivity OS — Hệ Điều Hành Cá Nhân",
    category: "course",
    categoryLabel: "Khóa học",
    price: "990.000đ",
    image: c3,
    description: "Thiết lập hệ thống quản lý công việc, thời gian và năng lượng theo phong cách tối giản.",
    lessons: defaultLessons,
  },
  {
    id: "phan-mem-dashboard",
    title: "Bộ Công Cụ Dashboard Notion + Sheets",
    category: "guide",
    categoryLabel: "Hướng dẫn",
    price: "299.000đ",
    image: c4,
    description: "Template + video hướng dẫn dựng dashboard cá nhân và team chuyên nghiệp trong 1 buổi tối.",
  },
  {
    id: "ebook-viet-hay",
    title: "Viết Hay — Cẩm Nang Câu Chữ Tối Giản",
    category: "ebook",
    categoryLabel: "Sách",
    price: "149.000đ",
    image: c5,
    description: "Bộ nguyên tắc viết nội dung gãy gọn, thuyết phục, dùng được cho landing page, email và bài blog.",
  },
  {
    id: "coaching-1-1",
    title: "Coaching 1-1 Với Chuyên Gia (8 buổi)",
    category: "service",
    categoryLabel: "Dịch vụ",
    price: "12.900.000đ",
    image: c6,
    description: "Chương trình huấn luyện cá nhân hóa, đồng hành 1-1 trong 8 tuần để giải quyết bài toán cụ thể của bạn.",
  },
  {
    id: "khoa-hoc-thiet-ke",
    title: "Thiết Kế Tối Giản Cho Non-Designer",
    category: "course",
    categoryLabel: "Khóa học",
    price: "790.000đ",
    image: c1,
    description: "Nguyên lý thiết kế minimalist áp dụng cho slide, social và website mà không cần biết Photoshop.",
    lessons: defaultLessons,
  },
  {
    id: "huong-dan-ai",
    title: "Hướng Dẫn Ứng Dụng AI Trong Công Việc",
    category: "guide",
    categoryLabel: "Hướng dẫn",
    price: "Miễn phí",
    image: c4,
    description: "Bộ hướng dẫn từng bước sử dụng ChatGPT, Claude và các công cụ AI để tăng tốc công việc hằng ngày.",
  },
];

export const getProduct = (id: string) => products.find((p) => p.id === id);
