"use client";

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { supabase } from '@/lib/supabase';

// 실시간 출석 상태 조회 훅
export function useRealtimeAttendance(sessionId: string | undefined) {
  const [isSubscribed, setIsSubscribed] = useState(false);

  // 출석 기록 데이터 가져오기
  const fetcher = async (key: string) => {
    const [_, id] = key.split('/');
    if (!id) return [];
    
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*, profiles(*)')
      .eq('session_id', id);
    
    if (error) throw error;
    return data;
  };

  const { data, error, mutate } = useSWR(
    sessionId ? `attendance/${sessionId}` : null,
    fetcher,
    {
      refreshInterval: 5000, // 5초마다 자동 갱신
      revalidateOnFocus: true,
      dedupingInterval: 2000, // 2초 내에 중복 요청 방지
    }
  );

  // 실시간 업데이트를 위한 Supabase 구독 설정
  useEffect(() => {
    if (!sessionId || isSubscribed) return;

    const channel = supabase
      .channel(`attendance_${sessionId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'attendance_records', 
          filter: `session_id=eq.${sessionId}` 
        },
        (payload) => {
          console.log('실시간 출석 데이터 변경:', payload);
          // 데이터 변경 감지 시 캐시 갱신
          mutate();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`출석 세션 ${sessionId}에 대한 실시간 구독 활성화`);
          setIsSubscribed(true);
        }
      });

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      console.log(`출석 세션 ${sessionId}에 대한 실시간 구독 해제`);
      channel.unsubscribe();
      setIsSubscribed(false);
    };
  }, [sessionId, mutate, isSubscribed]);

  return {
    records: data || [],
    isLoading: !error && !data,
    isError: !!error,
    error,
    refresh: mutate,
    isSubscribed
  };
}