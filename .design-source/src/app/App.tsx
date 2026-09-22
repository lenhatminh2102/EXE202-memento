import React, { useState, useEffect } from "react";
import {
  Camera, Search, Star, Heart, Bell, ChevronDown, MapPin,
  Calendar, Clock, DollarSign, Users, TrendingUp, CheckCircle,
  ArrowRight, Edit, Trash2, Filter, BarChart2, Settings, LogOut,
  Shield, Image, Plus, Mail, Phone, User, X, Package, BookOpen,
  Award, ChevronRight, Eye, Home, MessageSquare, MoreVertical,
  CreditCard, Check, Tag, Download, Activity, Globe, FileText, AlertCircle, Sparkles,
  List, ChevronLeft, Menu, Grid3x3
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";
import { authenticate } from "../../../src/services/mockAuthApi";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type View =
  | "home" | "login" | "register" | "forgot" | "about" | "contact"
  | "client-dashboard" | "search" | "photographer-profile" | "booking"
  | "payment" | "booking-success" | "history" | "history-detail"
  | "favorites" | "notifications" | "client-profile" | "client-settings"
  | "photo-dashboard" | "portfolio" | "packages" | "photo-bookings"
  | "photo-booking-detail" | "schedule" | "revenue" | "photo-reviews"
  | "photo-profile" | "photo-settings"
  | "admin-dashboard" | "admin-users" | "admin-photographers"
  | "admin-approval" | "admin-bookings" | "admin-reviews"
  | "admin-categories" | "admin-reports" | "admin-settings";

type Role = "public" | "client" | "photographer" | "admin";
type Navigate = (v: View, params?: Record<string, unknown>) => void;
type AuthUser = { email: string; role: Role; name: string };

interface Photographer {
  id: number;
  name: string;
  avatar: string;
  specialty: string;
  rating: number;
  reviews: number;
  location: string;
  price: number;
  verified: boolean;
  tags: string[];
  bio: string;
  portfolio: string[];
  completedJobs: number;
  responseTime: string;
}

// ═══════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════

const PHOTOGRAPHERS: Photographer[] = [
  {
    id: 1,
    name: "Nguyễn Minh Tuấn",
    avatar: "https://images.unsplash.com/photo-1587050265310-1a2d98ccce5f?w=200&h=200&fit=crop&auto=format",
    specialty: "Wedding & Events",
    rating: 4.9,
    reviews: 127,
    location: "Hà Nội",
    price: 2500000,
    verified: true,
    tags: ["Wedding", "Events", "Couple"],
    bio: "Chuyên gia nhiếp ảnh đám cưới với hơn 8 năm kinh nghiệm. Mỗi khoảnh khắc đặc biệt đều được ghi lại với sự tâm huyết và nghệ thuật riêng, tạo nên những kỷ niệm không thể quên.",
    completedJobs: 312,
    responseTime: "< 1 giờ",
    portfolio: [
      "https://images.unsplash.com/photo-1546032996-6dfacbacbf3f?w=600&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1519741196428-6a2175fa2557?w=600&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1537633468298-d86f0c2d4173?w=600&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1606216836549-f60d04e4a20b?w=600&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1571131639829-a022890def49?w=600&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1492175742197-ed20dc5a6bed?w=600&h=600&fit=crop&auto=format",
    ],
  },
  {
    id: 2,
    name: "Lê Thị Thu Hà",
    avatar: "https://images.unsplash.com/photo-1601934025804-c631e2777f26?w=200&h=200&fit=crop&auto=format",
    specialty: "Portrait & Fashion",
    rating: 4.8,
    reviews: 94,
    location: "TP. Hồ Chí Minh",
    price: 1800000,
    verified: true,
    tags: ["Portrait", "Fashion", "Beauty"],
    bio: "Nhiếp ảnh gia chân dung và thời trang với phong cách tinh tế, hiện đại. Tốt nghiệp trường Mỹ thuật TP.HCM, có 6 năm kinh nghiệm trong lĩnh vực thời trang.",
    completedJobs: 218,
    responseTime: "< 2 giờ",
    portfolio: [
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1633381521050-26bb467d9d5a?w=600&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1606143412458-acc5f86de897?w=600&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1563170446-9c3c0622d8a9?w=600&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1612928414075-bc722ade44f1?w=600&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1517462964-21fdcec3f25b?w=600&h=600&fit=crop&auto=format",
    ],
  },
  {
    id: 3,
    name: "Trần Đức Hiếu",
    avatar: "https://images.unsplash.com/photo-1621024994278-e409544f4085?w=200&h=200&fit=crop&auto=format",
    specialty: "Landscape & Travel",
    rating: 4.7,
    reviews: 68,
    location: "Đà Nẵng",
    price: 1500000,
    verified: true,
    tags: ["Landscape", "Travel", "Nature"],
    bio: "Đam mê khám phá và ghi lại vẻ đẹp thiên nhiên Việt Nam. Portfolio với hàng trăm địa điểm từ Bắc vào Nam, từ núi rừng Tây Bắc đến biển xanh Phú Quốc.",
    completedJobs: 145,
    responseTime: "< 3 giờ",
    portfolio: [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=600&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=600&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600&h=600&fit=crop&auto=format",
    ],
  },
  {
    id: 4,
    name: "Phạm Thị Lan",
    avatar: "https://images.unsplash.com/photo-1542992933-ce75d0187ec1?w=200&h=200&fit=crop&auto=format",
    specialty: "Events & Corporate",
    rating: 4.8,
    reviews: 156,
    location: "Hà Nội",
    price: 2000000,
    verified: true,
    tags: ["Events", "Corporate", "Product"],
    bio: "Nhiếp ảnh gia sự kiện chuyên nghiệp, cộng tác với hơn 100 thương hiệu lớn. Chuyên hội nghị, triển lãm và sự kiện doanh nghiệp với độ chính xác và nhanh nhạy cao.",
    completedJobs: 389,
    responseTime: "< 1 giờ",
    portfolio: [
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=600&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1515169067868-5387ec356754?w=600&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=600&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=600&h=600&fit=crop&auto=format",
    ],
  },
  {
    id: 5,
    name: "Hoàng Văn Nam",
    avatar: "https://images.unsplash.com/photo-1475274226786-e636f48a5645?w=200&h=200&fit=crop&auto=format",
    specialty: "Street & Documentary",
    rating: 4.6,
    reviews: 45,
    location: "TP. Hồ Chí Minh",
    price: 1200000,
    verified: false,
    tags: ["Street", "Documentary", "Black & White"],
    bio: "Nhiếp ảnh gia đường phố với con mắt sắc bén, chuyên ghi lại những khoảnh khắc chân thực của cuộc sống đô thị hiện đại.",
    completedJobs: 87,
    responseTime: "< 4 giờ",
    portfolio: [
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=600&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=600&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1440688807730-73e4e2169fb8?w=600&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&h=600&fit=crop&auto=format",
    ],
  },
  {
    id: 6,
    name: "Đỗ Thị Phương",
    avatar: "https://images.unsplash.com/photo-1526707821106-6428ecac1698?w=200&h=200&fit=crop&auto=format",
    specialty: "Family & Maternity",
    rating: 4.9,
    reviews: 83,
    location: "Đà Nẵng",
    price: 1600000,
    verified: true,
    tags: ["Family", "Maternity", "Newborn"],
    bio: "Chuyên nhiếp ảnh gia đình và thai sản với phong cách ấm áp, tự nhiên. Mỗi buổi chụp là một hành trình cảm xúc đặc biệt dành cho gia đình bạn.",
    completedJobs: 201,
    responseTime: "< 2 giờ",
    portfolio: [
      "https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=600&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1491013516836-7db643ee125a?w=600&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1519689373023-dd07c7988603?w=600&h=600&fit=crop&auto=format",
    ],
  },
];

const PACKAGES = [
  { id: 1, name: "Basic", duration: "2 giờ", photos: 30, edits: 10, price: 1500000, popular: false },
  { id: 2, name: "Standard", duration: "4 giờ", photos: 80, edits: 30, price: 2500000, popular: true },
  { id: 3, name: "Premium", duration: "Cả ngày", photos: 200, edits: "Không giới hạn", price: 5000000, popular: false },
];

const BOOKINGS = [
  { id: "B001", photographer: PHOTOGRAPHERS[0], date: "28/06/2025", time: "08:00", location: "Hà Nội", package: "Standard", status: "upcoming", price: 2500000 },
  { id: "B002", photographer: PHOTOGRAPHERS[1], date: "15/06/2025", time: "14:00", location: "TP.HCM", package: "Basic", status: "completed", price: 1800000 },
  { id: "B003", photographer: PHOTOGRAPHERS[3], date: "02/06/2025", time: "09:00", location: "Hà Nội", package: "Premium", status: "completed", price: 5000000 },
  { id: "B004", photographer: PHOTOGRAPHERS[2], date: "20/07/2025", time: "10:00", location: "Đà Nẵng", package: "Standard", status: "pending", price: 1500000 },
  { id: "B005", photographer: PHOTOGRAPHERS[4], date: "10/05/2025", time: "16:00", location: "TP.HCM", package: "Basic", status: "cancelled", price: 1200000 },
];

const REVIEWS = [
  { id: 1, author: "Trần Thị Mai", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop", rating: 5, date: "12/06/2025", comment: "Nhiếp ảnh gia rất chuyên nghiệp và thân thiện. Ảnh đẹp vượt mong đợi, giao hàng đúng hẹn. Chắc chắn sẽ book lại!", package: "Standard" },
  { id: 2, author: "Nguyễn Văn Hùng", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop", rating: 5, date: "05/06/2025", comment: "Tuyệt vời! Tuấn chụp rất tự nhiên, không bị giả tạo. Ảnh cưới của chúng tôi đẹp như mơ, cảm ơn rất nhiều!", package: "Premium" },
  { id: 3, author: "Lê Thị Hoa", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop", rating: 4, date: "28/05/2025", comment: "Rất hài lòng với chất lượng ảnh. Phong cách chụp sáng tạo và góc độ đẹp. Chỉ tiếc là giao ảnh hơi chậm một chút.", package: "Basic" },
];

const REVENUE_DATA = [
  { month: "T1", revenue: 12500000, bookings: 8 },
  { month: "T2", revenue: 15800000, bookings: 11 },
  { month: "T3", revenue: 9200000, bookings: 6 },
  { month: "T4", revenue: 22400000, bookings: 16 },
  { month: "T5", revenue: 18700000, bookings: 13 },
  { month: "T6", revenue: 28900000, bookings: 21 },
];

const ADMIN_REVENUE_DATA = [
  { month: "T1", revenue: 145000000, bookings: 89 },
  { month: "T2", revenue: 189000000, bookings: 112 },
  { month: "T3", revenue: 156000000, bookings: 97 },
  { month: "T4", revenue: 234000000, bookings: 145 },
  { month: "T5", revenue: 198000000, bookings: 128 },
  { month: "T6", revenue: 312000000, bookings: 201 },
];

const ADMIN_USERS = [
  { id: 1, name: "Phạm Quang Minh", email: "minh.pq@gmail.com", role: "client", status: "active", joined: "15/01/2025", bookings: 8 },
  { id: 2, name: "Nguyễn Thị Linh", email: "linh.nt@gmail.com", role: "client", status: "active", joined: "22/02/2025", bookings: 3 },
  { id: 3, name: "Lê Văn Đức", email: "duc.lv@gmail.com", role: "photographer", status: "active", joined: "10/01/2025", bookings: 45 },
  { id: 4, name: "Trần Thu Hương", email: "huong.tt@gmail.com", role: "client", status: "inactive", joined: "05/03/2025", bookings: 0 },
  { id: 5, name: "Võ Thành Long", email: "long.vt@gmail.com", role: "photographer", status: "pending", joined: "18/06/2025", bookings: 0 },
  { id: 6, name: "Bùi Thị Yến", email: "yen.bt@gmail.com", role: "client", status: "active", joined: "02/04/2025", bookings: 12 },
];

const PENDING_PHOTOGRAPHERS = [
  { id: 101, name: "Võ Thành Long", avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=80&h=80&fit=crop", specialty: "Wedding", location: "TP.HCM", experience: "5 năm", portfolio: 24, submitted: "18/06/2025" },
  { id: 102, name: "Phan Thị Diệu", avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=80&h=80&fit=crop", specialty: "Portrait", location: "Hà Nội", experience: "3 năm", portfolio: 18, submitted: "20/06/2025" },
  { id: 103, name: "Nguyễn Công Thắng", avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=80&h=80&fit=crop", specialty: "Events", location: "Đà Nẵng", experience: "7 năm", portfolio: 36, submitted: "21/06/2025" },
];

const fmtVND = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + "đ";

// ─── Mock Auth ────────────────────────────────────────────────────────────────
const AUTH_KEY = "memento_auth_v1";

const CLIENT_ROUTES: View[] = ["client-dashboard", "history", "history-detail", "favorites", "notifications", "client-profile", "client-settings"];
const PHOTO_ROUTES: View[] = ["photo-dashboard", "portfolio", "packages", "photo-bookings", "photo-booking-detail", "schedule", "revenue", "photo-reviews", "photo-profile", "photo-settings"];
const ADMIN_ROUTES: View[] = ["admin-dashboard", "admin-users", "admin-photographers", "admin-approval", "admin-bookings", "admin-reviews", "admin-categories", "admin-reports", "admin-settings"];
const BOOKING_ROUTES: View[] = ["booking", "payment", "booking-success"];
const ALL_PROTECTED: View[] = [...CLIENT_ROUTES, ...PHOTO_ROUTES, ...ADMIN_ROUTES, ...BOOKING_ROUTES];

// ═══════════════════════════════════════════════════════════════
// UTILITY COMPONENTS
// ═══════════════════════════════════════════════════════════════

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`${cls} ${i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`} />
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; text: string }> = {
    upcoming: { label: "Sắp tới", bg: "rgba(15,109,106,0.1)", text: "#0F6D6A" },
    completed: { label: "Hoàn thành", bg: "rgba(34,197,94,0.1)", text: "#16a34a" },
    pending: { label: "Chờ xác nhận", bg: "rgba(245,158,11,0.1)", text: "#d97706" },
    cancelled: { label: "Đã hủy", bg: "rgba(239,68,68,0.1)", text: "#dc2626" },
    active: { label: "Hoạt động", bg: "rgba(34,197,94,0.1)", text: "#16a34a" },
    inactive: { label: "Không hoạt động", bg: "rgba(156,163,175,0.15)", text: "#6b7280" },
    approved: { label: "Đã duyệt", bg: "rgba(34,197,94,0.1)", text: "#16a34a" },
    rejected: { label: "Từ chối", bg: "rgba(239,68,68,0.1)", text: "#dc2626" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: s.bg, color: s.text }}>
      {s.label}
    </span>
  );
}

function PhotographerCard({ p, navigate, favs, toggleFav }: { p: Photographer; navigate: Navigate; favs: Set<number>; toggleFav: (id: number) => void }) {
  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border hover:shadow-md transition-all duration-300 group cursor-pointer" onClick={() => navigate("photographer-profile", { id: p.id })}>
      <div className="relative h-52 overflow-hidden bg-muted">
        <img src={p.portfolio[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <button
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform z-10"
          onClick={(e) => { e.stopPropagation(); toggleFav(p.id); }}
        >
          <Heart className={`w-4 h-4 ${favs.has(p.id) ? "fill-rose-500 text-rose-500" : "text-gray-400"}`} />
        </button>
        {p.verified && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-semibold" style={{ color: "#0F6D6A" }}>
            <CheckCircle className="w-3 h-3" /> Đã xác minh
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <img src={p.avatar} alt={p.name} className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm" />
            <div>
              <p className="font-semibold text-sm text-foreground leading-tight">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.specialty}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.location}</span>
          <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{p.completedJobs} buổi</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Stars rating={p.rating} />
            <span className="text-xs font-semibold text-foreground">{p.rating}</span>
            <span className="text-xs text-muted-foreground">({p.reviews})</span>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Từ</p>
            <p className="text-sm font-bold" style={{ color: "#0F6D6A" }}>{fmtVND(p.price)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color = "#0F6D6A" }: { icon: React.ElementType; label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {sub && <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{sub}</span>}
      </div>
      <p className="text-2xl font-bold text-foreground mb-0.5">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// NAVBAR POPUP PANELS
// ═══════════════════════════════════════════════════════════════

const MONTH_NAMES_VN = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];
const DAY_HEADERS_VN = ["T2","T3","T4","T5","T6","T7","CN"];

function CalendarPanel({ role, onClose }: { role: Role; onClose: () => void }) {
  const [month, setMonth] = useState(5); // June 2025
  const [year, setYear] = useState(2025);

  const CLIENT_BOOKING_DAYS: Record<string, number[]> = { "2025-5": [28], "2025-6": [20], "2025-7": [5, 18] };
  const PHOTO_FULL_DAYS: Record<string, number[]> = { "2025-5": [15, 22] };
  const PHOTO_ALMOST_DAYS: Record<string, number[]> = { "2025-5": [18, 25, 27] };

  const key = `${year}-${month}`;
  const clientBookings = CLIENT_BOOKING_DAYS[key] ?? [];
  const fullDays = PHOTO_FULL_DAYS[key] ?? [];
  const almostDays = PHOTO_ALMOST_DAYS[key] ?? [];

  const today = new Date();
  const todayDate = today.getMonth() === month && today.getFullYear() === year ? today.getDate() : -1;
  const firstDay = new Date(year, month, 1).getDay();
  const adjustedFirst = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < adjustedFirst; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const goPrev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const goNext = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed z-50 bg-white border border-border rounded-2xl shadow-2xl p-5 w-80" style={{ top: 68, right: 320 }}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={goPrev} className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-secondary">
            <ChevronLeft className="w-3.5 h-3.5 text-foreground" />
          </button>
          <p className="font-bold text-sm text-foreground">{MONTH_NAMES_VN[month]} {year}</p>
          <button onClick={goNext} className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-secondary">
            <ChevronRight className="w-3.5 h-3.5 text-foreground" />
          </button>
        </div>
        <div className="grid grid-cols-7 mb-1">
          {DAY_HEADERS_VN.map(d => <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const isToday = day === todayDate;
            const hasBooking = role === "client" && clientBookings.includes(day);
            const isFull = role === "photographer" && fullDays.includes(day);
            const isAlmost = role === "photographer" && almostDays.includes(day);
            return (
              <div key={i} className="flex flex-col items-center py-0.5">
                <div
                  className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium cursor-pointer transition-colors ${
                    isFull ? "bg-red-100 text-red-600" :
                    isAlmost ? "bg-yellow-100 text-yellow-700" :
                    isToday ? "text-white font-bold" :
                    "text-foreground hover:bg-muted"
                  }`}
                  style={isToday && !isFull && !isAlmost ? { backgroundColor: "#0F6D6A" } : {}}
                >
                  {day}
                </div>
                {hasBooking && <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-0.5" />}
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-3 border-t border-border space-y-1.5">
          {role === "client" ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-green-500" /><span>Có lịch chụp hôm nay</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-3.5 h-3.5 rounded bg-red-100 border border-red-300 flex-shrink-0" /><span>Full lịch</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-3.5 h-3.5 rounded bg-yellow-100 border border-yellow-300 flex-shrink-0" /><span>Gần full lịch</span>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function MessagesPanel({ onClose }: { onClose: () => void }) {
  const msgs = [
    { id: 1, from: "Nguyễn Minh Tuấn", avatar: PHOTOGRAPHERS[0].avatar, text: "Cảm ơn bạn đã đặt lịch! Tôi sẽ liên hệ trước buổi chụp để confirm địa điểm.", time: "5 phút trước", unread: true },
    { id: 2, from: "Lê Thị Thu Hà", avatar: PHOTOGRAPHERS[1].avatar, text: "Bạn có thể cho tôi biết địa điểm chụp cụ thể được không ạ?", time: "1 giờ trước", unread: true },
    { id: 3, from: "Phạm Thị Lan", avatar: PHOTOGRAPHERS[3].avatar, text: "Ảnh đã chỉnh sửa xong rồi ạ, mình sẽ gửi link Google Drive cho bạn.", time: "2 ngày trước", unread: false },
  ];
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed z-50 bg-white border border-border rounded-2xl shadow-2xl overflow-hidden" style={{ top: 68, right: 186, width: 320 }}>
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-sm text-foreground">Tin nhắn</h3>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: "#0F6D6A" }}>2 mới</span>
        </div>
        {msgs.map(m => (
          <div key={m.id} className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 border-b border-border last:border-0 transition-colors" style={m.unread ? { backgroundColor: "rgba(15,109,106,0.03)" } : {}}>
            <img src={m.avatar} alt={m.from} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <p className={`text-sm truncate ${m.unread ? "font-bold text-foreground" : "font-semibold text-foreground"}`}>{m.from}</p>
                <p className="text-xs text-muted-foreground flex-shrink-0">{m.time}</p>
              </div>
              <p className="text-xs text-muted-foreground truncate">{m.text}</p>
            </div>
            {m.unread && <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: "#0F6D6A" }} />}
          </div>
        ))}
        <div className="px-4 py-2.5 text-center border-t border-border">
          <button className="text-xs font-semibold hover:underline" style={{ color: "#0F6D6A" }}>Xem tất cả tin nhắn</button>
        </div>
      </div>
    </>
  );
}

function NotifPanel({ onClose }: { onClose: () => void }) {
  const notifs = [
    { id: 1, type: "accept", color: "#16a34a", icon: CheckCircle, title: "Booking được chấp nhận! ✓", desc: "Nguyễn Minh Tuấn đã chấp nhận booking #B001 của bạn ngày 28/06/2025.", time: "5 phút trước", unread: true },
    { id: 2, type: "reject", color: "#dc2626", icon: X, title: "Booking bị từ chối", desc: "Hoàng Văn Nam không thể nhận booking ngày 10/05 vì đã kín lịch hoàn toàn.", time: "3 giờ trước", unread: true },
    { id: 3, type: "accept", color: "#16a34a", icon: CheckCircle, title: "Booking được xác nhận! ✓", desc: "Phạm Thị Lan đã xác nhận lịch chụp sự kiện của bạn vào 20/07/2025.", time: "1 ngày trước", unread: false },
    { id: 4, type: "photo", color: "#0F6D6A", icon: Image, title: "Ảnh đã sẵn sàng nhận", desc: "Bộ ảnh từ buổi chụp với Lê Thị Thu Hà ngày 15/06 đã được giao đầy đủ.", time: "3 ngày trước", unread: false },
  ];
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed z-50 bg-white border border-border rounded-2xl shadow-2xl overflow-hidden" style={{ top: 68, right: 24, width: 360 }}>
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-sm text-foreground">Thông báo</h3>
          <button className="text-xs font-medium hover:underline" style={{ color: "#0F6D6A" }}>Đánh dấu đã đọc</button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifs.map(n => (
            <div key={n.id} className={`flex items-start gap-3 px-4 py-3.5 border-b border-border last:border-0 cursor-pointer hover:bg-muted/30 transition-colors ${n.unread ? "" : "opacity-60"}`} style={n.unread ? { backgroundColor: "rgba(15,109,106,0.02)" } : {}}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${n.color}18` }}>
                <n.icon style={{ color: n.color, width: 18, height: 18 }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-bold leading-tight ${n.type === "reject" ? "text-red-600" : n.type === "accept" ? "text-green-700" : "text-foreground"}`}>{n.title}</p>
                  {n.unread && <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: "#0F6D6A" }} />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.desc}</p>
                <p className="text-xs text-muted-foreground mt-1.5">{n.time}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 py-2.5 text-center border-t border-border">
          <button className="text-xs font-semibold hover:underline" style={{ color: "#0F6D6A" }}>Xem tất cả thông báo</button>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// LAYOUT: NAVBAR
// ═══════════════════════════════════════════════════════════════

function Navbar({ authUser, logout, navigate, view }: { authUser: AuthUser | null; logout: () => void; navigate: Navigate; view: View }) {
  const role: Role = authUser?.role ?? "public";
  const [menuOpen, setMenuOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  const closeAll = () => { setShowCalendar(false); setShowMessages(false); setShowNotifs(false); };
  const toggleCalendar = () => { setShowCalendar(v => !v); setShowMessages(false); setShowNotifs(false); };
  const toggleMessages = () => { setShowMessages(v => !v); setShowCalendar(false); setShowNotifs(false); };
  const toggleNotifs = () => { setShowNotifs(v => !v); setShowCalendar(false); setShowMessages(false); };

  const clientNav = [
    { label: "Tìm kiếm", view: "search" as View },
    { label: "Đặt lịch của tôi", view: "history" as View },
    { label: "Yêu thích", view: "favorites" as View },
  ];
  const photoNav = [
    { label: "Dashboard", view: "photo-dashboard" as View },
    { label: "Portfolio", view: "portfolio" as View },
    { label: "Gói dịch vụ", view: "packages" as View },
    { label: "Đặt lịch", view: "photo-bookings" as View },
    { label: "Lịch", view: "schedule" as View },
    { label: "Doanh thu", view: "revenue" as View },
  ];
  const publicNav = [
    { label: "Tìm nhiếp ảnh gia", view: "search" as View },
    { label: "Giới thiệu", view: "about" as View },
    { label: "Liên hệ", view: "contact" as View },
  ];

  const navItems = role === "client" ? clientNav : role === "photographer" ? photoNav : publicNav;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <button onClick={() => { closeAll(); navigate("home"); }} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#0F6D6A" }}>
            <Camera className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight" style={{ color: "#0F6D6A" }}>Memento</span>
        </button>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => { closeAll(); navigate(item.view); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${view === item.view ? "text-primary bg-secondary" : "text-foreground hover:text-primary hover:bg-secondary"}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1.5">
          {authUser ? (
            <>
              {/* Calendar, Messages, Bell */}
              <button
                onClick={toggleCalendar}
                title="Xem lịch"
                className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${showCalendar ? "text-white" : "text-muted-foreground hover:text-primary hover:bg-secondary"}`}
                style={showCalendar ? { backgroundColor: "#0F6D6A" } : {}}
              >
                <Calendar className="w-5 h-5" />
              </button>
              <button
                onClick={toggleMessages}
                title="Tin nhắn"
                className={`relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${showMessages ? "text-white" : "text-muted-foreground hover:text-primary hover:bg-secondary"}`}
                style={showMessages ? { backgroundColor: "#0F6D6A" } : {}}
              >
                <MessageSquare className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500" />
              </button>
              <button
                onClick={toggleNotifs}
                title="Thông báo"
                className={`relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${showNotifs ? "text-white" : "text-muted-foreground hover:text-primary hover:bg-secondary"}`}
                style={showNotifs ? { backgroundColor: "#0F6D6A" } : {}}
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
              </button>

              {/* Avatar + greeting */}
              <button
                onClick={() => { closeAll(); navigate(role === "client" ? "client-profile" : "photo-profile"); }}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-secondary transition-colors ml-1"
              >
                <img
                  src={role === "client" ? "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop" : PHOTOGRAPHERS[0].avatar}
                  alt="avatar"
                  className="w-7 h-7 rounded-full object-cover"
                />
                <span className="text-sm font-medium text-foreground hidden sm:block">
                  Xin chào, {authUser.name.split(" ").pop()}
                </span>
              </button>

              {/* Logout */}
              <button
                onClick={() => { closeAll(); logout(); }}
                title="Đăng xuất"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:block">Đăng xuất</span>
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate("login")} className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
                Đăng nhập
              </button>
              <button onClick={() => navigate("register")} className="px-4 py-2 text-sm font-semibold text-white rounded-xl transition-colors hover:opacity-90" style={{ backgroundColor: "#0F6D6A" }}>
                Đăng ký
              </button>
            </>
          )}
          <button className="md:hidden w-9 h-9 flex items-center justify-center ml-1" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Popup panels */}
      {showCalendar && <CalendarPanel role={role} onClose={closeAll} />}
      {showMessages && <MessagesPanel onClose={closeAll} />}
      {showNotifs && <NotifPanel onClose={closeAll} />}

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-white px-6 py-4 flex flex-col gap-2">
          {navItems.map((item) => (
            <button key={item.view} onClick={() => { navigate(item.view); setMenuOpen(false); }} className="text-left px-4 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-secondary transition-colors">
              {item.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}

// ═══════════════════════════════════════════════════════════════
// LAYOUT: ADMIN SIDEBAR
// ═══════════════════════════════════════════════════════════════

const ADMIN_NAV = [
  { icon: BarChart2, label: "Dashboard", view: "admin-dashboard" as View, group: null },
  { icon: Users, label: "Người dùng", view: "admin-users" as View, group: "Quản lý" },
  { icon: Camera, label: "Nhiếp ảnh gia", view: "admin-photographers" as View, group: null },
  { icon: CheckCircle, label: "Duyệt hồ sơ", view: "admin-approval" as View, group: null },
  { icon: BookOpen, label: "Booking", view: "admin-bookings" as View, group: "Nội dung" },
  { icon: Star, label: "Đánh giá", view: "admin-reviews" as View, group: null },
  { icon: Tag, label: "Danh mục", view: "admin-categories" as View, group: null },
  { icon: TrendingUp, label: "Thống kê", view: "admin-reports" as View, group: "Báo cáo" },
  { icon: Settings, label: "Cài đặt", view: "admin-settings" as View, group: "Hệ thống" },
];

function AdminSidebar({ navigate, view, authUser, logout }: { navigate: Navigate; view: View; authUser: AuthUser | null; logout: () => void }) {
  let lastGroup: string | null = undefined as unknown as string | null;
  return (
    <aside className="w-60 flex-shrink-0 flex flex-col h-screen overflow-y-auto" style={{ backgroundColor: "#0A4F4D" }}>
      <div className="px-5 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
            <Camera className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-base leading-none">Memento</p>
            <p className="text-xs mt-0.5" style={{ color: "#7EE6D8" }}>Admin Panel</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {ADMIN_NAV.map((item) => {
          const showDivider = item.group !== null && item.group !== lastGroup;
          if (showDivider) lastGroup = item.group;
          const active = view === item.view;
          return (
            <div key={item.view}>
              {showDivider && (
                <p className="px-3 pt-4 pb-1.5 text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(126,230,216,0.5)" }}>
                  {item.group}
                </p>
              )}
              <button
                onClick={() => navigate(item.view)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? "text-white" : "text-white/60 hover:text-white hover:bg-white/5"}`}
                style={active ? { backgroundColor: "rgba(126,230,216,0.2)", color: "#7EE6D8" } : {}}
              >
                <item.icon className="w-4.5 h-4.5 flex-shrink-0" style={{ width: 18, height: 18 }} />
                {item.label}
              </button>
            </div>
          );
        })}
      </nav>

      <div className="px-3 pb-4 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="mt-4 px-3 py-2.5 rounded-xl flex items-center gap-3">
          <img src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=80&h=80&fit=crop" alt="admin" className="w-8 h-8 rounded-full object-cover" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{authUser?.name ?? "Quản trị viên"}</p>
            <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.5)" }}>{authUser?.email ?? "admin@memento.vn"}</p>
          </div>
          <button onClick={logout} title="Đăng xuất" className="hover:text-red-300 transition-colors">
            <LogOut className="w-4 h-4 text-white/40 hover:text-red-300 flex-shrink-0" />
          </button>
        </div>
      </div>
    </aside>
  );
}

// ═══════════════════════════════════════════════════════════════
// LAYOUT: FOOTER
// ═══════════════════════════════════════════════════════════════

function Footer({ navigate }: { navigate: Navigate }) {
  return (
    <footer className="bg-foreground text-white mt-20">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#7EE6D8" }}>
                <Camera className="w-4 h-4" style={{ color: "#0A4F4D" }} />
              </div>
              <span className="font-bold text-xl">Memento</span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed mb-5">Where Moments Become Memories. Kết nối khách hàng với nhiếp ảnh gia chuyên nghiệp trên toàn Việt Nam.</p>
            <div className="flex gap-3">
              {[Camera, MessageSquare, Globe].map((Icon, i) => (
                <button key={i} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <Icon className="w-4 h-4 text-white/70" />
                </button>
              ))}
            </div>
          </div>
          {[
            { title: "Khám phá", links: ["Tìm nhiếp ảnh gia", "Danh mục dịch vụ", "Nhiếp ảnh gia nổi bật", "Blog"] },
            { title: "Hỗ trợ", links: ["Trung tâm trợ giúp", "Điều khoản dịch vụ", "Chính sách bảo mật", "Liên hệ"] },
            { title: "Nhiếp ảnh gia", links: ["Đăng ký chụp", "Quản lý booking", "Chính sách thanh toán", "Hướng dẫn"] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-semibold text-sm mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}><button className="text-sm text-white/50 hover:text-white transition-colors">{l}</button></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/40">© 2025 Memento. Đã đăng ký bản quyền.</p>
          <p className="text-xs text-white/40">Được tin dùng bởi 12,000+ khách hàng trên toàn Việt Nam</p>
        </div>
      </div>
    </footer>
  );
}


// ═══════════════════════════════════════════════════════════════
// HOME PAGE
// ═══════════════════════════════════════════════════════════════

function HomePage({ navigate }: { navigate: Navigate }) {
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("Tất cả");
  const categories = [
    { label: "Đám cưới", img: "https://images.unsplash.com/photo-1546032996-6dfacbacbf3f?w=400&h=300&fit=crop", count: 124 },
    { label: "Chân dung", img: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=300&fit=crop", count: 89 },
    { label: "Sự kiện", img: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop", count: 67 },
    { label: "Phong cảnh", img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop", count: 45 },
    { label: "Gia đình", img: "https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=400&h=300&fit=crop", count: 78 },
    { label: "Thương mại", img: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400&h=300&fit=crop", count: 52 },
  ];

  const testimonials = [
    { name: "Nguyễn Thị Mai", role: "Cô dâu hạnh phúc", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop", text: "Memento giúp tôi tìm được nhiếp ảnh gia cưới hoàn hảo chỉ trong vài phút. Ảnh cưới đẹp đến mức tôi không thể tin đó là thật!", rating: 5 },
    { name: "Trần Văn Hùng", role: "Giám đốc Marketing", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop", text: "Nền tảng chuyên nghiệp, nhiếp ảnh gia chất lượng cao. Chúng tôi đã sử dụng Memento cho hơn 20 sự kiện doanh nghiệp.", rating: 5 },
    { name: "Lê Thị Hoa", role: "Mẹ bỉm sữa", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop", text: "Tôi yêu thích sự minh bạch về giá cả và đánh giá thực tế. Những bức ảnh gia đình của chúng tôi rất đẹp và ý nghĩa.", rating: 5 },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[88vh] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1519741196428-6a2175fa2557?w=1920&h=1080&fit=crop&auto=format"
          alt="Photography hero"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(10,30,30,0.6) 0%, rgba(10,30,30,0.5) 50%, rgba(10,30,30,0.75) 100%)" }} />

        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center text-white px-4">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" style={{ color: "#7EE6D8" }} />
            <span>Nền tảng nhiếp ảnh #1 Việt Nam</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight max-w-3xl">
            Khoảnh Khắc Đáng Nhớ<br />
            <span style={{ color: "#7EE6D8" }}>Bắt Đầu Từ Đây</span>
          </h1>
          <p className="text-lg text-white/80 mb-10 max-w-xl font-light">
            Kết nối với hàng nghìn nhiếp ảnh gia chuyên nghiệp. Đặt lịch dễ dàng, an toàn và nhanh chóng.
          </p>

          {/* Search bar */}
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-2 flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center gap-3 px-4 py-2">
              <MapPin className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Thành phố hoặc địa điểm..."
                className="flex-1 text-sm text-foreground placeholder-muted-foreground outline-none bg-transparent"
              />
            </div>
            <div className="flex items-center gap-3 px-4 py-2 border-t sm:border-t-0 sm:border-l border-border">
              <Camera className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
              <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="flex-1 text-sm text-foreground outline-none bg-transparent cursor-pointer">
                <option>Tất cả</option>
                <option>Wedding</option>
                <option>Portrait</option>
                <option>Events</option>
                <option>Landscape</option>
              </select>
            </div>
            <button
              onClick={() => navigate("search")}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-opacity hover:opacity-90 text-sm"
              style={{ backgroundColor: "#0F6D6A" }}
            >
              <Search className="w-4 h-4" /> Tìm kiếm
            </button>
          </div>

          {/* Quick tags */}
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {["Ảnh cưới", "Chân dung", "Gia đình", "Sự kiện"].map((t) => (
              <button key={t} onClick={() => navigate("search")} className="px-3 py-1 rounded-full text-xs font-medium text-white/80 border border-white/20 hover:border-white/60 hover:text-white transition-colors">
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/10 backdrop-blur-md border-t border-white/10">
          <div className="max-w-5xl mx-auto px-6 py-4 grid grid-cols-3 gap-4">
            {[
              { value: "1,200+", label: "Nhiếp ảnh gia" },
              { value: "15,000+", label: "Buổi chụp" },
              { value: "98%", label: "Hài lòng" },
            ].map((s) => (
              <div key={s.label} className="text-center text-white">
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-white/70">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "#0F6D6A" }}>Danh mục dịch vụ</p>
          <h2 className="text-3xl font-bold text-foreground mb-3">Tìm phong cách phù hợp</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">Từ ảnh cưới lãng mạn đến chụp ảnh thương mại chuyên nghiệp — chúng tôi có tất cả.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((c) => (
            <button key={c.label} onClick={() => navigate("search")} className="group relative rounded-2xl overflow-hidden h-40 cursor-pointer">
              <img src={c.img} alt={c.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10" />
              <div className="absolute bottom-0 left-0 right-0 p-3 text-white text-left">
                <p className="font-semibold text-sm">{c.label}</p>
                <p className="text-xs text-white/70">{c.count} NÀG</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Featured photographers */}
      <section className="py-20" style={{ backgroundColor: "#EEF8F7" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "#0F6D6A" }}>Nổi bật</p>
              <h2 className="text-3xl font-bold text-foreground">Nhiếp ảnh gia được yêu thích</h2>
            </div>
            <button onClick={() => navigate("search")} className="hidden md:flex items-center gap-2 text-sm font-semibold hover:gap-3 transition-all" style={{ color: "#0F6D6A" }}>
              Xem tất cả <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PHOTOGRAPHERS.slice(0, 4).map((p) => (
              <PhotographerCard key={p.id} p={p} navigate={navigate} favs={new Set()} toggleFav={() => {}} />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "#0F6D6A" }}>Đơn giản & nhanh chóng</p>
          <h2 className="text-3xl font-bold text-foreground">Đặt lịch trong 3 bước</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-px" style={{ backgroundColor: "#7EE6D8" }} />
          {[
            { step: "01", icon: Search, title: "Tìm kiếm", desc: "Lọc theo địa điểm, phong cách và ngân sách để tìm nhiếp ảnh gia phù hợp nhất với bạn." },
            { step: "02", icon: Calendar, title: "Đặt lịch", desc: "Chọn gói dịch vụ, ngày giờ và điền thông tin sự kiện. Xác nhận chỉ trong vài giây." },
            { step: "03", icon: Image, title: "Nhận ảnh đẹp", desc: "Nhiếp ảnh gia đến đúng giờ, chụp xuất sắc và giao ảnh đã chỉnh sửa đúng hẹn." },
          ].map((s) => (
            <div key={s.step} className="relative flex flex-col items-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-lg" style={{ backgroundColor: "#0F6D6A" }}>
                <s.icon className="w-7 h-7 text-white" />
              </div>
              <div className="absolute top-6 right-6 text-5xl font-black opacity-5 text-foreground">{s.step}</div>
              <h3 className="text-lg font-bold text-foreground mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="mx-6 mb-10 rounded-3xl overflow-hidden relative">
        <img src="https://images.unsplash.com/photo-1593106584374-89259e7efb8b?w=1400&h=400&fit=crop&auto=format" alt="CTA" className="w-full h-72 object-cover" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4" style={{ background: "rgba(10,79,77,0.82)" }}>
          <h2 className="text-3xl font-bold mb-3">Bạn là nhiếp ảnh gia?</h2>
          <p className="text-white/80 mb-7 max-w-md">Tham gia Memento — kết nối với hàng nghìn khách hàng tiềm năng và phát triển sự nghiệp của bạn.</p>
          <button onClick={() => navigate("register")} className="px-8 py-3.5 rounded-xl font-bold text-foreground transition-opacity hover:opacity-90" style={{ backgroundColor: "#7EE6D8" }}>
            Bắt đầu ngay — Miễn phí
          </button>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "#0F6D6A" }}>Đánh giá thực tế</p>
          <h2 className="text-3xl font-bold text-foreground">Khách hàng nói gì về chúng tôi</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-card rounded-2xl p-6 border border-border shadow-sm">
              <Stars rating={t.rating} size="md" />
              <p className="text-sm text-foreground leading-relaxed mt-4 mb-5 italic">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// AUTH PAGES
// ═══════════════════════════════════════════════════════════════

function AuthShell({ title, subtitle, children, navigate, altLink, altText, altAction }: {
  title: string; subtitle: string; children: React.ReactNode;
  navigate: Navigate; altLink: string; altText: string; altAction: View;
}) {
  return (
    <div className="min-h-[calc(100vh-64px)] flex">
      <div className="hidden lg:block flex-1 relative">
        <img src="https://images.unsplash.com/photo-1546032996-6dfacbacbf3f?w=900&h=1200&fit=crop&auto=format" alt="auth" className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex flex-col justify-end p-12" style={{ background: "linear-gradient(to top, rgba(10,79,77,0.9) 0%, transparent 60%)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Camera className="w-6 h-6" style={{ color: "#7EE6D8" }} />
            <span className="text-white font-bold text-xl">Memento</span>
          </div>
          <p className="text-white/80 text-sm italic max-w-xs">"Where Moments Become Memories" — nền tảng đặt lịch nhiếp ảnh gia hàng đầu Việt Nam.</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#0F6D6A" }}>
                <Camera className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-2xl" style={{ color: "#0F6D6A" }}>Memento</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-1">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
          <p className="text-center text-sm text-muted-foreground mt-6">
            {altLink}{" "}
            <button onClick={() => navigate(altAction)} className="font-semibold hover:underline" style={{ color: "#0F6D6A" }}>{altText}</button>
          </p>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, type = "text", placeholder, icon: Icon }: { label: string; type?: string; placeholder: string; icon?: React.ElementType }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />}
        <input type={type} placeholder={placeholder} className="w-full border border-border rounded-xl py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition-all focus:border-primary focus:ring-2" style={{ paddingLeft: Icon ? "2.75rem" : "1rem", paddingRight: "1rem", backgroundColor: "#EEF7F7" }} />
      </div>
    </div>
  );
}

function LoginPage({ navigate, onLogin }: { navigate: Navigate; onLogin: (email: string, password: string) => boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      const ok = onLogin(email.trim(), password);
      if (!ok) setError("Email hoặc mật khẩu không đúng. Vui lòng thử lại.");
      setLoading(false);
    }, 400);
  };

  return (
    <AuthShell title="Chào mừng trở lại" subtitle="Đăng nhập để tiếp tục hành trình của bạn" navigate={navigate} altLink="Chưa có tài khoản?" altText="Đăng ký ngay" altAction="register">
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
                className="w-full border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-foreground placeholder-muted-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                style={{ backgroundColor: "#EEF7F7" }}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full border border-border rounded-xl py-3 px-4 text-sm text-foreground placeholder-muted-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              style={{ backgroundColor: "#EEF7F7" }}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded" />
              <span className="text-muted-foreground">Ghi nhớ đăng nhập</span>
            </label>
            <button type="button" onClick={() => navigate("forgot")} className="font-medium hover:underline" style={{ color: "#0F6D6A" }}>Quên mật khẩu?</button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-semibold transition-opacity hover:opacity-90 text-sm"
            style={{ backgroundColor: "#0F6D6A", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <div className="relative flex items-center gap-3">
          <div className="flex-1 h-px bg-border" /><span className="text-xs text-muted-foreground">hoặc</span><div className="flex-1 h-px bg-border" />
        </div>
        <button className="w-full py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors flex items-center justify-center gap-2">
          <Globe className="w-4 h-4" /> Tiếp tục với Google
        </button>
      </div>
    </AuthShell>
  );
}

function RegisterPage({ navigate }: { navigate: Navigate }) {
  const [role, setRole] = useState<"client" | "photographer">("client");
  return (
    <AuthShell title="Tạo tài khoản" subtitle="Tham gia cộng đồng Memento ngay hôm nay" navigate={navigate} altLink="Đã có tài khoản?" altText="Đăng nhập" altAction="login">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
          {(["client", "photographer"] as const).map((r) => (
            <button key={r} onClick={() => setRole(r)} className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${role === r ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              {r === "client" ? "Khách hàng" : "Nhiếp ảnh gia"}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Họ" placeholder="Nguyễn" />
          <InputField label="Tên" placeholder="Văn A" />
        </div>
        <InputField label="Email" type="email" placeholder="email@example.com" icon={Mail} />
        <InputField label="Số điện thoại" placeholder="0912 345 678" icon={Phone} />
        <InputField label="Mật khẩu" type="password" placeholder="Tối thiểu 8 ký tự" />
        <button onClick={() => navigate("login")} className="w-full py-3 rounded-xl text-white font-semibold transition-opacity hover:opacity-90 text-sm" style={{ backgroundColor: "#0F6D6A" }}>
          Đăng ký & Tiếp tục
        </button>
        <p className="text-xs text-center text-muted-foreground">Bằng cách đăng ký, bạn đồng ý với <span className="underline cursor-pointer">Điều khoản dịch vụ</span> và <span className="underline cursor-pointer">Chính sách bảo mật</span> của chúng tôi.</p>
      </div>
    </AuthShell>
  );
}

function ForgotPage({ navigate }: { navigate: Navigate }) {
  const [sent, setSent] = useState(false);
  return (
    <AuthShell title="Khôi phục mật khẩu" subtitle="Nhập email để nhận link đặt lại mật khẩu" navigate={navigate} altLink="Nhớ mật khẩu rồi?" altText="Đăng nhập" altAction="login">
      {sent ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "rgba(15,109,106,0.1)" }}>
            <CheckCircle className="w-8 h-8" style={{ color: "#0F6D6A" }} />
          </div>
          <h3 className="font-bold text-lg text-foreground mb-2">Email đã gửi!</h3>
          <p className="text-sm text-muted-foreground">Kiểm tra hộp thư và làm theo hướng dẫn để đặt lại mật khẩu.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <InputField label="Email" type="email" placeholder="email@example.com" icon={Mail} />
          <button onClick={() => setSent(true)} className="w-full py-3 rounded-xl text-white font-semibold transition-opacity hover:opacity-90 text-sm" style={{ backgroundColor: "#0F6D6A" }}>
            Gửi link khôi phục
          </button>
        </div>
      )}
    </AuthShell>
  );
}

// ═══════════════════════════════════════════════════════════════
// CLIENT: DASHBOARD
// ═══════════════════════════════════════════════════════════════

function ClientDashboard({ navigate }: { navigate: Navigate }) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Welcome */}
      <div className="rounded-2xl overflow-hidden relative mb-8 h-36">
        <img src="https://images.unsplash.com/photo-1546032996-6dfacbacbf3f?w=1200&h=300&fit=crop&auto=format" alt="welcome" className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center px-8" style={{ background: "linear-gradient(to right, rgba(10,79,77,0.92) 0%, rgba(10,79,77,0.5) 100%)" }}>
          <div>
            <p className="text-white/70 text-sm mb-1">Xin chào trở lại 👋</p>
            <h1 className="text-2xl font-bold text-white">Nguyễn Minh Châu</h1>
            <p className="text-sm mt-1" style={{ color: "#7EE6D8" }}>Bạn có 1 buổi chụp sắp tới vào ngày 28/06</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon={BookOpen} label="Tổng đặt lịch" value="5" sub="+2 tháng này" />
        <StatCard icon={Heart} label="Yêu thích" value="8" color="#e11d48" />
        <StatCard icon={DollarSign} label="Đã chi tiêu" value="9.8M đ" color="#d97706" />
      </div>

      {/* Upcoming bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg text-foreground">Đặt lịch sắp tới</h2>
            <button onClick={() => navigate("history")} className="text-sm font-medium" style={{ color: "#0F6D6A" }}>Xem tất cả →</button>
          </div>
          <div className="space-y-3">
            {BOOKINGS.filter((b) => b.status === "upcoming" || b.status === "pending").map((b) => (
              <div key={b.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                <img src={b.photographer.portfolio[0]} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground">{b.photographer.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{b.photographer.specialty} • Gói {b.package}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{b.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{b.time}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{b.location}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <StatusBadge status={b.status} />
                  <p className="text-sm font-bold mt-1.5" style={{ color: "#0F6D6A" }}>{fmtVND(b.price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg text-foreground">Gợi ý cho bạn</h2>
          </div>
          <div className="space-y-3">
            {PHOTOGRAPHERS.slice(1, 4).map((p) => (
              <div key={p.id} className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3 cursor-pointer hover:shadow-sm transition-shadow" onClick={() => navigate("photographer-profile", { id: p.id })}>
                <img src={p.portfolio[0]} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.specialty}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Stars rating={p.rating} />
                    <span className="text-xs text-muted-foreground">({p.reviews})</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </div>
            ))}
            <button onClick={() => navigate("search")} className="w-full py-2.5 border border-border rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors">
              Tìm thêm nhiếp ảnh gia →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CLIENT: SEARCH PAGE
// ═══════════════════════════════════════════════════════════════

function SearchPage({ navigate }: { navigate: Navigate }) {
  const [favs, setFavs] = useState<Set<number>>(new Set());
  const [filterSpec, setFilterSpec] = useState("Tất cả");
  const [filterLoc, setFilterLoc] = useState("Tất cả");
  const [sortBy, setSortBy] = useState("rating");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const toggleFav = (id: number) => {
    setFavs((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };

  const specs = ["Tất cả", "Wedding", "Portrait", "Events", "Landscape", "Family", "Street"];
  const locs = ["Tất cả", "Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng"];

  const filtered = PHOTOGRAPHERS.filter((p) => {
    const matchSpec = filterSpec === "Tất cả" || p.tags.some((t) => t.includes(filterSpec)) || p.specialty.includes(filterSpec);
    const matchLoc = filterLoc === "Tất cả" || p.location === filterLoc;
    return matchSpec && matchLoc;
  }).sort((a, b) => sortBy === "rating" ? b.rating - a.rating : sortBy === "price_asc" ? a.price - b.price : b.price - a.price);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">Tìm nhiếp ảnh gia</h1>
        <p className="text-muted-foreground text-sm">{filtered.length} nhiếp ảnh gia phù hợp với bộ lọc của bạn</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters sidebar */}
        <aside className="lg:w-56 flex-shrink-0">
          <div className="bg-card border border-border rounded-2xl p-5 sticky top-24">
            <div className="flex items-center gap-2 mb-5">
              <Filter className="w-4 h-4" style={{ color: "#0F6D6A" }} />
              <h3 className="font-semibold text-sm text-foreground">Bộ lọc</h3>
            </div>

            <div className="mb-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Phong cách</p>
              <div className="space-y-1.5">
                {specs.map((s) => (
                  <button key={s} onClick={() => setFilterSpec(s)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${filterSpec === s ? "font-semibold text-white" : "text-foreground hover:bg-secondary"}`} style={filterSpec === s ? { backgroundColor: "#0F6D6A" } : {}}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Địa điểm</p>
              <div className="space-y-1.5">
                {locs.map((l) => (
                  <button key={l} onClick={() => setFilterLoc(l)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${filterLoc === l ? "font-semibold text-white" : "text-foreground hover:bg-secondary"}`} style={filterLoc === l ? { backgroundColor: "#0F6D6A" } : {}}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Đánh giá tối thiểu</p>
              <div className="flex gap-1">
                {[4, 4.5, 4.8].map((r) => (
                  <button key={r} className="flex-1 py-1.5 text-xs rounded-lg border border-border hover:bg-secondary transition-colors text-foreground">{r}+</button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setViewMode("grid")} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${viewMode === "grid" ? "bg-primary text-white" : "border border-border text-muted-foreground hover:bg-secondary"}`}>
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode("list")} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${viewMode === "list" ? "bg-primary text-white" : "border border-border text-muted-foreground hover:bg-secondary"}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none bg-card cursor-pointer">
              <option value="rating">Đánh giá cao nhất</option>
              <option value="price_asc">Giá thấp → cao</option>
              <option value="price_desc">Giá cao → thấp</option>
            </select>
          </div>

          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((p) => (
                <PhotographerCard key={p.id} p={p} navigate={navigate} favs={favs} toggleFav={toggleFav} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((p) => (
                <div key={p.id} className="bg-card border border-border rounded-2xl p-4 flex gap-4 hover:shadow-sm transition-shadow cursor-pointer" onClick={() => navigate("photographer-profile", { id: p.id })}>
                  <img src={p.portfolio[0]} alt={p.name} className="w-28 h-28 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-foreground">{p.name}</p>
                          {p.verified && <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#0F6D6A" }} />}
                        </div>
                        <p className="text-sm text-muted-foreground">{p.specialty}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); toggleFav(p.id); }} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-secondary flex-shrink-0">
                        <Heart className={`w-4 h-4 ${favs.has(p.id) ? "fill-rose-500 text-rose-500" : "text-muted-foreground"}`} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.location}</span>
                      <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{p.completedJobs} buổi</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Phản hồi {p.responseTime}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Stars rating={p.rating} />
                      <span className="text-sm font-semibold">{p.rating}</span>
                      <span className="text-xs text-muted-foreground">({p.reviews} đánh giá)</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {p.tags.map((t) => (
                        <span key={t} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "rgba(15,109,106,0.08)", color: "#0F6D6A" }}>{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 flex flex-col items-end justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Từ</p>
                      <p className="text-lg font-bold" style={{ color: "#0F6D6A" }}>{fmtVND(p.price)}</p>
                    </div>
                    <button className="px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity" style={{ backgroundColor: "#0F6D6A" }}
                      onClick={(e) => { e.stopPropagation(); navigate("booking", { photographerId: p.id }); }}>
                      Đặt lịch
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CLIENT: PHOTOGRAPHER PROFILE
// ═══════════════════════════════════════════════════════════════

function PhotographerProfilePage({ navigate, photographerId }: { navigate: Navigate; photographerId: number }) {
  const p = PHOTOGRAPHERS.find((x) => x.id === photographerId) ?? PHOTOGRAPHERS[0];
  const [tab, setTab] = useState<"portfolio" | "packages" | "reviews">("portfolio");
  const [selectedImg, setSelectedImg] = useState<string | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <button onClick={() => navigate("search")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Quay lại tìm kiếm
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Cover / portfolio hero */}
          <div className="relative h-72 rounded-2xl overflow-hidden mb-6 group bg-muted">
            <img src={p.portfolio[0]} alt={p.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>

          {/* Photographer info */}
          <div className="flex flex-col sm:flex-row items-start gap-4 mb-6">
            <img src={p.avatar} alt={p.name} className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-2xl font-bold text-foreground">{p.name}</h1>
                {p.verified && (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: "rgba(15,109,106,0.1)", color: "#0F6D6A" }}>
                    <CheckCircle className="w-3 h-3" /> Đã xác minh
                  </span>
                )}
              </div>
              <p className="text-muted-foreground mb-2">{p.specialty}</p>
              <div className="flex items-center flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{p.location}</span>
                <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{p.completedJobs} buổi hoàn thành</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />Phản hồi {p.responseTime}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Stars rating={p.rating} size="md" />
                <span className="font-bold text-foreground">{p.rating}</span>
                <span className="text-muted-foreground text-sm">({p.reviews} đánh giá)</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {p.tags.map((t) => (
              <span key={t} className="text-sm px-3 py-1 rounded-full font-medium" style={{ backgroundColor: "rgba(15,109,106,0.08)", color: "#0F6D6A" }}>{t}</span>
            ))}
          </div>

          {/* Bio */}
          <div className="bg-card border border-border rounded-2xl p-5 mb-6">
            <h3 className="font-semibold text-foreground mb-2">Giới thiệu</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{p.bio}</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 border-b border-border">
            {(["portfolio", "packages", "reviews"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                {t === "portfolio" ? "Portfolio" : t === "packages" ? "Gói dịch vụ" : "Đánh giá"}
              </button>
            ))}
          </div>

          {tab === "portfolio" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {p.portfolio.map((img, i) => (
                <button key={i} className="relative aspect-square rounded-xl overflow-hidden bg-muted group" onClick={() => setSelectedImg(img)}>
                  <img src={img} alt={`Portfolio ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {tab === "packages" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {PACKAGES.map((pkg) => (
                <div key={pkg.id} className={`bg-card border rounded-2xl p-5 relative ${pkg.popular ? "border-primary shadow-md" : "border-border"}`}>
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: "#0F6D6A" }}>
                      Phổ biến nhất
                    </div>
                  )}
                  <h3 className="font-bold text-foreground text-lg mb-1">{pkg.name}</h3>
                  <p className="text-2xl font-bold mb-4" style={{ color: "#0F6D6A" }}>{fmtVND(pkg.price)}</p>
                  <ul className="space-y-2 mb-5">
                    {[
                      `${pkg.duration} chụp`,
                      `${pkg.photos} ảnh gốc`,
                      `${pkg.edits} ảnh chỉnh sửa`,
                      "Giao ảnh trong 7 ngày",
                    ].map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                        <Check className="w-4 h-4 flex-shrink-0" style={{ color: "#0F6D6A" }} />{f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => navigate("booking", { photographerId: p.id, packageId: pkg.id })} className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 ${pkg.popular ? "text-white" : "border border-primary text-primary hover:bg-secondary"}`} style={pkg.popular ? { backgroundColor: "#0F6D6A" } : {}}>
                    Chọn gói này
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === "reviews" && (
            <div className="space-y-4">
              {REVIEWS.map((r) => (
                <div key={r.id} className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <img src={r.avatar} alt={r.author} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <p className="font-semibold text-sm text-foreground">{r.author}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{r.date}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(15,109,106,0.08)", color: "#0F6D6A" }}>Gói {r.package}</span>
                        </div>
                      </div>
                      <Stars rating={r.rating} />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{r.comment}</p>
                </div>
              ))}

              {/* View all reviews button */}
              <div className="text-center pt-2">
                <button
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-semibold text-sm border-2 transition-all hover:bg-secondary"
                  style={{ borderColor: "#0F6D6A", color: "#0F6D6A" }}
                >
                  <MessageSquare className="w-4 h-4" />
                  Xem tất cả {p.reviews} đánh giá
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sticky booking card */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-card border border-border rounded-2xl p-6 shadow-sm">
            <p className="text-sm text-muted-foreground mb-1">Bắt đầu từ</p>
            <p className="text-3xl font-bold mb-4" style={{ color: "#0F6D6A" }}>{fmtVND(p.price)}</p>
            <button onClick={() => navigate("booking", { photographerId: p.id })} className="w-full py-3.5 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity mb-3" style={{ backgroundColor: "#0F6D6A" }}>
              Đặt lịch ngay
            </button>
            <button className="w-full py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors flex items-center justify-center gap-2">
              <MessageSquare className="w-4 h-4" /> Nhắn tin
            </button>
            <div className="mt-5 pt-5 border-t border-border space-y-3">
              {[
                { icon: Calendar, label: "Lịch trống", val: "Xem lịch" },
                { icon: Clock, label: "Thời gian phản hồi", val: p.responseTime },
                { icon: CheckCircle, label: "Tỷ lệ hoàn thành", val: "99%" },
                { icon: Award, label: "Năm kinh nghiệm", val: "8+" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground"><item.icon className="w-4 h-4" />{item.label}</span>
                  <span className="font-medium text-foreground">{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {selectedImg && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedImg(null)}>
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
            <X className="w-5 h-5" />
          </button>
          <img src={selectedImg.replace("w=600&h=600", "w=1200&h=900")} alt="preview" className="max-w-full max-h-[85vh] rounded-xl object-contain" />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CLIENT: BOOKING PAGE
// ═══════════════════════════════════════════════════════════════

function BookingPage({ navigate, photographerId }: { navigate: Navigate; photographerId: number }) {
  const p = PHOTOGRAPHERS.find((x) => x.id === photographerId) ?? PHOTOGRAPHERS[0];
  const [step, setStep] = useState(1);
  const [selectedPkg, setSelectedPkg] = useState(1);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [calMonth, setCalMonth] = useState(5); // June 2025
  const [calYear, setCalYear] = useState(2025);
  const [time, setTime] = useState("");

  const pkg = PACKAGES.find((pk) => pk.id === selectedPkg)!;

  // Availability data for this photographer's calendar
  const BK_FULL_DAYS = [15, 22]; // red — no slots
  const BK_ALMOST_DAYS = [18, 25, 27]; // yellow — few slots left
  const BK_BOOKED_TIMES: Record<number, string[]> = {
    18: ["07:00", "08:00", "14:00"],
    25: ["08:00", "09:00", "10:00", "15:00"],
    27: ["07:00", "08:00", "09:00", "10:00", "11:00"],
  };
  const ALL_TIME_SLOTS = ["07:00", "08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];

  const bkFirstDay = new Date(calYear, calMonth, 1).getDay();
  const bkAdjFirst = bkFirstDay === 0 ? 6 : bkFirstDay - 1;
  const bkDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const bkCells: (number | null)[] = [];
  for (let i = 0; i < bkAdjFirst; i++) bkCells.push(null);
  for (let d = 1; d <= bkDaysInMonth; d++) bkCells.push(d);

  const bkGoPrev = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); };
  const bkGoNext = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); };

  const steps = ["Chọn dịch vụ", "Thông tin sự kiện", "Xác nhận & thanh toán"];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <button onClick={() => navigate("photographer-profile", { id: p.id })} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ChevronLeft className="w-4 h-4" /> Quay lại hồ sơ
      </button>

      <h1 className="text-2xl font-bold text-foreground mb-6">Đặt lịch chụp ảnh</h1>

      {/* Stepper */}
      <div className="flex items-center mb-10">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${step > i + 1 ? "text-white" : step === i + 1 ? "text-white" : "border-2 border-border text-muted-foreground bg-card"}`} style={step >= i + 1 ? { backgroundColor: "#0F6D6A" } : {}}>
              {step > i + 1 ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <div className="ml-2 mr-4 hidden sm:block">
              <p className={`text-xs font-semibold ${step === i + 1 ? "text-primary" : "text-muted-foreground"}`}>{s}</p>
            </div>
            {i < steps.length - 1 && <div className="flex-1 h-px mx-2" style={{ backgroundColor: step > i + 1 ? "#0F6D6A" : "#e0eeee" }} />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {step === 1 && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-bold text-lg text-foreground mb-5">Chọn gói dịch vụ</h2>
              <div className="space-y-3 mb-6">
                {PACKAGES.map((pk) => (
                  <button key={pk.id} onClick={() => setSelectedPkg(pk.id)} className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedPkg === pk.id ? "border-primary" : "border-border hover:border-primary/30"}`} style={selectedPkg === pk.id ? { backgroundColor: "rgba(15,109,106,0.04)" } : {}}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedPkg === pk.id ? "border-primary" : "border-border"}`}>
                          {selectedPkg === pk.id && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#0F6D6A" }} />}
                        </div>
                        <span className="font-bold text-foreground">{pk.name}</span>
                        {pk.popular && <span className="text-xs px-2 py-0.5 rounded-full text-white font-semibold" style={{ backgroundColor: "#0F6D6A" }}>Phổ biến</span>}
                      </div>
                      <span className="font-bold" style={{ color: "#0F6D6A" }}>{fmtVND(pk.price)}</span>
                    </div>
                    <div className="flex gap-4 pl-6 text-xs text-muted-foreground">
                      <span>{pk.duration} chụp</span>
                      <span>{pk.photos} ảnh gốc</span>
                      <span>{pk.edits} ảnh chỉnh sửa</span>
                    </div>
                  </button>
                ))}
              </div>

              <h3 className="font-semibold text-foreground mb-3">Chọn ngày chụp</h3>
              {/* Visual calendar */}
              <div className="border border-border rounded-xl p-4 mb-5" style={{ backgroundColor: "#F9FDFD" }}>
                <div className="flex items-center justify-between mb-3">
                  <button onClick={bkGoPrev} className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-secondary bg-white">
                    <ChevronLeft className="w-3.5 h-3.5 text-foreground" />
                  </button>
                  <p className="font-bold text-sm text-foreground">{MONTH_NAMES_VN[calMonth]} {calYear}</p>
                  <button onClick={bkGoNext} className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-secondary bg-white">
                    <ChevronRight className="w-3.5 h-3.5 text-foreground" />
                  </button>
                </div>
                <div className="grid grid-cols-7 mb-1">
                  {DAY_HEADERS_VN.map(d => <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-0.5">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-y-0.5">
                  {bkCells.map((day, i) => {
                    if (!day) return <div key={i} />;
                    const isFull = BK_FULL_DAYS.includes(day);
                    const isAlmost = BK_ALMOST_DAYS.includes(day);
                    const isSelected = selectedDay === day;
                    return (
                      <button
                        key={i}
                        disabled={isFull}
                        onClick={() => { setSelectedDay(day); setTime(""); }}
                        className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full text-sm font-medium transition-all ${
                          isSelected ? "text-white font-bold shadow-sm" :
                          isFull ? "bg-red-100 text-red-400 cursor-not-allowed" :
                          isAlmost ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 cursor-pointer" :
                          "text-foreground hover:bg-primary/10 cursor-pointer"
                        }`}
                        style={isSelected ? { backgroundColor: "#0F6D6A" } : {}}
                        title={isFull ? "Đã kín lịch" : isAlmost ? "Còn ít slot" : ""}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-100 border border-red-300 inline-block" />Full lịch</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-300 inline-block" />Gần full</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: "#0F6D6A" }} />Đã chọn</span>
                </div>
              </div>

              {/* Time slots */}
              {selectedDay && (
                <div className="mb-5">
                  <h3 className="font-semibold text-foreground mb-3">
                    Chọn giờ chụp — ngày {selectedDay}/{calMonth + 1}/{calYear}
                    {BK_ALMOST_DAYS.includes(selectedDay) && (
                      <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">⚡ Còn ít slot</span>
                    )}
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {ALL_TIME_SLOTS.map(slot => {
                      const isBooked = (BK_BOOKED_TIMES[selectedDay] ?? []).includes(slot);
                      const isSelected = time === slot;
                      return (
                        <button
                          key={slot}
                          disabled={isBooked}
                          onClick={() => !isBooked && setTime(slot)}
                          className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all flex items-center justify-center gap-1.5 ${
                            isBooked
                              ? "bg-red-50 border-red-200 text-red-400 cursor-not-allowed"
                              : isSelected
                              ? "border-primary text-white shadow-sm"
                              : "border-border text-foreground hover:border-primary/40 hover:bg-secondary cursor-pointer"
                          }`}
                          style={isSelected ? { backgroundColor: "#0F6D6A" } : {}}
                        >
                          {isBooked && <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />}
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-4 mt-2.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Đã được đặt</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-muted-foreground inline-block" />Còn trống</span>
                  </div>
                </div>
              )}

              {!selectedDay && (
                <p className="text-sm text-muted-foreground text-center py-4 mb-5 border border-dashed border-border rounded-xl">
                  ← Chọn ngày trên lịch để xem các khung giờ còn trống
                </p>
              )}

              <button
                onClick={() => setStep(2)}
                disabled={!selectedDay || !time}
                className="mt-2 w-full py-3.5 rounded-xl text-white font-semibold transition-opacity"
                style={{ backgroundColor: "#0F6D6A", opacity: (!selectedDay || !time) ? 0.45 : 1, cursor: (!selectedDay || !time) ? "not-allowed" : "pointer" }}
              >
                Tiếp theo →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-bold text-lg text-foreground mb-5">Thông tin sự kiện</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Tên bạn" placeholder="Nguyễn Văn A" icon={User} />
                  <InputField label="Số điện thoại" placeholder="0912 345 678" icon={Phone} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Địa điểm chụp</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input placeholder="Địa chỉ cụ thể hoặc địa điểm" className="w-full border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary" style={{ backgroundColor: "#EEF7F7" }} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Loại sự kiện</label>
                  <select className="w-full border border-border rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:border-primary cursor-pointer" style={{ backgroundColor: "#EEF7F7" }}>
                    <option>Chọn loại sự kiện</option>
                    <option>Đám cưới</option><option>Sinh nhật</option><option>Kỷ niệm</option><option>Doanh nghiệp</option><option>Gia đình</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Ghi chú thêm (tùy chọn)</label>
                  <textarea rows={3} placeholder="Yêu cầu đặc biệt, phong cách mong muốn..." className="w-full border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary resize-none" style={{ backgroundColor: "#EEF7F7" }} />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-secondary transition-colors">
                  ← Quay lại
                </button>
                <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity" style={{ backgroundColor: "#0F6D6A" }}>
                  Tiếp theo →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-bold text-lg text-foreground mb-5">Xác nhận & Thanh toán</h2>
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between py-3 border-b border-border text-sm">
                  <span className="text-muted-foreground">Gói dịch vụ</span>
                  <span className="font-semibold text-foreground">{pkg.name} — {fmtVND(pkg.price)}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border text-sm">
                  <span className="text-muted-foreground">Nhiếp ảnh gia</span>
                  <span className="font-semibold text-foreground">{p.name}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border text-sm">
                  <span className="text-muted-foreground">Phí dịch vụ (5%)</span>
                  <span className="font-semibold text-foreground">{fmtVND(pkg.price * 0.05)}</span>
                </div>
                <div className="flex items-center justify-between py-2 text-base font-bold text-foreground">
                  <span>Tổng cộng</span>
                  <span style={{ color: "#0F6D6A" }}>{fmtVND(pkg.price * 1.05)}</span>
                </div>
              </div>

              <h3 className="font-semibold text-foreground mb-3 text-sm">Phương thức thanh toán</h3>
              <div className="space-y-2 mb-5">
                {[{ id: "momo", label: "Ví MoMo" }, { id: "bank", label: "Chuyển khoản ngân hàng" }, { id: "card", label: "Thẻ tín dụng / ghi nợ" }].map((m) => (
                  <label key={m.id} className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer hover:border-primary/40 transition-colors">
                    <input type="radio" name="payment" defaultChecked={m.id === "momo"} className="accent-primary" />
                    <span className="text-sm font-medium text-foreground">{m.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-secondary transition-colors">
                  ← Quay lại
                </button>
                <button onClick={() => navigate("booking-success")} className="flex-1 py-3 rounded-xl text-white font-bold hover:opacity-90 transition-opacity" style={{ backgroundColor: "#0F6D6A" }}>
                  Xác nhận đặt lịch
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Summary card */}
        <div>
          <div className="bg-card border border-border rounded-2xl p-5 sticky top-24">
            <img src={p.portfolio[0]} alt={p.name} className="w-full h-36 object-cover rounded-xl mb-4" />
            <div className="flex items-center gap-3 mb-3">
              <img src={p.avatar} alt={p.name} className="w-10 h-10 rounded-xl object-cover" />
              <div>
                <p className="font-semibold text-sm text-foreground">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.specialty}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {selectedDay && <div className="flex items-center justify-between"><span className="text-muted-foreground">Ngày</span><span className="font-medium">{selectedDay}/{calMonth + 1}/{calYear}</span></div>}
              {time && <div className="flex items-center justify-between"><span className="text-muted-foreground">Giờ</span><span className="font-medium">{time}</span></div>}
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Gói</span><span className="font-medium">{pkg.name}</span></div>
              <div className="pt-2 border-t border-border flex items-center justify-between font-bold">
                <span>Tổng</span><span style={{ color: "#0F6D6A" }}>{fmtVND(pkg.price)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Booking success
function BookingSuccessPage({ navigate }: { navigate: Navigate }) {
  return (
    <div className="max-w-lg mx-auto px-6 py-20 text-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl" style={{ backgroundColor: "#0F6D6A" }}>
        <Check className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-3">Đặt lịch thành công!</h1>
      <p className="text-muted-foreground mb-2">Yêu cầu đặt lịch của bạn đã được gửi đến nhiếp ảnh gia.</p>
      <p className="text-sm text-muted-foreground mb-8">Nhiếp ảnh gia sẽ xác nhận trong vòng <strong>2 giờ</strong>. Bạn sẽ nhận thông báo qua email và ứng dụng.</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={() => navigate("history")} className="px-6 py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity" style={{ backgroundColor: "#0F6D6A" }}>
          Xem đặt lịch của tôi
        </button>
        <button onClick={() => navigate("home")} className="px-6 py-3 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-secondary transition-colors">
          Về trang chủ
        </button>
      </div>
    </div>
  );
}

// Booking history
function BookingHistoryPage({ navigate }: { navigate: Navigate }) {
  const [tab, setTab] = useState<"all" | "upcoming" | "completed" | "cancelled">("all");
  const filtered = tab === "all" ? BOOKINGS : BOOKINGS.filter((b) => b.status === tab || (tab === "upcoming" && b.status === "pending"));

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">Lịch sử đặt lịch</h1>
      <div className="flex gap-1 p-1 bg-muted rounded-xl mb-6 w-fit">
        {(["all", "upcoming", "completed", "cancelled"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            {t === "all" ? "Tất cả" : t === "upcoming" ? "Sắp tới" : t === "completed" ? "Hoàn thành" : "Đã hủy"}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {filtered.map((b) => (
          <div key={b.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row gap-4 hover:shadow-sm transition-shadow">
            <img src={b.photographer.portfolio[0]} alt="" className="w-full sm:w-24 h-24 rounded-xl object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <p className="font-bold text-foreground">{b.photographer.name}</p>
                  <p className="text-sm text-muted-foreground">{b.photographer.specialty} · Gói {b.package}</p>
                </div>
                <StatusBadge status={b.status} />
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1.5">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{b.date}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{b.time}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{b.location}</span>
              </div>
            </div>
            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-between gap-3 flex-shrink-0">
              <p className="font-bold" style={{ color: "#0F6D6A" }}>{fmtVND(b.price)}</p>
              <div className="flex gap-2">
                {b.status === "completed" && (
                  <button className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-secondary flex items-center gap-1">
                    <Star className="w-3 h-3" /> Đánh giá
                  </button>
                )}
                <button onClick={() => navigate("photographer-profile", { id: b.photographer.id })} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90 flex items-center gap-1" style={{ backgroundColor: "#0F6D6A" }}>
                  <Eye className="w-3 h-3" /> Chi tiết
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Favorites
function FavoritesPage({ navigate }: { navigate: Navigate }) {
  const [favs, setFavs] = useState<Set<number>>(new Set([1, 2, 4]));
  const toggleFav = (id: number) => setFavs((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const favPhotographers = PHOTOGRAPHERS.filter((p) => favs.has(p.id));

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-2">Yêu thích</h1>
      <p className="text-muted-foreground mb-8">{favPhotographers.length} nhiếp ảnh gia đã lưu</p>
      {favPhotographers.length === 0 ? (
        <div className="text-center py-20">
          <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Bạn chưa lưu nhiếp ảnh gia nào</p>
          <button onClick={() => navigate("search")} className="mt-4 px-6 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90" style={{ backgroundColor: "#0F6D6A" }}>Tìm kiếm ngay</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {favPhotographers.map((p) => <PhotographerCard key={p.id} p={p} navigate={navigate} favs={favs} toggleFav={toggleFav} />)}
        </div>
      )}
    </div>
  );
}

// Notifications
function NotificationsPage({ navigate: _navigate }: { navigate: Navigate }) {
  const notifs = [
    { id: 1, type: "booking", title: "Booking được xác nhận", desc: "Nguyễn Minh Tuấn đã xác nhận lịch chụp ngày 28/06/2025 của bạn.", time: "5 phút trước", read: false },
    { id: 2, type: "review", title: "Nhắc nhở đánh giá", desc: "Hãy chia sẻ trải nghiệm của bạn với Lê Thị Thu Hà.", time: "2 giờ trước", read: false },
    { id: 3, type: "promo", title: "Ưu đãi đặc biệt", desc: "Giảm 20% cho lần đặt lịch tiếp theo với mã MEMENTO20.", time: "1 ngày trước", read: true },
    { id: 4, type: "system", title: "Ảnh đã sẵn sàng", desc: "Bộ ảnh từ buổi chụp ngày 15/06 với Lê Thị Thu Hà đã được giao.", time: "3 ngày trước", read: true },
  ];
  const icons: Record<string, { icon: React.ElementType; color: string }> = {
    booking: { icon: Calendar, color: "#0F6D6A" },
    review: { icon: Star, color: "#d97706" },
    promo: { icon: Sparkles, color: "#7c3aed" },
    system: { icon: CheckCircle, color: "#16a34a" },
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Thông báo</h1>
        <button className="text-sm font-medium" style={{ color: "#0F6D6A" }}>Đánh dấu tất cả đã đọc</button>
      </div>
      <div className="space-y-3">
        {notifs.map((n) => {
          const { icon: Icon, color } = icons[n.type];
          return (
            <div key={n.id} className={`bg-card border rounded-2xl p-4 flex gap-3 ${n.read ? "border-border opacity-70" : "border-primary/20"}`} style={!n.read ? { backgroundColor: "rgba(15,109,106,0.03)" } : {}}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm text-foreground">{n.title}</p>
                  {!n.read && <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: "#0F6D6A" }} />}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{n.desc}</p>
                <p className="text-xs text-muted-foreground mt-1.5">{n.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Client profile
function ClientProfilePage({ navigate: _navigate }: { navigate: Navigate }) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">Hồ sơ cá nhân</h1>
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-5 mb-6">
          <div className="relative">
            <img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=160&h=160&fit=crop" alt="avatar" className="w-20 h-20 rounded-2xl object-cover" />
            <button className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-white shadow-md" style={{ backgroundColor: "#0F6D6A" }}>
              <Edit className="w-3 h-3" />
            </button>
          </div>
          <div>
            <h2 className="font-bold text-xl text-foreground">Nguyễn Minh Châu</h2>
            <p className="text-muted-foreground text-sm">Thành viên từ tháng 1/2024</p>
            <div className="flex items-center gap-1 mt-1.5">
              <CheckCircle className="w-4 h-4" style={{ color: "#0F6D6A" }} />
              <span className="text-sm font-medium" style={{ color: "#0F6D6A" }}>Email đã xác minh</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="Họ và tên" placeholder="Nguyễn Minh Châu" icon={User} />
          <InputField label="Email" type="email" placeholder="chau@example.com" icon={Mail} />
          <InputField label="Số điện thoại" placeholder="0912 345 678" icon={Phone} />
          <InputField label="Địa chỉ" placeholder="Hà Nội, Việt Nam" icon={MapPin} />
        </div>
        <button className="mt-5 px-6 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity" style={{ backgroundColor: "#0F6D6A" }}>
          Lưu thay đổi
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHOTOGRAPHER DASHBOARD
// ═══════════════════════════════════════════════════════════════

function PhotoDashboard({ navigate }: { navigate: Navigate }) {
  const p = PHOTOGRAPHERS[0];
  const upcoming = BOOKINGS.filter((b) => b.status === "upcoming" || b.status === "pending");

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Tháng 6, 2025</p>
        </div>
        <button onClick={() => navigate("booking")} className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 flex items-center gap-2" style={{ backgroundColor: "#0F6D6A" }}>
          <Plus className="w-4 h-4" /> Tạo khung giờ
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={BookOpen} label="Booking tháng này" value="21" sub="+8 so với T5" />
        <StatCard icon={CheckCircle} label="Đã hoàn thành" value="18" color="#16a34a" sub="85.7%" />
        <StatCard icon={DollarSign} label="Doanh thu T6" value="28.9M đ" sub="+35%" color="#d97706" />
        <StatCard icon={Star} label="Đánh giá TB" value="4.9" sub="127 đánh giá" color="#f59e0b" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-foreground">Doanh thu 6 tháng</h3>
              <p className="text-sm text-muted-foreground">Tổng: {fmtVND(REVENUE_DATA.reduce((s, d) => s + d.revenue, 0))}</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={REVENUE_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0F6D6A" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0F6D6A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,109,106,0.08)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#5A8A8A" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#5A8A8A" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000000}M`} />
              <Tooltip formatter={(v: number) => fmtVND(v)} contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,109,106,0.15)", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
              <Area type="monotone" dataKey="revenue" stroke="#0F6D6A" strokeWidth={2.5} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Upcoming */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground">Booking sắp tới</h3>
            <button onClick={() => navigate("photo-bookings")} className="text-xs font-medium" style={{ color: "#0F6D6A" }}>Tất cả</button>
          </div>
          <div className="space-y-3">
            {upcoming.slice(0, 3).map((b) => (
              <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "rgba(15,109,106,0.04)" }}>
                <img src={b.photographer.avatar} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">Khách hàng #{b.id}</p>
                  <p className="text-xs text-muted-foreground">{b.date} · {b.time}</p>
                </div>
                <StatusBadge status={b.status} />
              </div>
            ))}
            {upcoming.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Không có booking sắp tới</p>}
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <h3 className="font-semibold text-foreground text-sm mb-3">Hiệu suất tháng này</h3>
            {[
              { label: "Tỷ lệ chấp nhận", val: "94%", w: 94 },
              { label: "Hoàn thành đúng hẹn", val: "100%", w: 100 },
              { label: "Phản hồi nhanh", val: "87%", w: 87 },
            ].map((item) => (
              <div key={item.label} className="mb-2.5">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-semibold text-foreground">{item.val}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${item.w}%`, backgroundColor: "#0F6D6A" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Portfolio preview */}
      <div className="mt-6 bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-foreground">Portfolio của tôi</h3>
          <button onClick={() => navigate("portfolio")} className="text-sm font-medium flex items-center gap-1" style={{ color: "#0F6D6A" }}>
            Quản lý <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {p.portfolio.map((img, i) => (
            <div key={i} className="aspect-square rounded-xl overflow-hidden bg-muted">
              <img src={img} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Portfolio management
function PortfolioPage({ navigate: _navigate }: { navigate: Navigate }) {
  const p = PHOTOGRAPHERS[0];
  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quản lý Portfolio</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{p.portfolio.length} ảnh trong portfolio</p>
        </div>
        <button className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 flex items-center gap-2" style={{ backgroundColor: "#0F6D6A" }}>
          <Plus className="w-4 h-4" /> Thêm ảnh
        </button>
      </div>

      <div className="bg-card border-2 border-dashed border-border rounded-2xl p-10 text-center mb-6">
        <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
        <p className="font-semibold text-foreground mb-1">Kéo & thả ảnh vào đây</p>
        <p className="text-sm text-muted-foreground mb-3">Hỗ trợ JPG, PNG, WebP — Tối đa 20MB mỗi ảnh</p>
        <button className="px-5 py-2 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors">
          Chọn từ máy tính
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {p.portfolio.map((img, i) => (
          <div key={i} className="group relative aspect-square rounded-xl overflow-hidden bg-muted">
            <img src={img} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:scale-110 transition-transform">
                <Eye className="w-4 h-4 text-foreground" />
              </button>
              <button className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center hover:scale-110 transition-transform">
                <Trash2 className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        ))}
        <button className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-secondary transition-all">
          <Plus className="w-6 h-6 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Thêm ảnh</span>
        </button>
      </div>
    </div>
  );
}

// Packages management
function PackagesPage({ navigate: _navigate }: { navigate: Navigate }) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Quản lý gói dịch vụ</h1>
        <button className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 flex items-center gap-2" style={{ backgroundColor: "#0F6D6A" }}>
          <Plus className="w-4 h-4" /> Tạo gói mới
        </button>
      </div>
      <div className="space-y-4">
        {PACKAGES.map((pkg) => (
          <div key={pkg.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-foreground">{pkg.name}</h3>
                {pkg.popular && <span className="text-xs px-2 py-0.5 rounded-full text-white font-semibold" style={{ backgroundColor: "#0F6D6A" }}>Phổ biến</span>}
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{pkg.duration}</span>
                <span className="flex items-center gap-1"><Image className="w-3.5 h-3.5" />{pkg.photos} ảnh gốc</span>
                <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" />{pkg.edits} ảnh chỉnh sửa</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-lg font-bold" style={{ color: "#0F6D6A" }}>{fmtVND(pkg.price)}</p>
              <div className="flex gap-2">
                <button className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors">
                  <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <button className="w-8 h-8 rounded-lg border border-red-200 flex items-center justify-center hover:bg-red-50 transition-colors">
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Photo bookings
function PhotoBookingsPage({ navigate: _navigate }: { navigate: Navigate }) {
  const [tab, setTab] = useState<"upcoming" | "completed" | "all">("upcoming");
  const filtered = tab === "all" ? BOOKINGS : BOOKINGS.filter((b) => b.status === tab || (tab === "upcoming" && b.status === "pending"));

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">Quản lý booking</h1>
      <div className="flex gap-1 p-1 bg-muted rounded-xl mb-6 w-fit">
        {(["upcoming", "completed", "all"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            {t === "upcoming" ? "Sắp tới" : t === "completed" ? "Hoàn thành" : "Tất cả"}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {filtered.map((b) => (
          <div key={b.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <p className="font-bold text-foreground">Booking #{b.id}</p>
                <StatusBadge status={b.status} />
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{b.date}</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{b.time}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{b.location}</span>
                <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5" />Gói {b.package}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <p className="font-bold" style={{ color: "#0F6D6A" }}>{fmtVND(b.price)}</p>
              {b.status === "pending" && (
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90" style={{ backgroundColor: "#0F6D6A" }}>Chấp nhận</button>
                  <button className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-300 text-red-500 hover:bg-red-50">Từ chối</button>
                </div>
              )}
              {b.status !== "pending" && (
                <button className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:bg-secondary">Chi tiết</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Schedule
function SchedulePage({ navigate: _navigate }: { navigate: Navigate }) {
  const days = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  const dates = [23, 24, 25, 26, 27, 28, 29];
  const slots: Record<number, { time: string; label: string }[]> = {
    24: [{ time: "09:00", label: "Portrait - Minh Châu" }],
    28: [{ time: "08:00", label: "Wedding - Booking B001" }],
    29: [{ time: "14:00", label: "Corporate - Phạm Lan" }],
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Lịch làm việc</h1>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold px-3">Tháng 6, 2025</span>
          <button className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border">
          {days.map((d) => <div key={d} className="text-center py-3 text-xs font-semibold text-muted-foreground">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {dates.map((date) => {
            const daySlots = slots[date] ?? [];
            const isToday = date === 22;
            return (
              <div key={date} className={`min-h-24 p-2 border-r border-b border-border last:border-r-0 ${isToday ? "bg-secondary/50" : ""}`}>
                <p className={`text-sm font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "text-white" : "text-foreground"}`} style={isToday ? { backgroundColor: "#0F6D6A" } : {}}>
                  {date}
                </p>
                {daySlots.map((slot, i) => (
                  <div key={i} className="text-xs p-1 rounded-lg mb-1 text-white truncate" style={{ backgroundColor: "#0F6D6A" }}>
                    {slot.time} — {slot.label}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#0F6D6A" }} />
        <span className="text-sm text-muted-foreground">Đã có booking</span>
        <div className="w-3 h-3 rounded-sm bg-secondary/50 border border-border ml-3" />
        <span className="text-sm text-muted-foreground">Hôm nay</span>
      </div>
    </div>
  );
}

// Revenue
function RevenuePage({ navigate: _navigate }: { navigate: Navigate }) {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">Doanh thu</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard icon={DollarSign} label="Tháng này" value="28.9M" sub="+35%" color="#d97706" />
        <StatCard icon={TrendingUp} label="Quý này" value="71.3M" sub="+18%" />
        <StatCard icon={BookOpen} label="Booking T6" value="21" sub="+8" />
        <StatCard icon={Award} label="Đã rút về" value="65M" color="#7c3aed" />
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <h3 className="font-bold text-foreground mb-5">Biểu đồ doanh thu</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={REVENUE_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,109,106,0.08)" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#5A8A8A" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#5A8A8A" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000000}M`} />
            <Tooltip formatter={(v: number) => fmtVND(v)} contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,109,106,0.15)" }} />
            <Bar dataKey="revenue" fill="#0F6D6A" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-foreground">Chi tiết giao dịch</h3>
          <button className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
            <Download className="w-3.5 h-3.5" /> Xuất CSV
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {["Booking", "Khách hàng", "Ngày", "Gói", "Trạng thái", "Doanh thu"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BOOKINGS.map((b) => (
              <tr key={b.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                <td className="px-5 py-3.5 text-sm font-mono font-medium text-foreground">{b.id}</td>
                <td className="px-5 py-3.5 text-sm text-foreground">Khách hàng</td>
                <td className="px-5 py-3.5 text-sm text-muted-foreground">{b.date}</td>
                <td className="px-5 py-3.5 text-sm text-muted-foreground">{b.package}</td>
                <td className="px-5 py-3.5"><StatusBadge status={b.status} /></td>
                <td className="px-5 py-3.5 text-sm font-bold" style={{ color: "#0F6D6A" }}>{fmtVND(b.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Upload icon (used in portfolio page)
function Upload(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// ADMIN PAGES
// ═══════════════════════════════════════════════════════════════

function AdminHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-8 py-6 border-b border-border bg-white/50">
      <div>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function AdminDashboardPage() {
  return (
    <div>
      <AdminHeader title="Dashboard" subtitle="Tổng quan hệ thống Memento — Tháng 6, 2025" />
      <div className="p-8">
        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users} label="Tổng người dùng" value="12,847" sub="+342 tuần này" />
          <StatCard icon={Camera} label="Nhiếp ảnh gia" value="1,234" sub="+28 tuần này" color="#7c3aed" />
          <StatCard icon={BookOpen} label="Tổng booking" value="48,291" sub="+201 hôm nay" color="#d97706" />
          <StatCard icon={DollarSign} label="Doanh thu HT" value="2.4 tỷ đ" sub="+35% T5" color="#16a34a" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Revenue chart */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-foreground">Doanh thu hệ thống</h3>
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold text-green-700 bg-green-50">▲ 35% so với T5</span>
            </div>
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={ADMIN_REVENUE_DATA} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="adminRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F6D6A" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0F6D6A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,109,106,0.08)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#5A8A8A" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#5A8A8A" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000000}M`} />
                <Tooltip formatter={(v: number) => fmtVND(v)} contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,109,106,0.15)" }} />
                <Area type="monotone" dataKey="revenue" stroke="#0F6D6A" strokeWidth={2.5} fill="url(#adminRevGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Booking bar chart */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-bold text-foreground mb-5">Bookings theo tháng</h3>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={ADMIN_REVENUE_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,109,106,0.08)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#5A8A8A" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#5A8A8A" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,109,106,0.15)" }} />
                <Bar dataKey="bookings" fill="#7EE6D8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-foreground">Booking gần đây</h3>
              <span className="text-xs font-medium" style={{ color: "#0F6D6A" }}>Xem tất cả</span>
            </div>
            <table className="w-full">
              <tbody>
                {BOOKINGS.slice(0, 4).map((b) => (
                  <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <img src={b.photographer.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                        <div>
                          <p className="text-xs font-semibold text-foreground">{b.photographer.name}</p>
                          <p className="text-xs text-muted-foreground">{b.date}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={b.status} /></td>
                    <td className="px-5 py-3.5 text-xs font-bold text-right" style={{ color: "#0F6D6A" }}>{fmtVND(b.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-foreground">Người dùng mới</h3>
              <span className="text-xs font-medium" style={{ color: "#0F6D6A" }}>Xem tất cả</span>
            </div>
            <table className="w-full">
              <tbody>
                {ADMIN_USERS.slice(0, 4).map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "#0F6D6A" }}>
                          {u.name[0]}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize" style={{ backgroundColor: u.role === "photographer" ? "rgba(124,58,237,0.1)" : "rgba(15,109,106,0.08)", color: u.role === "photographer" ? "#7c3aed" : "#0F6D6A" }}>
                        {u.role === "client" ? "Khách hàng" : "Nhiếp ảnh gia"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={u.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const filtered = ADMIN_USERS.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <AdminHeader title="Quản lý người dùng" subtitle={`${ADMIN_USERS.length} người dùng trong hệ thống`} action={
        <button className="px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 flex items-center gap-2" style={{ backgroundColor: "#0F6D6A" }}>
          <Download className="w-4 h-4" /> Xuất danh sách
        </button>
      } />
      <div className="p-8">
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên hoặc email..." className="flex-1 text-sm text-foreground placeholder-muted-foreground bg-transparent outline-none" />
            </div>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Người dùng", "Vai trò", "Trạng thái", "Ngày tham gia", "Booking", "Hành động"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: "#0F6D6A" }}>
                        {u.name[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: u.role === "photographer" ? "rgba(124,58,237,0.1)" : "rgba(15,109,106,0.08)", color: u.role === "photographer" ? "#7c3aed" : "#0F6D6A" }}>
                      {u.role === "client" ? "Khách hàng" : "Nhiếp ảnh gia"}
                    </span>
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={u.status} /></td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{u.joined}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-foreground">{u.bookings}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-secondary text-muted-foreground"><Eye className="w-3.5 h-3.5" /></button>
                      <button className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-secondary text-muted-foreground"><Edit className="w-3.5 h-3.5" /></button>
                      <button className="w-7 h-7 rounded-lg border border-red-200 flex items-center justify-center hover:bg-red-50 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminApprovalPage() {
  const [approvals, setApprovals] = useState<Record<number, "approved" | "rejected" | null>>({});

  return (
    <div>
      <AdminHeader title="Duyệt hồ sơ nhiếp ảnh gia" subtitle={`${PENDING_PHOTOGRAPHERS.length} hồ sơ đang chờ duyệt`} />
      <div className="p-8">
        <div className="space-y-5">
          {PENDING_PHOTOGRAPHERS.map((ph) => {
            const status = approvals[ph.id];
            return (
              <div key={ph.id} className="bg-card border border-border rounded-2xl p-5">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <img src={ph.avatar} alt={ph.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-foreground">{ph.name}</h3>
                      {status && <StatusBadge status={status} />}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1"><Camera className="w-3.5 h-3.5" />{ph.specialty}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{ph.location}</span>
                      <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" />{ph.experience} kinh nghiệm</span>
                      <span className="flex items-center gap-1"><Image className="w-3.5 h-3.5" />{ph.portfolio} ảnh portfolio</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Nộp {ph.submitted}</span>
                    </div>
                  </div>
                  {!status ? (
                    <div className="flex gap-2 flex-shrink-0">
                      <button className="px-4 py-2 rounded-xl text-xs font-bold border border-red-300 text-red-500 hover:bg-red-50 transition-colors" onClick={() => setApprovals((prev) => ({ ...prev, [ph.id]: "rejected" }))}>
                        Từ chối
                      </button>
                      <button className="px-4 py-2 rounded-xl text-xs font-bold text-white hover:opacity-90 transition-opacity" style={{ backgroundColor: "#0F6D6A" }} onClick={() => setApprovals((prev) => ({ ...prev, [ph.id]: "approved" }))}>
                        <CheckCircle className="w-3.5 h-3.5 inline mr-1" /> Duyệt hồ sơ
                      </button>
                    </div>
                  ) : (
                    <button className="text-xs text-muted-foreground underline flex-shrink-0" onClick={() => setApprovals((prev) => ({ ...prev, [ph.id]: null }))}>
                      Hoàn tác
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AdminPhotographersPage() {
  return (
    <div>
      <AdminHeader title="Quản lý nhiếp ảnh gia" subtitle={`${PHOTOGRAPHERS.length} nhiếp ảnh gia hoạt động`} />
      <div className="p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PHOTOGRAPHERS.map((p) => (
            <div key={p.id} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <img src={p.avatar} alt={p.name} className="w-12 h-12 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm text-foreground truncate">{p.name}</p>
                    {p.verified && <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#0F6D6A" }} />}
                  </div>
                  <p className="text-xs text-muted-foreground">{p.specialty}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.location}</span>
                <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{p.rating} ({p.reviews})</span>
                <span>{p.completedJobs} buổi</span>
              </div>
              <div className="flex items-center justify-between">
                <StatusBadge status="active" />
                <div className="flex gap-1.5">
                  <button className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-secondary"><Eye className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  <button className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-secondary"><Edit className="w-3.5 h-3.5 text-muted-foreground" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminBookingsPage() {
  return (
    <div>
      <AdminHeader title="Quản lý booking" subtitle="Theo dõi và quản lý tất cả booking trên hệ thống" />
      <div className="p-8">
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["ID", "Khách hàng", "Nhiếp ảnh gia", "Ngày", "Gói", "Trạng thái", "Doanh thu"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BOOKINGS.map((b) => (
                <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-4 text-sm font-mono font-semibold text-foreground">{b.id}</td>
                  <td className="px-5 py-4 text-sm text-foreground">Khách hàng A</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <img src={b.photographer.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                      <span className="text-sm text-foreground">{b.photographer.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{b.date}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{b.package}</td>
                  <td className="px-5 py-4"><StatusBadge status={b.status} /></td>
                  <td className="px-5 py-4 text-sm font-bold" style={{ color: "#0F6D6A" }}>{fmtVND(b.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminReviewsPage() {
  return (
    <div>
      <AdminHeader title="Quản lý đánh giá" subtitle={`${REVIEWS.length} đánh giá trong hệ thống`} />
      <div className="p-8 space-y-4">
        {REVIEWS.map((r) => (
          <div key={r.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <img src={r.avatar} alt={r.author} className="w-9 h-9 rounded-full object-cover" />
                <div>
                  <p className="font-semibold text-sm text-foreground">{r.author}</p>
                  <div className="flex items-center gap-2">
                    <Stars rating={r.rating} />
                    <span className="text-xs text-muted-foreground">{r.date}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{r.comment}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0 items-start">
              <button className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-secondary">Ẩn</button>
              <button className="px-3 py-1.5 rounded-lg border border-red-200 text-xs font-medium text-red-500 hover:bg-red-50">Xóa</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminCategoriesPage() {
  const cats = ["Đám cưới", "Chân dung", "Sự kiện", "Phong cảnh", "Gia đình", "Thương mại", "Đường phố", "Thực phẩm"];
  return (
    <div>
      <AdminHeader title="Danh mục dịch vụ" action={
        <button className="px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 flex items-center gap-2" style={{ backgroundColor: "#0F6D6A" }}>
          <Plus className="w-4 h-4" /> Thêm danh mục
        </button>
      } />
      <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cats.map((c, i) => (
          <div key={c} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(15,109,106,0.1)" }}>
                <Tag className="w-4 h-4" style={{ color: "#0F6D6A" }} />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">{c}</p>
                <p className="text-xs text-muted-foreground">{[124, 89, 67, 45, 78, 52, 38, 29][i]} nhiếp ảnh gia</p>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-secondary"><Edit className="w-3.5 h-3.5 text-muted-foreground" /></button>
              <button className="w-7 h-7 rounded-lg border border-red-200 flex items-center justify-center hover:bg-red-50"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminReportsPage() {
  return (
    <div>
      <AdminHeader title="Báo cáo thống kê" subtitle="Tổng quan hiệu suất hệ thống" />
      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-bold text-foreground mb-5">Doanh thu theo tháng</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={ADMIN_REVENUE_DATA} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="rptGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F6D6A" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0F6D6A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,109,106,0.08)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#5A8A8A" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#5A8A8A" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000000}M`} />
                <Tooltip formatter={(v: number) => fmtVND(v)} contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,109,106,0.15)" }} />
                <Area type="monotone" dataKey="revenue" stroke="#0F6D6A" strokeWidth={2} fill="url(#rptGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-bold text-foreground mb-5">Booking theo tháng</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ADMIN_REVENUE_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,109,106,0.08)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#5A8A8A" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#5A8A8A" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,109,106,0.15)" }} />
                <Bar dataKey="bookings" fill="#2FA6A1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Tỷ lệ hoàn thành booking", val: "91.4%", icon: CheckCircle, color: "#16a34a" },
            { label: "Thời gian phản hồi TB", val: "1.8 giờ", icon: Clock, color: "#d97706" },
            { label: "Đánh giá trung bình", val: "4.82 / 5", icon: Star, color: "#f59e0b" },
            { label: "Tỷ lệ giữ chân KH", val: "68%", icon: Activity, color: "#7c3aed" },
          ].map((item) => (
            <div key={item.label} className="bg-card border border-border rounded-2xl p-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${item.color}15` }}>
                <item.icon className="w-4.5 h-4.5" style={{ color: item.color, width: 18, height: 18 }} />
              </div>
              <p className="text-xl font-bold text-foreground">{item.val}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminSettingsPage() {
  return (
    <div>
      <AdminHeader title="Cài đặt hệ thống" />
      <div className="p-8 max-w-2xl">
        <div className="bg-card border border-border rounded-2xl divide-y divide-border">
          {[
            { title: "Tên nền tảng", val: "Memento", type: "text" },
            { title: "Email hỗ trợ", val: "support@memento.vn", type: "email" },
            { title: "Phí dịch vụ (%)", val: "5", type: "number" },
            { title: "Thời gian duyệt hồ sơ (ngày)", val: "3", type: "number" },
          ].map((s) => (
            <div key={s.title} className="flex items-center gap-4 p-5">
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">{s.title}</p>
              </div>
              <input type={s.type} defaultValue={s.val} className="border border-border rounded-xl px-4 py-2 text-sm text-foreground outline-none focus:border-primary w-44" style={{ backgroundColor: "#EEF7F7" }} />
            </div>
          ))}
        </div>
        <button className="mt-5 px-6 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity" style={{ backgroundColor: "#0F6D6A" }}>
          Lưu cài đặt
        </button>
      </div>
    </div>
  );
}

function AdminContent({ view, navigate }: { view: View; navigate: Navigate }) {
  switch (view) {
    case "admin-dashboard": return <AdminDashboardPage />;
    case "admin-users": return <AdminUsersPage />;
    case "admin-photographers": return <AdminPhotographersPage />;
    case "admin-approval": return <AdminApprovalPage />;
    case "admin-bookings": return <AdminBookingsPage />;
    case "admin-reviews": return <AdminReviewsPage />;
    case "admin-categories": return <AdminCategoriesPage />;
    case "admin-reports": return <AdminReportsPage />;
    case "admin-settings": return <AdminSettingsPage />;
    default: return <AdminDashboardPage />;
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════

export default function App() {
  const [view, setView] = useState<View>("home");
  const [params, setParams] = useState<Record<string, unknown>>({});

  // Persist auth in localStorage
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      return stored ? (JSON.parse(stored) as AuthUser) : null;
    } catch { return null; }
  });

  const navigate: Navigate = (v, p = {}) => {
    setView(v);
    setParams(p);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  };

  const login = (email: string, password: string): boolean => {
    const account = authenticate(email, password);
    if (account) {
      const user: AuthUser = { email: account.email, role: account.role, name: account.name };
      setAuthUser(user);
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      if (account.role === "client") navigate("client-dashboard");
      else if (account.role === "photographer") navigate("photo-dashboard");
      else navigate("admin-dashboard");
      return true;
    }
    return false;
  };

  const logout = () => {
    setAuthUser(null);
    localStorage.removeItem(AUTH_KEY);
    navigate("home");
  };

  // Route guard: redirect to correct place based on auth state
  useEffect(() => {
    if (!authUser && ALL_PROTECTED.includes(view)) {
      setView("login");
      setParams({});
      return;
    }
    if (authUser) {
      if (CLIENT_ROUTES.includes(view) && authUser.role !== "client") {
        setView(authUser.role === "photographer" ? "photo-dashboard" : "admin-dashboard");
        setParams({});
      } else if (PHOTO_ROUTES.includes(view) && authUser.role !== "photographer") {
        setView(authUser.role === "client" ? "client-dashboard" : "admin-dashboard");
        setParams({});
      } else if (ADMIN_ROUTES.includes(view) && authUser.role !== "admin") {
        setView(authUser.role === "client" ? "client-dashboard" : "photo-dashboard");
        setParams({});
      }
    }
  }, [view, authUser]);

  const role: Role = authUser?.role ?? "public";
  const isAdmin = role === "admin";
  const showFooter = ["home", "about", "contact", "search", "photographer-profile", "favorites"].includes(view);

  const renderPage = () => {
    switch (view) {
      case "home": return <HomePage navigate={navigate} />;
      case "login": return <LoginPage navigate={navigate} onLogin={login} />;
      case "register": return <RegisterPage navigate={navigate} />;
      case "forgot": return <ForgotPage navigate={navigate} />;
      case "client-dashboard": return <ClientDashboard navigate={navigate} />;
      case "search": return <SearchPage navigate={navigate} />;
      case "photographer-profile": return <PhotographerProfilePage navigate={navigate} photographerId={(params.id as number) ?? 1} />;
      case "booking": return <BookingPage navigate={navigate} photographerId={(params.photographerId as number) ?? 1} />;
      case "booking-success": return <BookingSuccessPage navigate={navigate} />;
      case "history": return <BookingHistoryPage navigate={navigate} />;
      case "favorites": return <FavoritesPage navigate={navigate} />;
      case "notifications": return <NotificationsPage navigate={navigate} />;
      case "client-profile": return <ClientProfilePage navigate={navigate} />;
      case "photo-dashboard": return <PhotoDashboard navigate={navigate} />;
      case "portfolio": return <PortfolioPage navigate={navigate} />;
      case "packages": return <PackagesPage navigate={navigate} />;
      case "photo-bookings": return <PhotoBookingsPage navigate={navigate} />;
      case "schedule": return <SchedulePage navigate={navigate} />;
      case "revenue": return <RevenuePage navigate={navigate} />;
      default: return <HomePage navigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {isAdmin ? (
        <div className="flex h-screen overflow-hidden">
          <AdminSidebar navigate={navigate} view={view} authUser={authUser} logout={logout} />
          <div className="flex-1 overflow-y-auto">
            <AdminContent view={view} navigate={navigate} />
          </div>
        </div>
      ) : (
        <>
          <Navbar authUser={authUser} logout={logout} navigate={navigate} view={view} />
          <main>{renderPage()}</main>
          {showFooter && <Footer navigate={navigate} />}
        </>
      )}
    </div>
  );
}
