import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
// TODO:为什么
export function formatDuration(duration: number) {
  // Math.floor向下取整，padStart 填充到开头(2,"0"),把字符串填充到两位，不足用0代替
  const hours = Math.floor(duration / 3600000);
  const minutes = Math.floor(duration / 60000);
  const seconds = Math.floor((duration % 60000) / 1000);
  return `${hours.toString().padStart(2, "0")}
  :${minutes.toString().padStart(2, "0")}
  :${seconds.toString().padStart(2, "0")}`;
}

export function snakeCaseToTitle(str: string) {
  return str.replace(/_+/g, "").replace(/\b\w/g, (char) => char.toUpperCase());
}
