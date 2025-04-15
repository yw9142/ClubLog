"use client";

import { Suspense, lazy, ComponentType } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface DynamicImportProps {
  importFn: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ReactNode;
  props?: Record<string, any>;
}

/**
 * 동적 임포트를 위한 래퍼 컴포넌트
 * @param importFn 동적으로 로드할 컴포넌트를 반환하는 함수
 * @param fallback 로딩 중 표시할 fallback UI
 * @param props 컴포넌트에 전달할 props
 */
export function DynamicImport({ 
  importFn, 
  fallback, 
  props = {} 
}: DynamicImportProps) {
  const LazyComponent = lazy(importFn);

  return (
    <Suspense fallback={fallback || <DefaultFallback />}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

const DefaultFallback = () => (
  <div className="w-full flex items-center justify-center p-4">
    <div className="w-full">
      <Skeleton className="h-8 w-full mb-2" />
      <Skeleton className="h-24 w-full mb-2" />
      <Skeleton className="h-8 w-3/4" />
    </div>
  </div>
);

/**
 * 동적으로 차트 컴포넌트를 로드하는 함수
 * 페이지 초기 로드 시 차트 라이브러리를 불러오지 않아 로딩 속도 개선
 */
export function DynamicChart(props: any) {
  return (
    <DynamicImport
      importFn={() => import("@/components/ui/chart")}
      props={props}
      fallback={
        <div className="w-full h-80 bg-muted/20 rounded-md flex items-center justify-center">
          <p className="text-muted-foreground">차트 로딩 중...</p>
        </div>
      }
    />
  );
}

/**
 * 동적으로 QR 스캐너 컴포넌트를 로드하는 함수
 */
export function DynamicQrScanner(props: any) {
  return (
    <DynamicImport
      importFn={() => import("@/components/qr-scanner")}
      props={props}
      fallback={
        <div className="w-full aspect-square bg-muted/20 rounded-md flex items-center justify-center">
          <p className="text-muted-foreground">QR 스캐너 로딩 중...</p>
        </div>
      }
    />
  );
}

/**
 * 동적으로 QR 생성 컴포넌트를 로드하는 함수
 */
export function DynamicQrGenerator(props: any) {
  return (
    <DynamicImport
      importFn={() => import("@/components/qr-generator")}
      props={props}
      fallback={
        <div className="w-64 h-64 bg-muted/20 rounded-md flex items-center justify-center mx-auto">
          <p className="text-muted-foreground">QR 코드 생성 중...</p>
        </div>
      }
    />
  );
}

/**
 * 동적으로 통계 대시보드 컴포넌트를 로드하는 함수
 */
export function DynamicStatsDashboard(props: any) {
  return (
    <DynamicImport
      importFn={() => import("@/components/stats-dashboard")}
      props={props}
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      }
    />
  );
}