'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// 서버 컴포넌트를 위한 클라이언트 생성 함수
export async function createClient() {
  const cookieStore = cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name, options) {
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );
}

// 현재 인증된 사용자 세션 가져오기
export async function getServerSession() {
  const supabase = await createClient();
  return await supabase.auth.getSession();
}

// 서버 컴포넌트에서 현재 사용자 프로필 가져오기
export async function getServerUserProfile() {
  const supabase = await createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  
  if (!data) return null;
  
  return {
    ...data,
    email: session.user.email
  };
}