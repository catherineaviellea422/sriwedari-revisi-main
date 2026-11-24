'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BadgeCheck,
  Pencil,
  Settings,
  MapPin,
  ChevronRight,
  Star,
  Plus,
  ShoppingBag,
  Ticket,
  Award,
  Crown,
  Lock,
  Check,
  LogOut,
  X,
  UploadCloud,
  Receipt,
  Eye,
  Printer,
  Bookmark,
  Sparkles,
  Phone,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { SriwedariDB } from '@/lib/db';
import { OrderItem, TicketItem, GalleryItem } from '@/lib/types';
import { formatRupiah } from '@/lib/utils';
import TicketBoardingPassModal from '@/components/ticket/TicketBoardingPassModal';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, updateCurrentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'orders' | 'tickets' | 'wishlist'>('orders');
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<GalleryItem[]>([]);

  // Modals & Interactive States
  const [selectedTicketForPass, setSelectedTicketForPass] = useState<TicketItem | null>(null);
  const [viewProofUrl, setViewProofUrl] = useState<{ url: string; orderId: string } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAllBenefitsModal, setShowAllBenefitsModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string>('');

  // Proof Upload Refs
  const [uploadingOrderId, setUploadingOrderId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Profile Form State
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const historySectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('sriwedari_db_updated', handleUpdate);
    window.addEventListener('sriwedari_wishlist_updated', handleUpdate);
    return () => {
      window.removeEventListener('sriwedari_db_updated', handleUpdate);
      window.removeEventListener('sriwedari_wishlist_updated', handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditPhone(user.phone || '');
      setEditAvatar(user.avatar || '');
    }
  }, [user]);

  const loadData = () => {
    const allOrders = SriwedariDB.getOrders();
    const allTickets = SriwedariDB.getTickets();
    const wishlistIds = SriwedariDB.getWishlist();
    const allGalleries = SriwedariDB.getGalleries();

    setOrders(allOrders);
    setTickets(allTickets);
    setWishlistItems(allGalleries.filter((g) => wishlistIds.includes(g.id)));
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleLogout = async () => {
    setShowSettingsModal(false);
    await logout();
    router.push('/auth/login');
  };

  const handleRemoveWishlist = (id: string) => {
    SriwedariDB.toggleWishlist(id);
  };

  const jumpToTab = (tab: 'orders' | 'tickets' | 'wishlist') => {
    setActiveTab(tab);
    historySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ==========================================
  // PROOF OF PAYMENT UPLOAD HANDLERS
  // ==========================================
  const handleTriggerUpload = (orderId: string) => {
    setUploadingOrderId(orderId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingOrderId) return;

    if (!file.type.startsWith('image/')) {
      showToast('Harap pilih berkas gambar bukti transfer (JPG / PNG)');
      return;
    }

    try {
      showToast('Mengunggah berkas slip ke server...');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('prefix', 'slip');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        SriwedariDB.attachPaymentProof(uploadingOrderId, data.url);

        await fetch('/api/orders', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: uploadingOrderId, paymentProof: data.url }),
        });

        showToast('Slip bukti transfer berhasil disimpan! Kurator siap memverifikasi.');
        loadData();
      } else {
        showToast(data.error || 'Gagal mengunggah berkas');
      }
    } catch {
      showToast('Terjadi kesalahan jaringan saat mengunggah berkas');
    }
  };

  // ==========================================
  // EDIT PROFILE & AVATAR UPLOAD HANDLERS
  // ==========================================
  const handleAvatarSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Mohon pilih foto berformat JPG, PNG, atau WebP.');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('prefix', 'avatar');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success && data.url) {
        setEditAvatar(data.url);
        showToast('Foto profil siap disimpan.');
      } else {
        showToast(data.error || 'Gagal mengunggah foto profil.');
      }
    } catch {
      showToast('Koneksi gagal saat mengunggah foto profil.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (!editName.trim()) {
      showToast('Nama lengkap tidak boleh kosong.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          phone: editPhone.trim(),
          avatar: editAvatar,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        updateCurrentUser(json.data);
        setShowEditModal(false);
        showToast('Profil Anda berhasil diperbarui & tersimpan ke database.');
      } else {
        showToast(json.error || 'Gagal memperbarui profil.');
      }
    } catch {
      showToast('Gagal terhubung ke server backend.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ==========================================
  // PROFILE COMPLETION & TIER COMPUTATION
  // ==========================================
  const displayName = user ? user.name : 'Tamu Budaya';
  const displayEmail = user ? user.email : 'tamu@sriwedari.id';
  const displayPoints = user ? user.points ?? 0 : 0;
  const isSahabatKeraton = displayPoints >= 500 || (user?.role === 'admin');

  const completionChecks = [
    Boolean(user?.name),
    Boolean(user?.email),
    Boolean(user?.phone && user.phone.trim().length >= 8),
    Boolean(user?.avatar || orders.length > 0 || tickets.length > 0),
  ];
  const completionPct = user
    ? Math.round((completionChecks.filter(Boolean).length / completionChecks.length) * 100)
    : 25;

  const isComplete = completionPct === 100;

  return (
    <div className="space-y-4 pb-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-brand-green-dark text-brand-gold px-4 py-2.5 rounded-2xl border border-brand-gold/40 shadow-xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Hidden File Input for Proof of Transfer */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* ======================================================== */}
      {/* 1. COMPACT IDENTITY HEADER (Sesuai Referensi UI/UX)      */}
      {/* ======================================================== */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Circular Avatar */}
          <button
            type="button"
            onClick={() => (user ? setShowEditModal(true) : router.push('/auth/login'))}
            className="relative w-16 h-16 rounded-full bg-gradient-to-br from-brand-green to-brand-green-dark text-brand-gold border-2 border-brand-gold/60 shadow-card-warm flex items-center justify-center font-serif font-bold text-2xl overflow-hidden shrink-0 group"
            title={user ? 'Ubah foto profil' : 'Masuk akun'}
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span>{displayName.charAt(0).toUpperCase()}</span>
            )}
            <span className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
              <Pencil className="w-4 h-4 text-white" />
            </span>
          </button>

          {/* Name + Verified Badge + Edit Profile Pill */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-serif text-lg sm:text-xl font-bold text-primary truncate">
                {displayName}
              </h1>
              {user && (
                <BadgeCheck
                  className="w-4 h-4 text-sky-600 fill-sky-100 shrink-0"
                  aria-label="Anggota Terverifikasi"
                />
              )}
            </div>

            <div className="mt-1.5 flex items-center gap-2">
              {user ? (
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand-green-dark hover:bg-brand-green text-canvas text-[11px] font-semibold shadow-sm transition active:scale-[0.98]"
                >
                  <Pencil className="w-3 h-3 text-brand-gold" />
                  <span>Edit profil</span>
                </button>
              ) : (
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand-green-dark hover:bg-brand-green text-canvas text-[11px] font-semibold shadow-sm transition"
                >
                  <span>Masuk Akun</span>
                  <ChevronRight className="w-3.5 h-3.5 text-brand-gold" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Circular Settings / Account Action Button */}
        <button
          type="button"
          onClick={() => setShowSettingsModal(true)}
          aria-label="Pengaturan Akun & Keluar"
          className="w-11 h-11 rounded-full bg-surface-container-lowest hover:bg-surface-container-low border border-divider shadow-card flex items-center justify-center text-primary transition shrink-0 active:scale-95"
        >
          <Settings className="w-5 h-5 text-on-surface" />
        </button>
      </div>

      {/* ======================================================== */}
      {/* 2. LOCATION / CONTACT STATUS PILL BAR                    */}
      {/* ======================================================== */}
      <button
        type="button"
        onClick={() => (user ? setShowEditModal(true) : router.push('/auth/login'))}
        className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-container-lowest hover:bg-surface-container-low border border-divider shadow-card flex items-center justify-between gap-3 transition text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-8 h-8 rounded-full bg-brand-gold/15 border border-brand-gold/40 text-secondary flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4 text-brand-green" />
          </span>
          <div className="min-w-0">
            <span className="text-xs font-medium text-on-surface block truncate">
              Galeri Sriwedari, Surakarta • {user?.phone ? user.phone : 'Nomor WA belum diisi'}
            </span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-outline shrink-0" />
      </button>

      {/* ======================================================== */}
      {/* 3. PROFILE COMPLETION PROGRESS BAR                       */}
      {/* ======================================================== */}
      <div className="space-y-1.5 pt-0.5">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-green via-brand-gold to-secondary transition-all duration-500"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <span className="px-2 py-0.5 rounded-full bg-brand-green-dark text-brand-gold text-[10px] font-bold tracking-wide shrink-0">
            {completionPct}%
          </span>
        </div>

        <p className="text-[11px] text-on-surface-variant text-center flex items-center justify-center gap-1">
          <Star className="w-3.5 h-3.5 text-brand-gold fill-brand-gold shrink-0" />
          <span>
            {!user
              ? 'Masuk akun untuk menyimpan riwayat sewa & poin budaya Anda'
              : isComplete
              ? 'Profil lengkap! Siap menjelajahi & menyewa pusaka keraton'
              : 'Lengkapi nomor WhatsApp atau unggah foto agar profil mencapai 100%'}
          </span>
        </p>
      </div>

      {/* ======================================================== */}
      {/* 4. 3 QUICK METRIC & SHORTCUT CARDS (WITH '+' BADGE)      */}
      {/* ======================================================== */}
      <div className="grid grid-cols-3 gap-2.5 pt-1">
        {/* Card 1: Pesanan Sewa */}
        <div className="relative">
          <button
            type="button"
            onClick={() => jumpToTab('orders')}
            className={`w-full p-3 rounded-2xl border shadow-card flex flex-col items-center justify-center text-center transition min-h-[92px] ${
              activeTab === 'orders'
                ? 'bg-surface-container-lowest border-brand-green/50 ring-1 ring-brand-green/20'
                : 'bg-surface-container-lowest border-divider hover:border-brand-gold/50'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-1.5">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-primary leading-tight">
              <span className="text-sky-600">{orders.length}</span> Sewa
            </span>
            <span className="text-[9px] text-on-surface-variant mt-0.5">Busana Adat</span>
          </button>
          <Link
            href="/bookings"
            aria-label="Buat pesanan sewa baru"
            title="Pesan Sewa Baru"
            className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-surface-container-lowest border border-divider shadow-sm flex items-center justify-center text-on-surface-variant hover:text-brand-green hover:border-brand-green transition"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          </Link>
        </div>

        {/* Card 2: E-Tiket Pentas */}
        <div className="relative">
          <button
            type="button"
            onClick={() => jumpToTab('tickets')}
            className={`w-full p-3 rounded-2xl border shadow-card flex flex-col items-center justify-center text-center transition min-h-[92px] ${
              activeTab === 'tickets'
                ? 'bg-surface-container-lowest border-brand-green/50 ring-1 ring-brand-green/20'
                : 'bg-surface-container-lowest border-divider hover:border-brand-gold/50'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-1.5">
              <Ticket className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-primary leading-tight">
              <span className="text-purple-600">{tickets.length}</span> E-Tiket
            </span>
            <span className="text-[9px] text-on-surface-variant mt-0.5">Pentas Wayang</span>
          </button>
          <Link
            href="/visitors"
            aria-label="Pesan tiket pentas baru"
            title="Beli Tiket Pentas"
            className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-surface-container-lowest border border-divider shadow-sm flex items-center justify-center text-on-surface-variant hover:text-purple-600 hover:border-purple-400 transition"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          </Link>
        </div>

        {/* Card 3: Poin Budaya & Favorit */}
        <div className="relative">
          <button
            type="button"
            onClick={() => jumpToTab('wishlist')}
            className={`w-full p-3 rounded-2xl border shadow-card flex flex-col items-center justify-center text-center transition min-h-[92px] ${
              activeTab === 'wishlist'
                ? 'bg-surface-container-lowest border-brand-green/50 ring-1 ring-brand-green/20'
                : 'bg-surface-container-lowest border-divider hover:border-brand-gold/50'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-1.5">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-primary leading-tight">
              <span className="text-amber-700">{displayPoints}</span> Poin
            </span>
            <span className="text-[9px] text-on-surface-variant mt-0.5">
              {wishlistItems.length} Favorit
            </span>
          </button>
          <Link
            href="/collection"
            aria-label="Jelajahi koleksi favorit"
            title="Jelajahi Koleksi"
            className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-surface-container-lowest border border-divider shadow-sm flex items-center justify-center text-on-surface-variant hover:text-amber-600 hover:border-amber-400 transition"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          </Link>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. PRIVILEGE & MEMBERSHIP CARD (Sesuai Referensi Bawah)  */}
      {/* ======================================================== */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-b from-surface-container-lowest to-surface-container-low border border-divider shadow-card-warm space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-brand-green text-brand-gold flex items-center justify-center shrink-0">
              <Crown className="w-4 h-4" />
            </div>
            <span className="font-serif text-base font-bold text-primary tracking-tight">
              sriwedari
            </span>
            <span className="px-2 py-0.5 rounded bg-brand-green-dark text-brand-gold text-[9px] font-bold uppercase tracking-wider shrink-0">
              {isSahabatKeraton ? 'SAHABAT KERATON' : 'WARGA BUDAYA'}
            </span>
          </div>

          <Link
            href="/bookings"
            className="px-3.5 py-1.5 rounded-full bg-on-surface hover:bg-brand-green-dark text-canvas text-[11px] font-bold transition shrink-0"
          >
            Sewa Busana
          </Link>
        </div>

        {/* Comparison Table */}
        <div className="rounded-2xl bg-surface-container-lowest border border-divider/80 p-3.5 space-y-2.5 text-xs">
          <div className="grid grid-cols-12 items-center text-[10px] font-bold text-on-surface-variant pb-1 border-b border-divider/60">
            <span className="col-span-7 text-primary text-[11px]">Hak Istimewa Anggota</span>
            <span className="col-span-2 text-center">Warga</span>
            <span className="col-span-3 text-center text-secondary">Sahabat</span>
          </div>

          <div className="grid grid-cols-12 items-center text-[11px]">
            <span className="col-span-7 text-on-surface font-medium">
              Prioritas Kursi VIP Wayang
            </span>
            <span className="col-span-2 flex justify-center">
              {isSahabatKeraton ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2.5} />
              ) : (
                <Lock className="w-3.5 h-3.5 text-outline" />
              )}
            </span>
            <span className="col-span-3 flex justify-center">
              <Check className="w-3.5 h-3.5 text-brand-green" strokeWidth={2.5} />
            </span>
          </div>

          <div className="grid grid-cols-12 items-center text-[11px]">
            <span className="col-span-7 text-on-surface font-medium">
              Voucher Diskon Sewa Busana
            </span>
            <span className="col-span-2 flex justify-center">
              {isSahabatKeraton ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2.5} />
              ) : (
                <Lock className="w-3.5 h-3.5 text-outline" />
              )}
            </span>
            <span className="col-span-3 flex justify-center">
              <Check className="w-3.5 h-3.5 text-brand-green" strokeWidth={2.5} />
            </span>
          </div>

          <div className="grid grid-cols-12 items-center text-[11px]">
            <span className="col-span-7 text-on-surface font-medium">
              Check-in Cepat E-Tiket &amp; Galeri
            </span>
            <span className="col-span-2 flex justify-center">
              <Check className="w-3.5 h-3.5 text-brand-green" strokeWidth={2.5} />
            </span>
            <span className="col-span-3 flex justify-center">
              <Check className="w-3.5 h-3.5 text-brand-green" strokeWidth={2.5} />
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAllBenefitsModal(true)}
          className="w-full py-1.5 text-center text-xs font-bold text-primary hover:text-brand-green transition"
        >
          Lihat Semua Keuntungan Anggota
        </button>
      </div>

      {/* ======================================================== */}
      {/* 6. RIWAYAT SEWA, E-TIKET & KOLEKSI FAVORIT (FULL CRUD)   */}
      {/* ======================================================== */}
      <div ref={historySectionRef} className="pt-2 space-y-4">
        <div className="flex bg-surface-container-low p-1 rounded-2xl border border-divider">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-2 text-[11px] font-semibold rounded-xl transition flex items-center justify-center gap-1 ${
              activeTab === 'orders'
                ? 'bg-brand-green text-canvas shadow-sm'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Sewa ({orders.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tickets')}
            className={`flex-1 py-2 text-[11px] font-semibold rounded-xl transition flex items-center justify-center gap-1 ${
              activeTab === 'tickets'
                ? 'bg-brand-green text-canvas shadow-sm'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>E-Tiket ({tickets.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('wishlist')}
            className={`flex-1 py-2 text-[11px] font-semibold rounded-xl transition flex items-center justify-center gap-1 ${
              activeTab === 'wishlist'
                ? 'bg-brand-green text-canvas shadow-sm'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Favorit ({wishlistItems.length})</span>
          </button>
        </div>

        {/* Tab 1: Orders */}
        {activeTab === 'orders' && (
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="py-10 px-4 rounded-2xl bg-surface-container-low border border-dashed border-divider text-center text-on-surface-variant">
                <p className="text-xs font-medium">Belum ada riwayat pesanan sewa busana.</p>
                <Link
                  href="/bookings"
                  className="text-xs text-brand-green font-semibold underline mt-2 inline-block"
                >
                  Mulai Pesan Sewa
                </Link>
              </div>
            ) : (
              orders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-4 rounded-2xl bg-surface-container-lowest border border-divider space-y-3 shadow-card"
                >
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-divider">
                    <div>
                      <span className="text-[10px] text-on-surface-variant block">ID Invoice</span>
                      <span className="font-mono font-bold text-xs text-primary">{ord.id}</span>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        ord.status === 'Dikonfirmasi'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ord.status === 'Selesai'
                          ? 'bg-blue-100 text-blue-800'
                          : ord.status === 'Sedang Disewa'
                          ? 'bg-purple-100 text-purple-800'
                          : ord.status === 'Dibatalkan'
                          ? 'bg-red-100 text-red-800'
                          : ord.status === 'Kedaluwarsa'
                          ? 'bg-stone-200 text-stone-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {ord.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-on-surface-variant text-[10px] block">Busana</span>
                      <span className="font-semibold text-primary line-clamp-1">{ord.costumeName}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant text-[10px] block">Durasi Sewa</span>
                      <span>
                        {ord.duration} Hari ({ord.startDate})
                      </span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant text-[10px] block">Deposit</span>
                      <span className="price">{formatRupiah(ord.depositFee)}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant text-[10px] block">Total Bayar</span>
                      <span className="font-bold text-brand-green price">
                        {formatRupiah(ord.totalPrice)}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-surface-container-low border border-divider flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-brand-gold shrink-0" />
                      <div>
                        <span className="font-medium text-primary block text-[11px]">
                          Bukti Transfer / Slip
                        </span>
                        <span className="text-[10px] text-on-surface-variant">
                          {ord.paymentProof ? 'Slip pembayaran sudah diunggah' : 'Belum diunggah'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {ord.paymentProof && (
                        <button
                          type="button"
                          onClick={() => setViewProofUrl({ url: ord.paymentProof!, orderId: ord.id })}
                          className="px-2.5 py-1.5 rounded-lg bg-brand-green/10 hover:bg-brand-green/20 text-brand-green border border-brand-green/30 text-[11px] font-semibold flex items-center gap-1 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat</span>
                        </button>
                      )}

                      {ord.status !== 'Selesai' &&
                        ord.status !== 'Dibatalkan' &&
                        ord.status !== 'Kedaluwarsa' && (
                          <button
                            type="button"
                            onClick={() => handleTriggerUpload(ord.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-brand-green hover:bg-brand-green-dark text-canvas text-[11px] font-semibold flex items-center gap-1 shadow-sm transition"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>{ord.paymentProof ? 'Ganti Slip' : 'Unggah Slip'}</span>
                          </button>
                        )}
                    </div>
                  </div>

                  {ord.qcStatus && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] flex items-center justify-between">
                      <span>
                        QC Pengembalian: <strong>{ord.qcStatus}</strong>
                      </span>
                      <span className="text-emerald-700 font-bold price">
                        Refund: {formatRupiah(ord.refundAmount || 0)}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Tickets */}
        {activeTab === 'tickets' && (
          <div className="space-y-3">
            {tickets.length === 0 ? (
              <div className="py-10 px-4 rounded-2xl bg-surface-container-low border border-dashed border-divider text-center text-on-surface-variant">
                <p className="text-xs font-medium">Belum ada tiket pementasan yang dipesan.</p>
                <Link
                  href="/visitors"
                  className="text-xs text-brand-green font-semibold underline mt-2 inline-block"
                >
                  Pesan Tiket Pentas
                </Link>
              </div>
            ) : (
              tickets.map((tck) => (
                <div
                  key={tck.id}
                  className="p-4 rounded-2xl bg-surface-container-lowest border border-divider flex flex-col gap-3 shadow-card"
                >
                  <div className="space-y-1 text-left">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-green/10 text-brand-green border border-brand-green/20">
                        Zona {tck.zone}
                      </span>
                      <span className="text-[10px] text-on-surface-variant font-mono">{tck.id}</span>
                    </div>
                    <h3 className="font-serif text-sm font-bold text-primary mt-1">{tck.eventTitle}</h3>
                    <p className="text-xs text-on-surface-variant">
                      Kursi: <strong>{tck.seats?.join(', ') || 'A-05'}</strong> ({tck.quantity} Tiket) •{' '}
                      {tck.userName}
                    </p>
                    <p className="text-xs font-bold text-brand-green price pt-0.5">
                      Total: {formatRupiah(tck.totalPrice)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-divider">
                    <div className="text-left">
                      <span className="text-[10px] text-on-surface-variant block">Kode Boarding</span>
                      <span className="font-mono text-xs font-bold text-primary tracking-wider">
                        {tck.bookingCode}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tck.status === 'Aktif'
                            ? 'bg-emerald-100 text-emerald-800'
                            : tck.status === 'Check-in'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        {tck.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedTicketForPass(tck)}
                        className="px-2.5 py-1.5 rounded-lg bg-brand-green hover:bg-brand-green-dark text-canvas text-[11px] font-bold flex items-center gap-1 shadow-sm transition"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>E-Tiket</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Wishlist */}
        {activeTab === 'wishlist' && (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {wishlistItems.length === 0 ? (
              <div className="col-span-full py-10 px-4 rounded-2xl bg-surface-container-low border border-dashed border-divider text-center text-on-surface-variant">
                <p className="text-xs font-medium">Belum ada karya seni yang disimpan ke favorit.</p>
                <Link
                  href="/collection"
                  className="text-xs text-brand-green font-semibold underline mt-2 inline-block"
                >
                  Jelajahi Galeri
                </Link>
              </div>
            ) : (
              wishlistItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-surface-container-lowest rounded-2xl border border-divider overflow-hidden flex flex-col justify-between shadow-card"
                >
                  <div className="aspect-[4/3] relative">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      aria-label="Hapus dari daftar simpan"
                      onClick={() => handleRemoveWishlist(item.id)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center"
                      title="Hapus"
                    >
                      <X className="w-4 h-4" strokeWidth={2.25} />
                    </button>
                  </div>
                  <div className="p-3 space-y-2">
                    <h4 className="font-serif text-xs font-bold text-primary line-clamp-1">
                      {item.title}
                    </h4>
                    <Link
                      href={`/collection/${item.id}`}
                      className="w-full py-1.5 rounded-xl bg-brand-green text-canvas text-[11px] font-semibold flex items-center justify-center gap-1"
                    >
                      <span>Detail Karya</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL: EDIT PROFIL (NAMA, NOMOR WHATSAPP, AVATAR)        */}
      {/* ======================================================== */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative border border-divider animate-in fade-in zoom-in-95">
            <button
              type="button"
              aria-label="Tutup"
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface-variant flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">
                Identitas Anggota Budaya
              </span>
              <h3 className="font-serif text-lg font-bold text-primary">Edit Profil Anda</h3>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              {/* Avatar picker */}
              <div className="flex items-center gap-3.5">
                <div className="w-16 h-16 rounded-full bg-brand-green text-brand-gold flex items-center justify-center font-serif font-bold text-xl overflow-hidden border-2 border-brand-gold/50 shrink-0">
                  {editAvatar ? (
                    <img src={editAvatar} alt="Avatar Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span>{(editName || 'S').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="space-y-1.5">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handleAvatarSelected}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploadingAvatar}
                    onClick={() => avatarInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container border border-divider text-primary font-semibold inline-flex items-center gap-1.5 transition"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-brand-green" />
                    <span>{isUploadingAvatar ? 'Mengunggah...' : 'Ganti Foto Profil'}</span>
                  </button>
                  <p className="text-[10px] text-on-surface-variant">JPG, PNG, atau WebP</p>
                </div>
              </div>

              <div>
                <label className="block text-on-surface font-semibold mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-divider text-on-surface focus:outline-none focus:border-brand-green"
                  placeholder="Nama lengkap Anda"
                />
              </div>

              <div>
                <label className="block text-on-surface font-semibold mb-1">
                  Nomor WhatsApp Aktif
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-divider text-on-surface focus:outline-none focus:border-brand-green"
                  placeholder="0812xxxxxxxx"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={isSavingProfile || isUploadingAvatar}
                  className="flex-1 h-10 rounded-xl bg-brand-green hover:bg-brand-green-dark disabled:opacity-60 text-canvas font-bold transition"
                >
                  {isSavingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 h-10 rounded-xl bg-surface-container-low text-on-surface-variant font-semibold"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: PENGATURAN AKUN & KELUAR (TOMBOL GEAR)            */}
      {/* ======================================================== */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative border border-divider animate-in fade-in zoom-in-95">
            <button
              type="button"
              aria-label="Tutup"
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-container-low text-on-surface-variant flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">
                Pengaturan Akun
              </span>
              <h3 className="font-serif text-lg font-bold text-primary">Informasi &amp; Sesi</h3>
            </div>

            <div className="space-y-2.5 text-xs bg-surface-container-low p-3.5 rounded-2xl border border-divider">
              <div className="flex items-center gap-2 text-on-surface">
                <Mail className="w-4 h-4 text-brand-green shrink-0" />
                <span className="truncate">{displayEmail}</span>
              </div>
              <div className="flex items-center gap-2 text-on-surface">
                <Phone className="w-4 h-4 text-brand-green shrink-0" />
                <span>{user?.phone || 'Belum diisi'}</span>
              </div>
              <div className="flex items-center gap-2 text-on-surface">
                <ShieldCheck className="w-4 h-4 text-brand-green shrink-0" />
                <span>
                  Peran: <strong className="uppercase">{user?.role || 'Tamu'}</strong>
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              {user && (
                <button
                  type="button"
                  onClick={() => {
                    setShowSettingsModal(false);
                    setShowEditModal(true);
                  }}
                  className="w-full h-10 rounded-xl bg-brand-green hover:bg-brand-green-dark text-canvas text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Ubah Data Profil</span>
                </button>
              )}

              {user?.role === 'admin' && (
                <Link
                  href="/admin/dashboard"
                  onClick={() => setShowSettingsModal(false)}
                  className="w-full h-10 rounded-xl bg-brand-gold text-brand-green-dark text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Buka Dashboard Kurator</span>
                </Link>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="w-full h-10 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{user ? 'Keluar Akun' : 'Masuk / Ganti Akun'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DETAIL SEMUA KEUNTUNGAN ANGGOTA                   */}
      {/* ======================================================== */}
      {showAllBenefitsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative border border-divider animate-in fade-in zoom-in-95">
            <button
              type="button"
              aria-label="Tutup"
              onClick={() => setShowAllBenefitsModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-container-low text-on-surface-variant flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-brand-green text-brand-gold flex items-center justify-center">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">
                  Tingkatan Keanggotaan
                </span>
                <h3 className="font-serif text-lg font-bold text-primary">
                  Keuntungan Sahabat Keraton
                </h3>
              </div>
            </div>

            <ul className="space-y-2.5 text-xs text-on-surface-variant">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
                <span>
                  <strong className="text-primary">Poin Budaya Otomatis:</strong> Dapatkan poin dari
                  setiap penyewaan busana adat dan pembelian tiket pementasan.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
                <span>
                  <strong className="text-primary">Kode Kupon Khusus:</strong> Gunakan kupon{' '}
                  <code className="font-mono text-secondary font-bold">SRIWEDARI10</code> atau{' '}
                  <code className="font-mono text-secondary font-bold">KERATON25</code> saat
                  checkout sewa.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
                <span>
                  <strong className="text-primary">Boarding Pass Digital Instan:</strong> Cetak
                  E-Tiket resmi &amp; pindai langsung di loket Gedung Wayang Orang Sriwedari.
                </span>
              </li>
            </ul>

            <button
              type="button"
              onClick={() => setShowAllBenefitsModal(false)}
              className="w-full h-10 rounded-xl bg-brand-green text-canvas font-bold text-xs"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}

      {/* Ticket Boarding Pass Modal */}
      <TicketBoardingPassModal
        ticket={selectedTicketForPass}
        onClose={() => setSelectedTicketForPass(null)}
      />

      {/* Proof of Transfer Viewer Modal */}
      {viewProofUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-stone-900 border border-stone-200">
            <button
              type="button"
              aria-label="Tutup"
              onClick={() => setViewProofUrl(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center"
            >
              <X className="w-4 h-4" strokeWidth={2.25} aria-hidden="true" />
            </button>
            <div>
              <span className="text-[10px] text-brand-green font-bold uppercase tracking-wider block">
                Slip Pembayaran Resmi
              </span>
              <h3 className="font-serif text-lg font-bold text-stone-800">
                Invoice {viewProofUrl.orderId}
              </h3>
            </div>

            <div className="rounded-2xl overflow-hidden border border-stone-200 bg-stone-50 max-h-96 flex items-center justify-center">
              <img
                src={viewProofUrl.url}
                alt="Slip Pembayaran"
                className="w-full h-auto max-h-80 object-contain"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setViewProofUrl(null)}
                className="px-5 py-2 bg-brand-green text-canvas font-semibold text-xs rounded-xl shadow hover:bg-brand-green-dark transition"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
