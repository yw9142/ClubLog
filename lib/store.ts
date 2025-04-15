"use client";

import { create } from 'zustand'
import { getUserProfile, signOut } from './supabase'
import type { User } from './types'

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,
  fetchUser: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await getUserProfile();
      set({ user, isLoading: false });
    } catch (error) {
      set({ error: '사용자 정보를 불러오는데 실패했습니다.', isLoading: false });
    }
  },
  logout: async () => {
    set({ isLoading: true });
    try {
      await signOut();
      set({ user: null, isLoading: false });
    } catch (error) {
      set({ error: '로그아웃에 실패했습니다.', isLoading: false });
    }
  }
}));

interface ClubState {
  currentClub: any | null;
  userClubs: any[];
  isLoading: boolean;
  error: string | null;
  fetchUserClubs: () => Promise<void>;
  setCurrentClub: (club: any) => void;
}

export const useClubStore = create<ClubState>((set, get) => ({
  currentClub: null,
  userClubs: [],
  isLoading: false,
  error: null,
  fetchUserClubs: async () => {
    set({ isLoading: true, error: null });
    try {
      // 여기에 Supabase에서 사용자의 클럽 정보를 가져오는 로직 구현
      // const { data, error } = await supabase.from('club_members').select('club_id, clubs(*)').eq('user_id', userId);
      // if (error) throw error;
      // set({ userClubs: data.map(item => item.clubs), isLoading: false });
    } catch (error) {
      set({ error: '동아리 정보를 불러오는데 실패했습니다.', isLoading: false });
    }
  },
  setCurrentClub: (club) => {
    set({ currentClub: club });
  }
}));

interface AttendanceState {
  sessions: any[];
  currentSession: any | null;
  isLoading: boolean;
  error: string | null;
  fetchSessions: (clubId: string) => Promise<void>;
  setCurrentSession: (session: any) => void;
}

export const useAttendanceStore = create<AttendanceState>((set) => ({
  sessions: [],
  currentSession: null,
  isLoading: false,
  error: null,
  fetchSessions: async (clubId: string) => {
    set({ isLoading: true, error: null });
    try {
      // 여기에 Supabase에서 출석 세션 정보를 가져오는 로직 구현
      // const { data, error } = await supabase.from('attendance_sessions').select('*').eq('club_id', clubId);
      // if (error) throw error;
      // set({ sessions: data, isLoading: false });
    } catch (error) {
      set({ error: '출석 세션 정보를 불러오는데 실패했습니다.', isLoading: false });
    }
  },
  setCurrentSession: (session) => {
    set({ currentSession: session });
  }
}));