"use client"

import { useEffect, useState } from 'react'
import { Profile } from '@/lib/types'
import { getUserProfile } from '@/lib/supabase'

const USER_PROFILE_KEY = 'user-profile'

export function useUserProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // 로컬 스토리지에서 사용자 프로필 정보 불러오기
  const loadProfileFromStorage = (): Profile | null => {
    if (typeof window === 'undefined') return null
    
    const storedProfile = localStorage.getItem(USER_PROFILE_KEY)
    if (storedProfile) {
      try {
        return JSON.parse(storedProfile)
      } catch (e) {
        console.error('프로필 파싱 오류:', e)
        return null
      }
    }
    return null
  }

  // 프로필 정보를 로컬 스토리지에 저장하는 함수
  const saveProfileToStorage = (profile: Profile) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile))
  }

  // 프로필 데이터 가져오기 - 로컬 스토리지 확인 후 없으면 API 호출
  const fetchProfile = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // 1. 먼저 로컬 스토리지 확인
      const storedProfile = loadProfileFromStorage()
      
      if (storedProfile) {
        setProfile(storedProfile)
        setLoading(false)
        return
      }
      
      // 2. 로컬 스토리지에 없다면 API 호출로 가져오기
      const profileData = await getUserProfile()
      
      if (!profileData) {
        // 프로필 데이터가 없으면 오류를 던지지 말고 null 설정
        console.log('사용자 프로필을 찾을 수 없습니다. 로그인되지 않았거나 프로필이 없는 상태입니다.');
        setProfile(null);
        return;
      }
      
      setProfile(profileData as Profile)
      // 데이터 로컬 스토리지에 저장
      saveProfileToStorage(profileData as Profile)
    } catch (err) {
      console.error('프로필 불러오기 오류:', err)
      setError(err instanceof Error ? err : new Error('프로필을 불러오는 중 오류가 발생했습니다.'))
    } finally {
      setLoading(false)
    }
  }

  // 프로필 갱신 함수 (로그인 후나 프로필 업데이트 후 호출)
  const refreshProfile = async () => {
    return fetchProfile()
  }

  // 프로필 초기화 (로그아웃 시 호출)
  const clearProfile = () => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(USER_PROFILE_KEY)
    setProfile(null)
  }

  // 컴포넌트 마운트 시 프로필 로드
  useEffect(() => {
    fetchProfile()
  }, [])

  return { 
    profile, 
    loading, 
    error, 
    refreshProfile,
    clearProfile
  }
}