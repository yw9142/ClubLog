import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistance, parseISO } from "date-fns"
import { ko } from "date-fns/locale"

// 클래스 결합 유틸리티
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 날짜 포맷팅 유틸리티
export function formatDate(date: string | Date, formatStr: string = 'PPP') {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: ko });
}

// 상대적 날짜 표시 (예: '3일 전')
export function formatRelative(date: string | Date) {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistance(dateObj, new Date(), { 
    addSuffix: true,
    locale: ko
  });
}

// 텍스트 자르기 (긴 텍스트 ... 처리)
export function truncateText(text: string, maxLength: number) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.slice(0, maxLength) + '...';
}

// 로컬 스토리지 래퍼 (클라이언트측에서만 동작)
export const storage = {
  get: <T>(key: string, defaultValue?: T): T | undefined => {
    if (typeof window === 'undefined') return defaultValue;
    
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error getting localStorage item '${key}':`, error);
      return defaultValue;
    }
  },
  
  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage item '${key}':`, error);
    }
  },
  
  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage item '${key}':`, error);
    }
  }
};

// 디바운스 함수 (연속적인 이벤트 처리 최적화)
export function debounce<F extends (...args: any[]) => any>(
  func: F,
  wait: number
): (...args: Parameters<F>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<F>) {
    if (timeout) clearTimeout(timeout);
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

// 스로틀 함수 (이벤트 처리 빈도 제한)
export function throttle<F extends (...args: any[]) => any>(
  func: F,
  limit: number
): (...args: Parameters<F>) => void {
  let lastFunc: ReturnType<typeof setTimeout>;
  let lastRan: number;
  
  return function(...args: Parameters<F>) {
    if (!lastRan) {
      func(...args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func(...args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

// 쿠키 유틸리티
export const cookie = {
  get: (name: string): string | undefined => {
    if (typeof document === 'undefined') return undefined;
    
    const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
    return match ? decodeURIComponent(match[3]) : undefined;
  },
  
  set: (name: string, value: string, options: Record<string, any> = {}): void => {
    if (typeof document === 'undefined') return;
    
    let cookieStr = encodeURIComponent(name) + '=' + encodeURIComponent(value);
    
    if (options.expires) {
      if (typeof options.expires === 'number') {
        const days = options.expires;
        const t = (options.expires = new Date());
        t.setDate(t.getDate() + days);
      }
      cookieStr += ';expires=' + options.expires.toUTCString();
    }
    
    if (options.path) cookieStr += ';path=' + options.path;
    if (options.domain) cookieStr += ';domain=' + options.domain;
    if (options.secure) cookieStr += ';secure';
    if (options.sameSite) cookieStr += ';samesite=' + options.sameSite;
    
    document.cookie = cookieStr;
  },
  
  remove: (name: string, options: Record<string, any> = {}): void => {
    options.expires = -1;
    cookie.set(name, '', options);
  }
};

// 배열 chunking (배열을 주어진 크기의 더 작은 배열들로 분할)
export function chunkArray<T>(array: T[], size: number): T[][] {
  if (!array.length) return [];
  
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  
  return chunks;
}

// 깊은 객체 비교
export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  
  if (!a || !b || (typeof a !== 'object' && typeof b !== 'object')) {
    return a === b;
  }
  
  if (a === null || a === undefined || b === null || b === undefined) {
    return false;
  }
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) {
    return false;
  }
  
  return keysA.every(key => deepEqual(a[key], b[key]));
}
