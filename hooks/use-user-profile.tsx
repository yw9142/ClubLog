"use client"

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Profile } from '@/lib/types';
import { getUserProfile } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';
import { storage } from '@/lib/utils';

const USER_PROFILE_KEY = 'user-profile';
const QUERY_KEY = ['user-profile'];

export function useUserProfile() {
  const queryClient = useQueryClient();

  // 프로필 정보 가져오기
  const { 
    data: profile, 
    isLoading: loading, 
    error,
    refetch 
  } = useQuery<Profile | null, Error>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      try {
        // 1. 먼저 로컬 스토리지에서 가져오기
        const cachedProfile = storage.get<Profile>(USER_PROFILE_KEY);
        
        // 2. API로 가져오기
        const profileData = await getUserProfile();
        
        if (!profileData) {
          // 프로필 데이터가 없다면 로컬 캐시 삭제 및 null 반환
          storage.remove(USER_PROFILE_KEY);
          return null;
        }
        
        // 새로 받아온 데이터를 로컬 스토리지에 저장
        storage.set(USER_PROFILE_KEY, profileData);
        
        return profileData as Profile;
      } catch (err) {
        console.error('프로필 불러오기 오류:', err);
        throw err instanceof Error ? err : new Error('프로필을 불러오는 중 오류가 발생했습니다.');
      }
    },
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    retry: 1, // 실패 시 1회 재시도
    initialData: () => {
      // 초기 데이터로 로컬 스토리지의 데이터 사용
      return storage.get<Profile>(USER_PROFILE_KEY) || null;
    }
  });

  // 프로필 업데이트 뮤테이션
  const { 
    mutate: updateProfile,
    isPending: isUpdating 
  } = useMutation({
    mutationFn: async (profileData: Partial<Profile>) => {
      if (!profile?.id) {
        throw new Error('프로필 ID가 없습니다.');
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', profile.id)
        .select()
        .single();
        
      if (error) throw error;
      return data as Profile;
    },
    onSuccess: (newProfile) => {
      // 쿼리 캐시 업데이트
      queryClient.setQueryData(QUERY_KEY, newProfile);
      
      // 로컬 스토리지 업데이트
      storage.set(USER_PROFILE_KEY, newProfile);
    },
  });

  // 프로필 갱신 함수
  const refreshProfile = async () => {
    return refetch();
  };

  // 프로필 초기화 (로그아웃 시)
  const clearProfile = () => {
    storage.remove(USER_PROFILE_KEY);
    queryClient.setQueryData(QUERY_KEY, null);
  };

  // 인증 상태 변경 감지 (로그인/로그아웃)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_IN') {
          refreshProfile();
        } else if (event === 'SIGNED_OUT') {
          clearProfile();
        }
      }
    );

    // 클린업 함수
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { 
    profile, 
    loading, 
    error, 
    refreshProfile,
    clearProfile,
    updateProfile,
    isUpdating
  };
}