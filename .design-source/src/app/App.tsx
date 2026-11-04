import { useAnalyticsPage, trackConversion } from '../../../src/backend/analytics';
import { AnalyticsSettingsPage } from '../../../src/backend/AnalyticsPanel';
import React, { useState, useEffect } from "react";
import { useTableVersion } from '../../../src/backend/useTableVersion';
import heroImage from '../../../src/assets/hero.png';
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
import { useBackend, BackendStatus } from '../../../src/backend/BackendContext';
import { Captcha, captchaEnabled } from '../../../src/backend/Captcha';
import { useDesignData } from '../../../src/backend/useDesignData';
import { supabase, errorMessage, unwrap } from '../../../src/backend/supabase';
import { createBooking, calcDeposit, todayVN } from '../../../src/backend/bookings';
import { RegisterForm, ForgotForm, RecoveryPage, ProfilePage, PhotographerEditor, ApplicationPage, BookingList, ReviewsPanel, Notifications, Messages, AdminUsers, AdminApplications, Dashboard, Unsupported, Panel } from '../../../src/backend/BackendPages';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type View =
  | "messages" | "application" | "home" | "login" | "register" | "forgot" | "about" | "contact"
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

type Photographer = import('../../../src/backend/BackendContext').Photographer;

// ═══════════════════════════════════════════════════════════════
// FORMATTING
// ═══════════════════════════════════════════════════════════════

const fmtVND = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + "đ";


const CLIENT_ROUTES: View[] = ["client-dashboard", "history", "history-detail", "favorites", "notifications", "client-profile", "client-settings"];
const PHOTO_ROUTES: View[] = ["photo-dashboard", "portfolio", "packages", "photo-bookings", "photo-booking-detail", "schedule", "revenue", "photo-reviews", "photo-profile", "photo-settings"];
const ADMIN_ROUTES: View[] = ["admin-dashboard", "admin-users", "admin-photographers", "admin-approval", "admin-bookings", "admin-reviews", "admin-categories", "admin-reports", "admin-settings"];
const BOOKING_ROUTES: View[] = ["booking", "payment", "booking-success"];
const ALL_PROTECTED: View[] = ["messages", "application", ...CLIENT_ROUTES, ...PHOTO_ROUTES, ...ADMIN_ROUTES, ...BOOKING_ROUTES];

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
            <p className="text-sm font-bold" style={{ color: "#0F6D6A" }}>{p.price > 0 ? fmtVND(p.price) : "Liên hệ"}</p>
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

function Navbar({ authUser, logout, navigate, view }: { authUser: AuthUser | null; logout: () => void; navigate: Navigate; view: View }) {
  const { PHOTOGRAPHERS } = useDesignData();
  const role: Role = authUser?.role ?? "public";
  const [menuOpen, setMenuOpen] = useState(false);
  const { notifications, profile } = useBackend();
  const showCalendar = false, showMessages = false, showNotifs = false;

  const closeAll = () => {};
  const toggleCalendar = () => navigate(role === 'photographer' ? 'schedule' : 'history');
  const toggleMessages = () => navigate('messages');
  const toggleNotifs = () => navigate('notifications');

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

              </button>
              <button
                onClick={toggleNotifs}
                title="Thông báo"
                className={`relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${showNotifs ? "text-white" : "text-muted-foreground hover:text-primary hover:bg-secondary"}`}
                style={showNotifs ? { backgroundColor: "#0F6D6A" } : {}}
              >
                <Bell className="w-5 h-5" />
                {notifications.some(n => !n.read_at) && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />}
              </button>

              {/* Avatar + greeting */}
              <button
                onClick={() => { closeAll(); navigate(role === "client" ? "client-profile" : "photo-profile"); }}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-secondary transition-colors ml-1"
              >
                <img
                  src={profile?.avatar_url || "/avatar.svg"}
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
  const { profile } = useBackend();
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
          <img src={profile?.avatar_url || "/avatar.svg"} alt="admin" className="w-8 h-8 rounded-full object-cover" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{authUser?.name ?? "Quản trị viên"}</p>
            <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.5)" }}>{authUser?.email ?? ""}</p>
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
  const links: { title: string; items: [string, View][] }[] = [
    { title: 'Khám phá', items: [['Tìm nhiếp ảnh gia', 'search'], ['Giới thiệu', 'about'], ['Liên hệ', 'contact']] },
    { title: 'Tài khoản', items: [['Đăng nhập', 'login'], ['Đăng ký', 'register'], ['Hồ sơ', 'client-profile']] },
    { title: 'Đặt lịch', items: [['Đặt lịch của tôi', 'history'], ['Yêu thích', 'favorites'], ['Tin nhắn', 'messages']] },
  ];
  return <footer className="bg-foreground text-white mt-20"><div className="max-w-7xl mx-auto px-6 py-14"><div className="grid md:grid-cols-4 gap-10 mb-10"><div><p className="font-bold text-xl mb-4">Memento</p><p className="text-sm text-white/60">Where Moments Become Memories. Kết nối những khoảnh khắc đáng nhớ.</p><a href="https://github.com/lenhatminh2102/App-Memento/releases/download/android-build-8/memento.apk" className="mt-4 inline-block text-sm font-semibold text-white underline underline-offset-4">Tải về APK</a></div>{links.map(col => <div key={col.title}><h4 className="font-semibold text-sm mb-4">{col.title}</h4><ul className="space-y-2.5">{col.items.map(([label, view]) => <li key={view}><button onClick={() => navigate(view)} className="text-sm text-white/60 hover:text-white">{label}</button></li>)}</ul></div>)}</div><p className="text-xs text-white/40 border-t border-white/10 pt-6">© {new Date().getFullYear()} Memento.</p></div></footer>;
}


