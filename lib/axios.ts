"use client";

import axios from 'axios';
import { supabase } from './supabase';
import { toast } from '@/components/ui/use-toast';

// 기본 Axios 인스턴스 생성
export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10초
});

// 요청 인터셉터: 인증 토큰 추가
api.interceptors.request.use(
  async (config) => {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      return config;
    } catch (error) {
      console.error('요청 인터셉터 에러:', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 에러 처리 및 토큰 갱신
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    
    // 401 에러 (인증 실패) & 재시도 안했을 경우
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // 세션 갱신 시도
        const { data, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !data.session) {
          // 세션 갱신 실패 시 로그인 페이지로 이동
          toast({
            title: '로그인이 필요합니다',
            description: '세션이 만료되었습니다. 다시 로그인해 주세요.',
            variant: 'destructive',
          });
          
          // 로그인 페이지로 리다이렉트
          window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
          return Promise.reject(error);
        }
        
        // 토큰 갱신 성공 - 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${data.session.access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    
    // 다른 에러 처리
    if (status === 403) {
      toast({
        title: '접근 권한이 없습니다',
        description: '이 작업을 수행할 권한이 없습니다.',
        variant: 'destructive',
      });
    } else if (status === 404) {
      toast({
        title: '리소스를 찾을 수 없습니다',
        description: '요청한 정보를 찾을 수 없습니다.',
        variant: 'destructive',
      });
    } else if (status >= 500) {
      toast({
        title: '서버 오류',
        description: '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
        variant: 'destructive',
      });
    }
    
    return Promise.reject(error);
  }
);

// API 요청 래퍼 함수
export const apiClient = {
  get: async <T>(url: string, params?: any): Promise<T> => {
    const response = await api.get<T>(url, { params });
    return response.data;
  },
  
  post: async <T>(url: string, data?: any): Promise<T> => {
    const response = await api.post<T>(url, data);
    return response.data;
  },
  
  put: async <T>(url: string, data?: any): Promise<T> => {
    const response = await api.put<T>(url, data);
    return response.data;
  },
  
  patch: async <T>(url: string, data?: any): Promise<T> => {
    const response = await api.patch<T>(url, data);
    return response.data;
  },
  
  delete: async <T>(url: string): Promise<T> => {
    const response = await api.delete<T>(url);
    return response.data;
  },
};