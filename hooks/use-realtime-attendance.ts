"use client";

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { supabase } from '@/lib/supabase';

// 실시간 출석 상태 조회 훅
export function useRealtimeAttendance(sessionId: string | undefined) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [realTimeData, setRealTimeData] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // 출석 기록 데이터 가져오기
  const fetcher = async (key: string) => {
    const [_, id] = key.split('/');
    if (!id) return [];
    
    const { data, error } = await supabase
      .from('attendances')
      .select('*, profiles(*)')
      .eq('session_id', id);
    
    if (error) throw error;
    
    // 실시간 데이터가 있으면 우선 사용
    if (realTimeData.length > 0) {
      return realTimeData;
    }
    
    return data;
  };

  const { data, error, mutate } = useSWR(
    sessionId ? `attendance/${sessionId}` : null,
    fetcher,
    {
      refreshInterval: 3000, // 3초마다 자동 갱신
      revalidateOnFocus: true,
      dedupingInterval: 1000, // 1초 내에 중복 요청 방지
      refreshWhenHidden: true,
      revalidateOnReconnect: true,
      shouldRetryOnError: true,
    }
  );

  // 직접 데이터를 다시 가져오는 함수
  const fetchLatestData = async () => {
    if (!sessionId) return;
    
    try {
      const { data: freshData, error: fetchError } = await supabase
        .from('attendances')
        .select('*, profiles(*)')
        .eq('session_id', sessionId);
      
      if (fetchError) throw fetchError;
      
      if (freshData) {
        setRealTimeData(freshData);
        setLastUpdate(Date.now());
        // SWR 캐시도 강제로 업데이트
        mutate(freshData, false);
      }
    } catch (err) {
      console.error('출석 데이터 가져오기 실패:', err);
    }
  };

  // 실시간 업데이트를 위한 Supabase 구독 설정
  useEffect(() => {
    if (!sessionId || isSubscribed) return;

    const channel = supabase
      .channel(`attendance_${sessionId}_${Date.now()}`) // 고유 채널명 생성
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'attendances', 
          filter: `session_id=eq.${sessionId}` 
        },
        (payload) => {
          console.log('실시간 출석 데이터 변경:', payload);
          // 데이터 변경 감지 시 즉시 최신 데이터 가져오기
          fetchLatestData();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`출석 세션 ${sessionId}에 대한 실시간 구독 활성화`);
          setIsSubscribed(true);
          // 구독 시작 시 최신 데이터 가져오기
          fetchLatestData();
        }
      });

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      console.log(`출석 세션 ${sessionId}에 대한 실시간 구독 해제`);
      channel.unsubscribe();
      setIsSubscribed(false);
    };
  }, [sessionId]);

  // lastUpdate가 변경될 때마다 데이터 갱신
  useEffect(() => {
    if (data && lastUpdate) {
      mutate();
    }
  }, [lastUpdate, mutate]);

  // 실제로 사용할 데이터 (실시간 데이터가 있으면 우선 사용)
  const records = realTimeData.length > 0 ? realTimeData : (data || []);

  return {
    records: records,
    isLoading: !error && !data && realTimeData.length === 0,
    isError: !!error,
    error,
    refresh: fetchLatestData, // 직접 갱신 함수 제공
    isSubscribed
  };
}