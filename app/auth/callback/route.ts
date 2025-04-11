import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Supabase의 이메일 확인 링크를 클릭하면 이 경로로 리디렉션됨
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    try {
      // Supabase의 이메일 확인 코드 처리
      await supabase.auth.exchangeCodeForSession(code);
      
      // 인증 성공 후 대시보드로 리디렉션
      return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
    } catch (error) {
      console.error('인증 콜백 처리 중 오류:', error);
      return NextResponse.redirect(`${requestUrl.origin}/login?error=인증에 실패했습니다`);
    }
  }

  // 코드가 없는 경우 로그인 페이지로 리디렉션
  return NextResponse.redirect(`${requestUrl.origin}/login`);
}