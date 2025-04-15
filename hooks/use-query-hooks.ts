"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// 동아리 정보 조회 훅
export const useClubs = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['clubs', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('club_members')
        .select('club_id, role, clubs(*)')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      return data.map(item => ({
        ...item.clubs,
        role: item.role
      }));
    },
    enabled: !!userId,
  });
};

// 특정 동아리 정보 조회 훅
export const useClub = (clubId: string | undefined) => {
  return useQuery({
    queryKey: ['club', clubId],
    queryFn: async () => {
      if (!clubId) return null;
      
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', clubId)
        .single();
      
      if (error) throw error;
      
      return data;
    },
    enabled: !!clubId,
  });
};

// 출석 세션 목록 조회 훅
export const useAttendanceSessions = (clubId: string | undefined) => {
  return useQuery({
    queryKey: ['attendance_sessions', clubId],
    queryFn: async () => {
      if (!clubId) return [];
      
      const { data, error } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('club_id', clubId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data;
    },
    enabled: !!clubId,
  });
};

// 특정 출석 세션 조회 훅
export const useAttendanceSession = (sessionId: string | undefined) => {
  return useQuery({
    queryKey: ['attendance_session', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      
      const { data, error } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      
      if (error) throw error;
      
      return data;
    },
    enabled: !!sessionId,
  });
};

// 특정 세션의 출석 기록 조회 훅
export const useAttendanceRecords = (sessionId: string | undefined) => {
  return useQuery({
    queryKey: ['attendance_records', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*, profiles(*)')
        .eq('session_id', sessionId);
      
      if (error) throw error;
      
      return data;
    },
    enabled: !!sessionId,
  });
};

// 출석 체크 mutation 훅
export const useAttendanceCheckIn = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      sessionId, 
      userId, 
      status 
    }: { 
      sessionId: string; 
      userId: string; 
      status: 'present' | 'late' | 'absent' 
    }) => {
      const { data, error } = await supabase
        .from('attendance_records')
        .upsert({
          session_id: sessionId,
          user_id: userId,
          status,
          checked_at: new Date().toISOString(),
        })
        .select();
      
      if (error) throw error;
      
      return data;
    },
    onSuccess: (_, variables) => {
      // 출석 기록 목록 갱신
      queryClient.invalidateQueries({ 
        queryKey: ['attendance_records', variables.sessionId] 
      });
    },
  });
};

// 동아리 생성 mutation 훅
export const useCreateClub = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      name, 
      description, 
      ownerId 
    }: { 
      name: string; 
      description: string; 
      ownerId: string 
    }) => {
      // 1. 동아리 생성
      const { data: club, error: clubError } = await supabase
        .from('clubs')
        .insert({
          name,
          description,
          owner_id: ownerId,
        })
        .select()
        .single();
      
      if (clubError) throw clubError;
      
      // 2. 소유자를 관리자로 추가
      const { error: memberError } = await supabase
        .from('club_members')
        .insert({
          club_id: club.id,
          user_id: ownerId,
          role: 'admin',
        });
      
      if (memberError) throw memberError;
      
      return club;
    },
    onSuccess: () => {
      // 동아리 목록 갱신
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
    },
  });
};

// 출석 세션 생성 mutation 훅
export const useCreateAttendanceSession = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      clubId, 
      title, 
      startTime, 
      endTime, 
      location 
    }: { 
      clubId: string; 
      title: string; 
      startTime: string; 
      endTime: string; 
      location?: string 
    }) => {
      const { data, error } = await supabase
        .from('attendance_sessions')
        .insert({
          club_id: clubId,
          title,
          start_time: startTime,
          end_time: endTime,
          location,
        })
        .select();
      
      if (error) throw error;
      
      return data;
    },
    onSuccess: (_, variables) => {
      // 출석 세션 목록 갱신
      queryClient.invalidateQueries({ 
        queryKey: ['attendance_sessions', variables.clubId] 
      });
    },
  });
};