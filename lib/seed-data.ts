import {
  GalleryItem,
  CategoryItem,
  CostumeItem,
  OrderItem,
  EventItem,
  TicketItem,
  UserItem,
  CouponItem,
  AuditLogItem,
  ReviewItem,
  SettingsItem,
} from './types';

/**
 * Fallback placeholder sebelum frontend selesai melakukan sinkronisasi
 * ke server backend (`GET /api/sync` -> http://localhost:5000/api/sync).
 */
export const INITIAL_GALLERIES: GalleryItem[] = [];
export const INITIAL_CATEGORIES: CategoryItem[] = [];
export const INITIAL_COSTUMES: CostumeItem[] = [];
export const INITIAL_ORDERS: OrderItem[] = [];
export const INITIAL_EVENTS: EventItem[] = [];
export const INITIAL_TICKETS: TicketItem[] = [];
export const INITIAL_USERS: UserItem[] = [];
export const INITIAL_COUPONS: CouponItem[] = [];
export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [];
export const INITIAL_REVIEWS: ReviewItem[] = [];

export const INITIAL_SETTINGS: SettingsItem = {
  galleryName: 'Galeri Pusaka Seni Sriwedari',
  tagline: 'Lumbung Pelestarian Seni Budaya & Busana Keraton Nusantara',
  openHours: 'Setiap Hari: 08.00 - 22.00 WIB',
  location: 'Jl. Brigjend Slamet Riyadi No. 275, Sriwedari, Laweyan, Surakarta, Jawa Tengah 57141',
  phone: '0812-3456-7890',
  email: 'info@galerisriwedari.id',
  depositFee: 100000,
  terms: 'Penyewa wajib menjaga keutuhan busana adat keraton.',
  notifications: true,
};
