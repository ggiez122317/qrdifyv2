import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getImageUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const cleaned = path.replace(/^\/?(storage\/)?/, '');
  const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '').replace(/\/$/, '');
  const backendOrigin = configuredApiUrl || (typeof window !== 'undefined'
    ? `http://${window.location.hostname}:8001`
    : 'http://localhost:8001');
  return `${backendOrigin}/storage/${cleaned}`;
}