const photoGroups = [
  { label: "Sự kiện", keys: ["fashionshows", "seminarsworkshops", "networkingevents", "galasawards"] },
  { label: "Nghệ thuật & Thương mại", keys: ["photography", "commercial", "product", "editorial", "art"] },
  { label: "Cá nhân & Gia đình", keys: ["personal", "couple", "anniversary", "wedding", "birthday", "familyactivities", "family"] },
  { label: "Giới trẻ & Văn hoá", keys: ["yearbook", "festivalanimecosplay", "travel", "cosplay", "festival"] },
];

const photoKey = (tag: string) => tag.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

function groupPhotoTags(tags: string[]) {
  const labels = new Map<string, string>();
  for (const tag of tags) {
    const key = photoKey(tag);
    if (key && (!labels.has(key) || !tag.startsWith("#"))) labels.set(key, tag.replace(/^#+/, "").trim());
  }
  return photoGroups.map((group, index) => ({
    label: group.label,
    tags: [...labels].filter(([key]) =>
      group.keys.includes(key) || (index === 1 && !photoGroups.some(other => other.keys.includes(key)))
    ).map(([, label]) => label),
  }));
}

function PhotoGroupList({ groups, selected, onSelect }: {
  groups: ReturnType<typeof groupPhotoTags>;
  selected?: string;
  onSelect: (tag: string) => void;
}) {
  return <div className="space-y-3">
    {groups.map(group => <details key={group.label} className="group rounded-xl border border-border bg-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-semibold">
        {group.label}<span aria-hidden="true" className="group-open:rotate-180">⌄</span>
      </summary>
      <div className="flex flex-wrap gap-2 border-t border-border p-3">
        {group.tags.length ? group.tags.map(tag => <button
          type="button" key={photoKey(tag)} onClick={() => onSelect(tag)}
          aria-pressed={selected === undefined ? undefined : photoKey(selected) === photoKey(tag)}
          className="rounded-full border border-border px-3 py-1.5 text-sm hover:bg-secondary aria-pressed:bg-primary aria-pressed:text-white"
        >{tag}</button>) : <p className="text-sm text-muted-foreground">Chưa có thể loại trong nhóm này.</p>}
      </div>
    </details>)}
  </div>;
}

function HomePage({ navigate }: { navigate: Navigate }) {
  const { PHOTOGRAPHERS } = useDesignData();
  const { pins, togglePin, loading, errors } = useBackend();
  const [pinError, setPinError] = useState('');
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("Tất cả");
  const categories = groupPhotoTags(PHOTOGRAPHERS.flatMap(p => p.tags));

  const reviewVersion = useTableVersion('photographer_reviews');
  const [testimonialError, setTestimonialError] = useState('');
  const [testimonials, setTestimonials] = useState<Record<string, any>[]>([]);
  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        const reviews = unwrap(await supabase.from('photographer_reviews').select('id,rating,comment,photographer_id,reviewer_id').eq('hidden', false).order('created_at', { ascending: false }).limit(3));
        const ids = [...new Set(reviews.map(r => r.reviewer_id).filter(Boolean))];
        const profiles = ids.length ? unwrap(await supabase.from('profiles').select('id,full_name,avatar_url').in('id', ids)) : [];
        const byId = new Map(profiles.map(p => [p.id, p]));
        if (live) { setTestimonialError(''); setTestimonials(reviews.map(r => ({ ...r, text: r.comment, name: byId.get(r.reviewer_id)?.full_name || 'Ẩn danh', role: '', avatar: byId.get(r.reviewer_id)?.avatar_url || '/avatar.svg' }))); }
      } catch (error) { if (live) { setTestimonials([]); setTestimonialError(errorMessage(error)); } }
    })();
    return () => { live = false; };
  }, [reviewVersion]);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-foreground">
        <img
          src={heroImage}
          alt="Photography hero"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(10,30,30,0.6) 0%, rgba(10,30,30,0.5) 50%, rgba(10,30,30,0.75) 100%)" }} />

        <div className="relative z-10 flex flex-col items-center justify-center text-center text-white px-5 py-14 md:py-24">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" style={{ color: "#7EE6D8" }} />
            <span>Kết nối nhiếp ảnh gia Việt Nam</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight max-w-3xl">
            Tìm nhiếp ảnh gia
            <span style={{ color: "#7EE6D8" }}>cho dịp của bạn</span>
          </h1>
          <p className="text-base text-white/90 mb-6 max-w-xl font-light">
            Chọn địa điểm và thể loại chụp để tìm người phù hợp.
          </p>

          {/* Search bar */}
          <form onSubmit={(event) => { event.preventDefault(); navigate("search", { location: search, specialty }); }} className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-2 flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center gap-3 px-4 py-2">
              <MapPin className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Địa điểm chụp" placeholder="Thành phố hoặc địa điểm"
                className="flex-1 text-sm text-foreground placeholder-muted-foreground outline-none bg-transparent"
              />
            </div>
            <div className="flex items-center gap-3 px-4 py-2 border-t sm:border-t-0 sm:border-l border-border">
              <Camera className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
              <select aria-label="Thể loại chụp" value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="flex-1 text-sm text-foreground outline-none bg-transparent cursor-pointer">
                <option>Tất cả</option>
                {categories.filter(group => group.tags.length).map(group => <optgroup key={group.label} label={group.label}>{group.tags.map(tag => <option key={tag}>{tag}</option>)}</optgroup>)}
              </select>
            </div>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-opacity hover:opacity-90 text-sm"
              style={{ backgroundColor: "#0F6D6A" }}
            >
              <Search className="w-4 h-4" /> Tìm nhiếp ảnh gia
            </button>
          </form>
        </div>

        {/* Stats bar */}
        <div className="relative bg-black/25 border-t border-white/10">
          <div className="max-w-5xl mx-auto px-6 py-4 grid grid-cols-3 gap-4">
            {[
              { value: String(PHOTOGRAPHERS.length), label: "Nhiếp ảnh gia" },
              { value: String(PHOTOGRAPHERS.reduce((sum, p) => sum + p.completedJobs, 0)), label: "Buổi chụp hoàn thành" },
              { value: String(PHOTOGRAPHERS.reduce((sum, p) => sum + p.reviews, 0)), label: "Đánh giá" },
            ].map((s) => (
              <div key={s.label} className="text-center text-white">
                <p className="text-2xl font-bold">{loading || errors["Danh sách thợ"] ? "—" : s.value}</p>
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
        <PhotoGroupList groups={categories} onSelect={tag => navigate("search", { specialty: tag })} />
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
            {pinError && <p role="alert" className="text-red-700">{pinError}</p>}{!PHOTOGRAPHERS.length && !loading && <p className="text-muted-foreground">Chưa có nhiếp ảnh gia.</p>}{[...PHOTOGRAPHERS].sort((a, b) => Number(b.hearts || 0) - Number(a.hearts || 0)).slice(0, 4).map((p) => (
              <PhotographerCard key={p.id} p={p} navigate={navigate} favs={new Set(pins)} toggleFav={id => { void togglePin(id).catch(e => setPinError(errorMessage(e))); }} />
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
            { step: "01", icon: Search, title: "Tìm nhiếp ảnh gia", desc: "Lọc theo địa điểm, phong cách và ngân sách để tìm nhiếp ảnh gia phù hợp nhất với bạn." },
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
        <img src={heroImage} alt="CTA" className="w-full h-72 object-cover" />
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
          {testimonialError && <p role="alert" className="text-red-700">{testimonialError}</p>}{!testimonials.length && !testimonialError && <p className="text-muted-foreground">Chưa có đánh giá.</p>}{testimonials.map((t) => (
            <div key={t.id} className="bg-card rounded-2xl p-6 border border-border shadow-sm">
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
        <img src={heroImage} alt="auth" className="w-full h-full object-cover" />
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

function LoginPage({ navigate, onLogin }: { navigate: Navigate; onLogin: (email: string, password: string, captchaToken?: string) => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (captchaEnabled && !captchaToken) throw new Error('Vui lòng hoàn tất CAPTCHA trước khi đăng nhập.');
      await onLogin(email.trim(), password, captchaToken || undefined);
    } catch(e) { setError(errorMessage(e)); }
    finally { setLoading(false); setCaptchaToken(null); setCaptchaReset(n => n + 1); }
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
          <Captcha onToken={setCaptchaToken} resetKey={captchaReset} />
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
        <button onClick={async () => { try { unwrap(await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })); } catch(e) { setError(errorMessage(e)); } }} className="w-full py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors flex items-center justify-center gap-2">
          <Globe className="w-4 h-4" /> Tiếp tục với Google
        </button>
      </div>
    </AuthShell>
  );
}

function RegisterPage({ navigate }: { navigate: Navigate }) {
  return <AuthShell title="Tạo tài khoản" subtitle="Tham gia cộng đồng Memento" navigate={navigate} altLink="Đã có tài khoản?" altText="Đăng nhập" altAction="login"><RegisterForm onDone={() => navigate('login')} /></AuthShell>;
}

function ForgotPage({ navigate }: { navigate: Navigate }) {
  return <AuthShell title="Khôi phục mật khẩu" subtitle="Nhận hướng dẫn qua email" navigate={navigate} altLink="Nhớ mật khẩu rồi?" altText="Đăng nhập" altAction="login"><ForgotForm /></AuthShell>;
}

// ═══════════════════════════════════════════════════════════════
// CLIENT: DASHBOARD
// ═══════════════════════════════════════════════════════════════

function SearchPage({ navigate, initialLocation = "", initialSpecialty = "Tất cả" }: { navigate: Navigate; initialLocation?: string; initialSpecialty?: string }) {
  const { PHOTOGRAPHERS } = useDesignData();
  const { pins, togglePin } = useBackend();
  const [favoriteError, setFavoriteError] = useState('');
  const favs = new Set(pins);
  const [filterSpec, setFilterSpec] = useState(initialSpecialty);
  const [filterLoc, setFilterLoc] = useState(initialLocation || "Tất cả");
  const [sortBy, setSortBy] = useState("rating");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const toggleFav = (id: number) => { void togglePin(id).catch(e => setFavoriteError(errorMessage(e))); };

  const specs = groupPhotoTags(PHOTOGRAPHERS.flatMap(p => p.tags));
  const locs = ["Tất cả", ...new Set(PHOTOGRAPHERS.flatMap(p => p.work_locations || [p.location]))];

  const filtered = PHOTOGRAPHERS.filter((p) => {
    const matchSpec = filterSpec === "Tất cả" || p.tags.some(t => photoKey(t) === photoKey(filterSpec)) || photoKey(p.specialty) === photoKey(filterSpec);
    const matchLoc = filterLoc === "Tất cả" || p.location.includes(filterLoc);
    return matchSpec && matchLoc;
  }).sort((a, b) => sortBy === "rating" ? b.rating - a.rating : sortBy === "price_asc" ? a.price - b.price : b.price - a.price);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">{favoriteError && <p role="alert" className="text-red-700">{favoriteError}</p>}
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
              <button type="button" onClick={() => setFilterSpec("Tất cả")} className="mb-3 text-sm underline">
                Tất cả thể loại
              </button>
              {filterSpec !== "Tất cả" && <p className="mb-3 text-sm text-muted-foreground">Đang lọc: {filterSpec}</p>}
              <PhotoGroupList groups={specs} selected={filterSpec} onSelect={setFilterSpec} />
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
                      <p className="text-lg font-bold" style={{ color: "#0F6D6A" }}>{p.price > 0 ? fmtVND(p.price) : "Liên hệ"}</p>
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
  const { PHOTOGRAPHERS } = useDesignData();
  const p = PHOTOGRAPHERS.find((x) => x.id === photographerId)!;
  const PACKAGES = p.packages || [];
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
                      pkg.duration || "Chưa có mô tả dịch vụ",
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
            <ReviewsPanel photographerId={p.id} />
          )}
        </div>

        {/* Sticky booking card */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-card border border-border rounded-2xl p-6 shadow-sm">
            <p className="text-sm text-muted-foreground mb-1">Bắt đầu từ</p>
            <p className="text-3xl font-bold mb-4" style={{ color: "#0F6D6A" }}>{p.price > 0 ? fmtVND(p.price) : "Liên hệ"}</p>
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

function BookingPage({ navigate, photographerId, packageId }: { navigate: Navigate; photographerId: number; packageId?: string }) {
  const { PHOTOGRAPHERS } = useDesignData();
  const p = PHOTOGRAPHERS.find((x) => x.id === photographerId)!;
  const PACKAGES = p.packages || [];
  const [step, setStep] = useState(1);
  const [selectedPkg, setSelectedPkg] = useState(PACKAGES.find(pkg => pkg.id === packageId)?.id || PACKAGES[0]?.id);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [time, setTime] = useState("");

  const pkg = PACKAGES.find((pk) => pk.id === selectedPkg) || PACKAGES[0];
  const { user, profile, bookings, run } = useBackend();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [contactName, setContactName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [endTime, setEndTime] = useState('');
  const bookingDate = selectedDay ? [calYear, String(calMonth + 1).padStart(2, '0'), String(selectedDay).padStart(2, '0')].join('-') : '';
  const submit = async () => {
    if (busy || !user) return;
    setError(''); setBusy(true);
    try {
      if (!p.user_id) throw new Error('Hồ sơ này chưa liên kết tài khoản nhiếp ảnh gia.');
      if (p.user_id === user.id) throw new Error('Không thể đặt lịch với chính mình.');
      if (!bookingDate || bookingDate < todayVN() || !time || !endTime || endTime <= time) throw new Error('Chọn ngày hợp lệ và giờ kết thúc sau giờ bắt đầu.');
      if (!location.trim() || !contactName.trim() || !phone.trim()) throw new Error('Điền tên, số điện thoại và địa điểm chụp.');
      if (bookingDate === todayVN() && new Date(bookingDate + 'T' + time + ':00+07:00') <= new Date()) throw new Error('Giờ chụp đã qua. Vui lòng chọn giờ khác.');
      const result = await run(() => createBooking({
        client_id: user.id, client_name: contactName.trim(), client_avatar: profile?.avatar_url || null,
        photographer_id: p.id, photographer_user_id: p.user_id, photographer_name: p.name, photographer_avatar: p.avatar || null,
        package_name: pkg.name, package_price: pkg.price, package_category: pkg.category || 'photo',
        booking_date: bookingDate, start_time: time, end_time: endTime,
        client_note: ['Liên hệ: ' + contactName.trim() + ' · ' + phone.trim(), 'Địa điểm: ' + location.trim(), note.trim()].filter(Boolean).join('\n'),
      }));
      if (result.error || !result.data) throw new Error(result.error || 'Máy chủ chưa lưu đặt lịch.');
      trackConversion('booking_created', { value: Number(result.data.package_price), currency: 'VND' });
      navigate('booking-success', { bookingId: result.data.id });
    } catch(e) { setError(errorMessage(e)); } finally { setBusy(false); }
  };

  const bkFirstDay = new Date(calYear, calMonth, 1).getDay();
  const bkAdjFirst = bkFirstDay === 0 ? 6 : bkFirstDay - 1;
  const bkDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const bkCells: (number | null)[] = [];
  for (let i = 0; i < bkAdjFirst; i++) bkCells.push(null);
  for (let d = 1; d <= bkDaysInMonth; d++) bkCells.push(d);

  const bkGoPrev = () => { setSelectedDay(null); setTime(""); setEndTime(""); if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); };
  const bkGoNext = () => { setSelectedDay(null); setTime(""); setEndTime(""); if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); };

  const steps = ["Chọn dịch vụ", "Thông tin sự kiện", "Xác nhận & thanh toán"];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <button onClick={() => navigate("photographer-profile", { id: p.id })} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ChevronLeft className="w-4 h-4" /> Quay lại hồ sơ
      </button>

      <h1 className="text-2xl font-bold text-foreground mb-6">Đặt lịch chụp ảnh</h1>{error && <p role="alert" className="bg-red-50 text-red-800 rounded-xl p-3 mb-4">{error}</p>}

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
                    const isFull = [calYear, String(calMonth + 1).padStart(2, '0'), String(day).padStart(2, '0')].join('-') < todayVN();

                    const isSelected = selectedDay === day;
                    return (
                      <button
                        key={i}
                        disabled={isFull}
                        onClick={() => { setSelectedDay(day); setTime(""); setEndTime(""); }}
                        className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full text-sm font-medium transition-all ${
                          isSelected ? "text-white font-bold shadow-sm" :
                          isFull ? "bg-red-100 text-red-400 cursor-not-allowed" :
                          "text-foreground hover:bg-primary/10 cursor-pointer"
                        }`}
                        style={isSelected ? { backgroundColor: "#0F6D6A" } : {}}
                        title={isFull ? "Ngày đã qua" : "Chọn ngày yêu cầu"}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedDay && <label className="block text-sm font-medium mb-4">Giờ bắt đầu<input type="time" className="w-full border border-border rounded-xl px-4 py-3 mt-2" value={time} onChange={e => { setTime(e.target.value); setEndTime(''); }} required /></label>}
              <label className="block text-sm font-medium mb-4">Giờ kết thúc<input type="time" className="w-full border border-border rounded-xl px-4 py-3 mt-2" value={endTime} min={time} onChange={e => setEndTime(e.target.value)} required /></label><p className="text-xs text-muted-foreground mb-4">Lịch trống được nhiếp ảnh gia xác nhận sau khi nhận yêu cầu.</p>
              {!selectedDay && (
                <p className="text-sm text-muted-foreground text-center py-4 mb-5 border border-dashed border-border rounded-xl">
                  Chọn ngày trên lịch, sau đó nhập giờ chụp mong muốn.
                </p>
              )}

              <button
                onClick={() => setStep(2)}
                disabled={!selectedDay || !time || !endTime || endTime <= time}
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
                  <label className="text-sm">Tên bạn<input className="w-full border border-border rounded-xl px-4 py-3 mt-2" value={contactName} onChange={e => setContactName(e.target.value)} /></label>
                  <label className="text-sm">Số điện thoại<input className="w-full border border-border rounded-xl px-4 py-3 mt-2" value={phone} onChange={e => setPhone(e.target.value)} /></label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Địa điểm chụp</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Địa chỉ cụ thể hoặc địa điểm" className="w-full border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary" style={{ backgroundColor: "#EEF7F7" }} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Ghi chú thêm (tùy chọn)</label>
                  <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Yêu cầu đặc biệt, phong cách mong muốn..." className="w-full border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary resize-none" style={{ backgroundColor: "#EEF7F7" }} />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-secondary transition-colors">
                  ← Quay lại
                </button>
                <button onClick={() => { if (!contactName.trim() || !phone.trim() || !location.trim()) { setError('Điền tên, số điện thoại và địa điểm chụp.'); return; } setError(''); setStep(3); }} className="flex-1 py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity" style={{ backgroundColor: "#0F6D6A" }}>
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
                  <span className="text-muted-foreground">Đặt cọc sau khi xác nhận (20%)</span>
                  <span className="font-semibold text-foreground">{fmtVND(calcDeposit(pkg.price))}</span>
                </div>
                <div className="flex items-center justify-between py-2 text-base font-bold text-foreground">
                  <span>Tổng cộng</span>
                  <span style={{ color: "#0F6D6A" }}>{fmtVND(pkg.price)}</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-5">Sau khi nhiếp ảnh gia xác nhận, bạn đặt cọc 20% qua chuyển khoản. Phần còn lại thanh toán theo tiến trình bàn giao ảnh.</p>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-secondary transition-colors">
                  ← Quay lại
                </button>
                <button disabled={busy} onClick={() => void submit()} className="flex-1 py-3 rounded-xl text-white font-bold hover:opacity-90 transition-opacity" style={{ backgroundColor: "#0F6D6A" }}>
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
function FavoritesPage({ navigate }: { navigate: Navigate }) {
  const { PHOTOGRAPHERS } = useDesignData();
  const { pins, togglePin } = useBackend();
  const [favoriteError, setFavoriteError] = useState('');
  const favs = new Set(pins);
  const toggleFav = (id: number) => { void togglePin(id).catch(e => setFavoriteError(errorMessage(e))); };
  const favPhotographers = PHOTOGRAPHERS.filter((p) => favs.has(p.id));

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-2">Yêu thích</h1>{favoriteError && <p role="alert" className="text-red-700">{favoriteError}</p>}
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
function RevenuePage({ navigate: _navigate }: { navigate: Navigate }) {
  const { BOOKINGS, REVENUE_DATA } = useDesignData();
  const exportCsv = () => {
    const cell = (value: unknown) => { const text = String(value ?? ''); return '\"' + (/^[=+@-]/.test(text) ? "'" + text : text).replaceAll('\"', '\"\"') + '\"'; };
    const rows = [['Mã đơn', 'Khách hàng', 'Ngày', 'Dịch vụ', 'Trạng thái', 'Giá trị'], ...BOOKINGS.map(b => [b.id, b.client_name, b.booking_date, b.package_name, b.status, b.package_price])];
    const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map(r => r.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'memento-bookings.csv'; link.click(); URL.revokeObjectURL(url);
  };
  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">Doanh thu</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard icon={DollarSign} label="Giá trị đơn hoàn thành tháng này" value={fmtVND(REVENUE_DATA[new Date().getMonth()]?.revenue || 0)} color="#d97706" />
        <StatCard icon={TrendingUp} label="Giá trị đơn hoàn thành năm nay" value={fmtVND(REVENUE_DATA.reduce((sum, r) => sum + r.revenue, 0))} />
        <StatCard icon={BookOpen} label="Tổng đặt lịch" value={String(BOOKINGS.length)} />
        <StatCard icon={Award} label="Đơn đã hoàn thành" value={String(BOOKINGS.filter(b => b.status === 'completed').length)} color="#7c3aed" />
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <h3 className="font-bold text-foreground mb-5">Biểu đồ doanh thu</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={REVENUE_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,109,106,0.08)" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#5A8A8A" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#5A8A8A" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000000}M`} />
            <Tooltip formatter={(v) => fmtVND(Number(v || 0))} contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,109,106,0.15)" }} />
            <Bar dataKey="revenue" fill="#0F6D6A" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-foreground">Chi tiết giao dịch</h3>
          <button onClick={exportCsv} className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
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
                <td className="px-5 py-3.5 text-sm text-foreground">{b.client_name || '—'}</td>
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

function AdminPhotographersPage({ navigate }: { navigate: Navigate }) {
  const { PHOTOGRAPHERS } = useDesignData();
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
                <span className="text-xs text-muted-foreground">Hồ sơ trên hệ thống</span>
                <div className="flex gap-1.5">
                  <button aria-label={'Xem hồ sơ ' + p.name} onClick={() => navigate('photographer-profile', { id: p.id })} className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-secondary"><Eye className="w-3.5 h-3.5 text-muted-foreground" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const backend = useBackend();
  const { user: authUser, authLoading, login, logout, photographers, recovery } = backend;
  const [view, setView] = useState<View>(() => {
    const requested = new URLSearchParams(window.location.search).get('view');
    return requested === 'admin-settings' || requested === 'admin-dashboard' ? requested : 'home';
  });
  const [params, setParams] = useState<Record<string, unknown>>({});
  const navigate: Navigate = (v, p = {}) => { setView(v); setParams(p); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const role: Role = authUser?.role ?? 'public';
  const dashboard: View = role === 'admin' ? 'admin-dashboard' : role === 'photographer' ? 'photo-dashboard' : 'client-dashboard';
  const mustLogin = ALL_PROTECTED.includes(view) && !authUser;
  const wrongRole = (ADMIN_ROUTES.includes(view) && role !== 'admin') || (PHOTO_ROUTES.includes(view) && role !== 'photographer');
  const activeView = mustLogin ? 'login' : wrongRole ? dashboard : view;
  useAnalyticsPage(activeView, role, !authLoading && !recovery);
  useEffect(() => { if (authUser && view === 'login') { setView(dashboard); setParams({}); } }, [authUser?.id, view, dashboard]);
  const signOut = () => { void logout().then(() => navigate('home')).catch(e => window.alert(errorMessage(e))); };
  const chosen = photographers.find(p => p.id === Number(params.id ?? params.photographerId));
  const renderPage = () => {
    switch (activeView) {
      case 'home': return <HomePage navigate={navigate} />;
      case 'login': return <LoginPage navigate={navigate} onLogin={login} />;
      case 'register': return <RegisterPage navigate={navigate} />;
      case 'forgot': return <ForgotPage navigate={navigate} />;
      case 'client-dashboard': case 'photo-dashboard': return <Dashboard />;
      case 'search': return <SearchPage key={JSON.stringify(params)} navigate={navigate} initialLocation={String(params.location || "")} initialSpecialty={String(params.specialty || "Tất cả")} />;
      case 'photographer-profile': return chosen ? <PhotographerProfilePage key={chosen.id} navigate={navigate} photographerId={chosen.id} /> : <Panel title="Hồ sơ nhiếp ảnh gia"><p>Không tìm thấy hồ sơ. Chọn một nhiếp ảnh gia từ trang tìm kiếm.</p></Panel>;
      case 'booking': return chosen && chosen.packages.length ? <BookingPage key={chosen.id} navigate={navigate} photographerId={chosen.id} packageId={String(params.packageId || "")} /> : <Panel title="Đặt lịch"><p>Nhiếp ảnh gia chưa có dịch vụ với giá cụ thể hoặc hồ sơ chưa tải được.</p></Panel>;
      case 'booking-success': return <Panel title="Đã gửi yêu cầu đặt lịch"><p>Mã đặt lịch: {String(params.bookingId || '')}</p><p>Chờ nhiếp ảnh gia xác nhận trước khi thanh toán.</p><button onClick={() => navigate('history')} className="text-primary underline">Xem đặt lịch của tôi</button></Panel>;
      case 'history': case 'history-detail': case 'photo-bookings': case 'photo-booking-detail': case 'payment': return <BookingList />;
      case 'schedule': return <BookingList calendar />;
      case 'favorites': return <FavoritesPage navigate={navigate} />;
      case 'notifications': return <Notifications />;
      case 'messages': return <Messages />;
      case 'application': return <ApplicationPage />;
      case 'client-profile': return <ProfilePage />;
      case 'photo-profile': return <PhotographerEditor />;
      case 'client-settings': case 'photo-settings': return <ProfilePage settings />;
      case 'portfolio': return <PhotographerEditor section="portfolio" />;
      case 'packages': return <PhotographerEditor section="packages" />;
      case 'photo-reviews': return <Panel title="Đánh giá của khách hàng"><ReviewsPanel photographerId={photographers.find(p => p.user_id === authUser?.id)?.id} /></Panel>;
      case 'revenue': return <RevenuePage navigate={navigate} />;
      case 'admin-dashboard': return <Dashboard admin />;
      case 'admin-users': return <AdminUsers />;
      case 'admin-photographers': return <AdminPhotographersPage navigate={navigate} />;
      case 'admin-approval': return <AdminApplications />;
      case 'admin-bookings': return <BookingList admin />;
      case 'admin-reviews': return <Panel title="Quản lý đánh giá"><ReviewsPanel admin /></Panel>;
      case 'admin-reports': return <RevenuePage navigate={navigate} />;
      case 'admin-categories': return <BackendCategories />;
      case 'admin-settings': return <AnalyticsSettingsPage />;
      case 'about': return <Panel title="Về Memento"><p>Nền tảng kết nối khách hàng với nhiếp ảnh gia.</p></Panel>;
      case 'contact': return <Panel title="Liên hệ"><p>Đăng nhập và mở cuộc trò chuyện từ đặt lịch để trao đổi với nhiếp ảnh gia.</p></Panel>;
      default: return <HomePage navigate={navigate} />;
    }
  };
  return <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Poppins', sans-serif" }}>
    {authLoading ? <Panel title="Đang kiểm tra phiên đăng nhập…"><BackendStatus /></Panel> : recovery ? <RecoveryPage /> : role === 'admin' ? <div className="flex h-screen overflow-hidden"><AdminSidebar navigate={navigate} view={activeView} authUser={authUser} logout={signOut} /><div className="flex-1 overflow-y-auto"><BackendStatus />{renderPage()}</div></div> : <><Navbar authUser={authUser} logout={signOut} navigate={navigate} view={activeView} /><BackendStatus />{authUser?.role === 'client' && <div className="max-w-7xl mx-auto px-6 pt-3"><button className="text-xs text-primary underline" onClick={() => navigate('application')}>Trở thành nhiếp ảnh gia</button></div>}<main>{renderPage()}</main>{['home','about','contact','search','photographer-profile','favorites'].includes(activeView) && <Footer navigate={navigate} />}</>}
  </div>;
}

function BackendCategories() {
  const { photographers } = useBackend();
  const tags = [...new Set(photographers.flatMap(p => p.tags || []))];
  return <Panel title="Danh mục dịch vụ"><div className="grid sm:grid-cols-3 gap-4">{tags.map(tag => <div className="rounded-2xl bg-card border border-border p-5" key={tag}><strong>{tag}</strong><p className="text-sm text-muted-foreground">{photographers.filter(p => p.tags?.includes(tag)).length} nhiếp ảnh gia</p></div>)}</div><p className="text-sm text-muted-foreground">Danh mục lấy từ phong cách trong hồ sơ nhiếp ảnh gia.</p></Panel>;
}
