import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format a number with thousand separators in Indonesian format
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format a number with thousand separators
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat("id-ID").format(amount);
}

// Format a date in Indonesian format
export function formatDate(date: Date | string): string {
  if (!date) return "";
  
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Generate product code
export function generateProductCode(type: string, size: string): string {
  const prefix = type === "Kaos Dewasa" ? "KD" :
                type === "Kaos Dewasa Panjang" ? "KDP" :
                type === "Kaos Bloombee" ? "KB" :
                type === "Kaos Anak" ? "KA" :
                type === "Kaos Anak Tanggung" ? "KAT" : "K";
  
  // Generate random suffix
  const suffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `${prefix}-${suffix}`;
}

// Generate consignment code
export function generateConsignmentCode(): string {
  const prefix = "CN";
  const suffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `${prefix}-${suffix}`;
}

// Generate sale code
export function generateSaleCode(): string {
  const prefix = "SL";
  const suffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `${prefix}-${suffix}`;
}

// Determine stock status based on quantity
export function getStockStatus(quantity: number): {
  status: "Stok Baik" | "Stok Rendah" | "Perlu Restok";
  color: "success" | "warning" | "danger";
} {
  if (quantity > 30) {
    return { status: "Stok Baik", color: "success" };
  } else if (quantity > 10) {
    return { status: "Stok Rendah", color: "warning" };
  } else {
    return { status: "Perlu Restok", color: "danger" };
  }
}

// Extract the first letters from a name (for avatar)
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}
