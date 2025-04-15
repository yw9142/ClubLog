"use client";

import { useState, useEffect, useMemo } from "react";

// 모든 디바이스 크기를 관리하는 상수
export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

// 화면 방향
export type Orientation = "portrait" | "landscape";

/**
 * 현재 디바이스 크기가 모바일인지 확인하는 훅
 * @param breakpoint 모바일로 간주할 최대 breakpoint (기본값: md)
 * @returns boolean - 모바일 여부
 */
export function useIsMobile(breakpoint: BreakpointKey = "md") {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    // 서버 사이드에서는 실행하지 않음
    if (typeof window === "undefined") return;

    const mql = window.matchMedia(`(max-width: ${BREAKPOINTS[breakpoint] - 1}px)`);
    const onChange = () => {
      setIsMobile(mql.matches);
    };

    // 초기값 설정
    setIsMobile(mql.matches);
    
    // 변경 이벤트 리스너 등록
    mql.addEventListener("change", onChange);
    
    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => mql.removeEventListener("change", onChange);
  }, [breakpoint]);

  return isMobile;
}

/**
 * 현재 화면 방향을 감지하는 훅
 * @returns Orientation - 화면 방향
 */
export function useOrientation() {
  const [orientation, setOrientation] = useState<Orientation>("portrait");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateOrientation = () => {
      if (window.innerWidth > window.innerHeight) {
        setOrientation("landscape");
      } else {
        setOrientation("portrait");
      }
    };

    // 초기값 설정
    updateOrientation();

    // 화면 크기 변경 시 방향 업데이트
    window.addEventListener("resize", updateOrientation);
    
    // 모바일 기기의 방향 변경 이벤트 처리
    window.addEventListener("orientationchange", updateOrientation);

    return () => {
      window.removeEventListener("resize", updateOrientation);
      window.removeEventListener("orientationchange", updateOrientation);
    };
  }, []);

  return orientation;
}

/**
 * 특정 breakpoint보다 큰지 확인하는 훅
 * @param breakpoint 비교할 breakpoint
 * @returns boolean - 현재 화면이 지정된 breakpoint보다 큰지 여부
 */
export function useBreakpoint(breakpoint: BreakpointKey) {
  const [isAboveBreakpoint, setIsAboveBreakpoint] = useState<boolean | undefined>(
    undefined
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mql = window.matchMedia(`(min-width: ${BREAKPOINTS[breakpoint]}px)`);
    const onChange = () => setIsAboveBreakpoint(mql.matches);
    
    // 초기값 설정
    setIsAboveBreakpoint(mql.matches);
    
    mql.addEventListener("change", onChange);
    
    return () => mql.removeEventListener("change", onChange);
  }, [breakpoint]);

  return isAboveBreakpoint;
}

/**
 * 현재 활성화된 정확한 breakpoint를 반환하는 훅
 * @returns BreakpointKey - 현재 활성화된 breakpoint
 */
export function useActiveBreakpoint() {
  const [windowWidth, setWindowWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // 초기 너비 설정
    setWindowWidth(window.innerWidth);
    
    // 리사이즈 이벤트 리스너
    const handleResize = () => setWindowWidth(window.innerWidth);
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 현재 breakpoint 계산
  const activeBreakpoint = useMemo<BreakpointKey>(() => {
    if (typeof windowWidth !== "number") {
      return "md"; // 서버 사이드에서 기본값
    }

    // 현재 너비에 해당하는 가장 큰 breakpoint 찾기
    if (windowWidth >= BREAKPOINTS["2xl"]) return "2xl";
    if (windowWidth >= BREAKPOINTS.xl) return "xl";
    if (windowWidth >= BREAKPOINTS.lg) return "lg";
    if (windowWidth >= BREAKPOINTS.md) return "md";
    if (windowWidth >= BREAKPOINTS.sm) return "sm";
    return "xs";
  }, [windowWidth]);

  return activeBreakpoint;
}
