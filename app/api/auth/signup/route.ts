import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId, password, metadata } = await request.json();

    console.log('서버 API - 회원가입 시도:', { userId, hasPassword: !!password });

    // 먼저 해당 userId가 이미 존재하는지 확인
    const { data: existingUser, error: lookupError } = await supabaseAdmin
      .from('profiles')
      .select('userid')
      .eq('userid', userId)
      .maybeSingle();
      
    if (lookupError) {
      console.error('서버 API - 사용자 조회 중 오류:', lookupError);
      return NextResponse.json({ error: '사용자 조회 중 오류가 발생했습니다.' }, { status: 500 });
    }
    
    if (existingUser) {
      return NextResponse.json(
        { error: { message: '이미 사용 중인 아이디입니다.', status: 409 } }, 
        { status: 409 }
      );
    }
    
    // 새 사용자 ID 생성 (UUID)
    const newUserId = crypto.randomUUID();
    
    // 가상 이메일 생성 (email 필드가 필수이므로)
    const email = `${userId}@club-attendance.com`;
    
    // profiles 테이블에 사용자 정보 추가 - 서버 측에서 supabaseAdmin으로 실행
    const { data: profile, error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUserId,
        email: email,
        userid: userId,
        full_name: metadata?.full_name || '',
        school: metadata?.school || '',
        department: metadata?.department || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (insertError) {
      console.error('서버 API - 프로필 생성 실패:', insertError);
      console.log('supabaseAdmin 객체:', !!supabaseAdmin);
      console.log('서버 환경 검사:', {
        hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      });
      return NextResponse.json({ error: insertError }, { status: 500 });
    }
    
    const user = {
      id: profile.id,
      userId: profile.userid,
      email: profile.email,
      full_name: profile.full_name,
      school: profile.school,
      department: profile.department
    };
    
    // 비밀번호 정보는 클라이언트로 전송 - 클라이언트에서 로컬 스토리지에 저장
    return NextResponse.json({ 
      data: { 
        user,
        password,
        success: true
      }
    });
    
  } catch (err: any) {
    console.error('서버 API - 회원가입 예외:', err);
    return NextResponse.json({ error: err.message || '알 수 없는 오류가 발생했습니다.' }, { status: 500 });
  }
}