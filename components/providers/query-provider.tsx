"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 기본 쿼리 옵션
            staleTime: 60 * 1000, // 1분 - 데이터가 오래된 것으로 간주되는 시간
            gcTime: 5 * 60 * 1000, // 5분 - 비활성 데이터의 가비지 컬렉션 시간
            refetchOnWindowFocus: false, // 윈도우 포커스 시 자동으로 데이터를 다시 가져오지 않음
            refetchOnMount: true, // 컴포넌트 마운트 시 데이터 다시 가져오기
            retry: 1, // 실패 시 1회 재시도
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // 지수 백오프 전략
          },
          mutations: {
            // 기본 뮤테이션 옵션
            retry: 1, // 실패 시 1회 재시도
            retryDelay: 1000, // 재시도 간격
          },
        },
      })
  );

  // 개발 환경에서만 React Query Devtools를 사용하기 위한 동적 임포트
  if (process.env.NODE_ENV === 'development') {
    // 캐시 히트/미스 로깅
    queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'queryUpdated') {
        const query = event.query;
        if (query.state.status === 'success' && query.state.dataUpdateCount > 0) {
          console.debug(
            `[Query Cache] ${query.queryKey}: ${
              query.state.dataUpdateCount === 1 ? '캐시 미스 (초기 로드)' : '캐시 업데이트'
            }`
          );
        }
      }
    });
  }

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}