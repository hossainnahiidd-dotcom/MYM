import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "GBP"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function calculateOutstanding(amount: number, amountPaid: number): number {
  return Math.max(0, amount - amountPaid);
}

export function calculateLateFee(
  amount: number,
  dueDate: Date,
  feeRate: number
): number {
  const now = new Date();
  if (now <= dueDate || feeRate <= 0) return 0;
  const daysLate = Math.floor(
    (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  return (amount * feeRate * daysLate) / 100;
}

export function getDebtStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: "text-yellow-600 bg-yellow-50",
    PARTIAL: "text-blue-600 bg-blue-50",
    PAID: "text-green-600 bg-green-50",
    OVERDUE: "text-red-600 bg-red-50",
    WRITTEN_OFF: "text-gray-600 bg-gray-50",
  };
  return colors[status] ?? "text-gray-600 bg-gray-50";
}
