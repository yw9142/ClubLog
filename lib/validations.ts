import { z } from 'zod';

// 사용자 회원가입 스키마
export const signupSchema = z.object({
  email: z.string()
    .email('유효한 이메일 주소를 입력해주세요.'),
  password: z.string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다.')
    .regex(/[a-zA-Z]/, '영문자를 포함해야 합니다.')
    .regex(/[0-9]/, '숫자를 포함해야 합니다.')
    .regex(/[^a-zA-Z0-9]/, '특수문자를 포함해야 합니다.'),
  confirmPassword: z.string(),
  full_name: z.string()
    .min(2, '이름은 최소 2자 이상이어야 합니다.'),
  school: z.string()
    .min(2, '학교명을 입력해주세요.'),
  department: z.string()
    .optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다.',
  path: ['confirmPassword'],
});

export type SignupFormValues = z.infer<typeof signupSchema>;

// 로그인 스키마
export const loginSchema = z.object({
  email: z.string()
    .email('유효한 이메일 주소를 입력해주세요.'),
  password: z.string()
    .min(1, '비밀번호를 입력해주세요.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

// 동아리 생성 스키마
export const clubSchema = z.object({
  name: z.string()
    .min(2, '동아리명은 최소 2자 이상이어야 합니다.')
    .max(50, '동아리명은 최대 50자까지 가능합니다.'),
  description: z.string()
    .min(10, '설명은 최소 10자 이상이어야 합니다.')
    .max(500, '설명은 최대 500자까지 가능합니다.'),
  category: z.string().optional(),
  logo: z.any().optional(),
});

export type ClubFormValues = z.infer<typeof clubSchema>;

// 출석 세션 생성 스키마
export const attendanceSessionSchema = z.object({
  title: z.string()
    .min(2, '제목은 최소 2자 이상이어야 합니다.')
    .max(100, '제목은 최대 100자까지 가능합니다.'),
  startTime: z.string()
    .min(1, '시작 시간을 선택해주세요.'),
  endTime: z.string()
    .min(1, '종료 시간을 선택해주세요.'),
  location: z.string().optional(),
  description: z.string().optional(),
}).refine((data) => {
  // 시간 문자열을 Date 객체로 변환
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  
  // 종료 시간이 시작 시간보다 나중인지 확인
  return end > start;
}, {
  message: '종료 시간은 시작 시간보다 나중이어야 합니다.',
  path: ['endTime'],
});

export type AttendanceSessionFormValues = z.infer<typeof attendanceSessionSchema>;

// 동아리 멤버 초대 스키마
export const inviteSchema = z.object({
  emails: z.array(
    z.string().email('유효한 이메일 주소를 입력해주세요.')
  ).min(1, '최소 한 명의 이메일을 입력해주세요.'),
  role: z.enum(['member', 'admin'], {
    required_error: '역할을 선택해주세요.',
  }),
  message: z.string().optional(),
});

export type InviteFormValues = z.infer<typeof inviteSchema>;

// 프로필 수정 스키마
export const profileSchema = z.object({
  full_name: z.string()
    .min(2, '이름은 최소 2자 이상이어야 합니다.'),
  school: z.string()
    .min(2, '학교명을 입력해주세요.'),
  department: z.string().optional(),
  bio: z.string().max(200, '자기소개는 최대 200자까지 가능합니다.').optional(),
  avatar: z.any().optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;