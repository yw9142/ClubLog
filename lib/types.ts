export type Profile = {
  id: string;
  email: string;
  userId: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Club = {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
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