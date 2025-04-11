import { createClient } from '@supabase/supabase-js';

// 환경 변수 로드
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// API 키 확인 로직 추가
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL 또는 API 키가 설정되지 않았습니다.');
  console.error('환경 변수:', { supabaseUrl, supabaseAnonKey: supabaseAnonKey ? '[설정됨]' : '[설정되지 않음]' });
}

// Supabase 클라이언트 생성
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

// 서버 사이드용 서비스 롤 클라이언트
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY as string;
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl || '', supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    })
  : supabase;

// 인증 관련 함수들
export async function signUp({ email, password, metadata }: { email: string; password: string; metadata?: any }) {
  try {
    console.log('회원가입 시도:', { email, hasPassword: !!password, metadata });
    
    // Supabase Auth를 사용한 회원가입
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: metadata?.full_name || '',
          school: metadata?.school || '',
          department: metadata?.department || '',
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
      }
    });
    
    if (error) {
      console.error('회원가입 실패:', error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (err) {
    console.error('회원가입 예외 발생:', err);
    return { data: null, error: err as any };
  }
}

export async function signIn({ email, password }: { email: string; password: string }) {
  try {
    console.log('로그인 시도:', { email, hasPassword: !!password });
    
    // Supabase Auth를 사용한 로그인
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('로그인 오류:', error);
      return { 
        data: { user: null, session: null }, 
        error: { message: '이메일 또는 비밀번호가 일치하지 않습니다.', status: 400 }
      };
    }
    
    return { data, error: null };
  } catch (err) {
    console.error('로그인 예외 발생:', err);
    return { data: { user: null, session: null }, error: err as any };
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (err) {
    console.error('로그아웃 오류:', err);
    return { error: err as any };
  }
}

export async function getUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (err) {
    console.error('사용자 정보 조회 오류:', err);
    return null;
  }
}

export async function getUserProfile() {
  try {
    const user = await getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error || !data) {
      console.error('사용자 프로필 조회 오류:', error);
      return null;
    }
    
    return {
      ...data,
      email: user.email
    };
  } catch (err) {
    console.error('사용자 프로필 조회 예외:', err);
    return null;
  }
}