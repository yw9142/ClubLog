import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Supabase의 이메일 확인 링크를 클릭하면 이 경로로 리디렉션됨
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next');
  const type = requestUrl.searchParams.get('type'); // Supabase가 보내는 type 파라미터

  if (code) {
    try {
      // Supabase의 이메일 확인 코드 처리
      await supabase.auth.exchangeCodeForSession(code);
      
      // 다음 페이지가 지정되어 있으면 해당 페이지로 리다이렉션
      if (next) {
        return NextResponse.redirect(`${requestUrl.origin}${next}`);
      }
      
      // 비밀번호 재설정 링크인 경우 비밀번호 재설정 페이지로 리다이렉션
      if (type === 'recovery') {
        return NextResponse.redirect(`${requestUrl.origin}/reset-password`);
      }
      
      // 기본적으로는 대시보드로 리다이렉션
      return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
    } catch (error) {
      console.error('인증 콜백 처리 중 오류:', error);
      return NextResponse.redirect(`${requestUrl.origin}/login?error=인증에 실패했습니다`);
    }
  }

  // 코드가 없는 경우 로그인 페이지로 리디렉션
  return NextResponse.redirect(`${requestUrl.origin}/login`);
}