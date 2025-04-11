import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 로그인이 필요한 경로 목록
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/settings',
  '/clubs/create',
  '/clubs/[id]/manage',
  '/attendance/create',
  '/attendance/[id]/qr',
  '/attendance/scan',
  '/statistics'
]

// 로그인하지 않아도 접근 가능한 경로 목록
const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/auth/callback'
]

export async function middleware(request: NextRequest) {
  // 현재 URL 경로
  const { pathname } = request.nextUrl

  // Supabase 클라이언트 생성
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  // 쿠키 가져오기
  const supabaseAccessToken = request.cookies.get('sb-access-token')?.value
  const supabaseRefreshToken = request.cookies.get('sb-refresh-token')?.value

  // 로그인 상태 확인
  let isAuthenticated = false
  
  if (supabaseAccessToken && supabaseRefreshToken) {
    // 액세스 토큰이 있으면 로그인된 상태로 간주
    isAuthenticated = true
  }

  // 경로가 보호된 경로인지 확인하는 함수
  const isProtectedRoute = () => {
    // 정확히 일치하는 경로 확인
    if (protectedRoutes.includes(pathname)) return true
    
    // 동적 경로 패턴 확인
    return protectedRoutes.some(route => {
      if (!route.includes('[') && !route.includes(']')) return false
      const pattern = route.replace(/\[.*?\]/g, '[^/]+')
      const regex = new RegExp(`^${pattern}$`.replace(/\//g, '\\/'))
      return regex.test(pathname)
    })
  }

  // 보호된 경로에 비로그인 사용자가 접근하는 경우
//   if (isProtectedRoute() && !isAuthenticated) {
//     const redirectUrl = new URL('/', request.url)
//     return NextResponse.redirect(redirectUrl)
//   }

  // 이미 로그인한 사용자가 로그인/가입 페이지에 접근하는 경우
  if (isAuthenticated && (pathname === '/login' || pathname === '/signup')) {
    const redirectUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

// 미들웨어가 적용될 경로 패턴 지정
export const config = {
  matcher: [
    /*
     * 미들웨어를 적용할 모든 경로 패턴을 여기에 추가
     * '/((?!api|_next/static|_next/image|favicon.ico).*)'는 특정 경로(api, static 리소스 등)를 제외한 모든 경로를 의미
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}