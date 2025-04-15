// 기본 User 타입 정의
export type User = {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
};

// 사용자 권한 역할
export type UserRole = 'user' | 'admin' | 'super_admin';

export type Profile = {
  id: string;
  email: string;
  userId: string;
  full_name: string | null;
  avatar_url: string | null;
  school?: string | null;
  department?: string | null;
  bio?: string | null;
  created_at: string;
  updated_at: string;
};

export type Club = {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  created_by: string;
  category?: string | null;
  member_count?: number;
  created_at: string;
  updated_at: string;
};

// 동아리 상세 정보 (추가 필드 포함)
export type ClubDetails = Club & {
  members: ClubMember[];
  sessions?: AttendanceSession[];
  userRole?: 'admin' | 'member';
};

export type ClubMember = {
  id: string;
  club_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  profile?: Profile;
};

export type AttendanceSession = {
  id: string;
  club_id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_time: string;
  end_time: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  attendance_count?: number;
};

// 세션 상세 정보 (출석 기록 포함)
export type AttendanceSessionDetails = AttendanceSession & {
  records?: AttendanceRecord[];
  club?: Club;
};

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused';

export type Attendance = {
  id: string;
  session_id: string;
  user_id: string;
  status: AttendanceStatus;
  check_in_time: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
  profile?: Profile;
};

// 출석 기록 타입 (애플리케이션에서 사용)
export type AttendanceRecord = Omit<Attendance, 'profile'> & {
  profile?: Profile;
};

export type ClubInvite = {
  id: string;
  club_id: string;
  code: string;
  created_by: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// API 응답 타입
export type ApiResponse<T> = {
  data?: T;
  error?: {
    message: string;
    code?: string;
    status?: number;
  };
  status: 'success' | 'error';
};

// 페이지네이션 타입
export type PaginatedResult<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
};

// 출석 통계 타입
export type AttendanceStats = {
  totalSessions: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  excusedCount: number;
  attendanceRate: number;
};

// 멤버 통계 타입
export type MemberStats = {
  userId: string;
  name: string;
  avatar_url?: string | null;
  totalAttendance: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  attendanceRate: number;
};

// 세션 통계 타입
export type SessionStats = {
  id: string;
  title: string;
  date: string;
  totalMembers: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  attendanceRate: number;
};

// QR 코드 데이터 타입
export type QrCodeData = {
  sessionId: string;
  timestamp: number;
  expiresAt: number;
  signature: string;
};

// 유틸리티 타입: 부분 업데이트 타입
export type PartialWithId<T> = { id: string } & Partial<T>;

// 유틸리티 타입: 폼 상태
export type FormState = 'idle' | 'submitting' | 'success' | 'error';