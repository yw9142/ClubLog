-- users 테이블 정의 (auth.users 확장)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  userId text not null,
  full_name text,
  avatar_url text,
  school text,
  department text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- RLS 정책 설정
alter table public.profiles enable row level security;
create policy "사용자는 자신의 프로필만 볼 수 있음" on public.profiles
  for select using (auth.uid() = id);
create policy "사용자는 자신의 프로필만 업데이트할 수 있음" on public.profiles
  for update using (auth.uid() = id);

-- clubs 테이블 정의
create table if not exists public.clubs (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  logo_url text,
  created_by uuid references public.profiles(id) not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- RLS 정책 설정
alter table public.clubs enable row level security;
create policy "모든 사용자가 동아리를 볼 수 있음" on public.clubs
  for select using (true);
create policy "생성자만 동아리를 수정할 수 있음" on public.clubs
  for update using (auth.uid() = created_by);
create policy "생성자만 동아리를 삭제할 수 있음" on public.clubs
  for delete using (auth.uid() = created_by);
create policy "인증된 사용자만 동아리를 생성할 수 있음" on public.clubs
  for insert with check (auth.uid() is not null);

-- club_members 테이블 정의
create table if not exists public.club_members (
  id uuid default gen_random_uuid() primary key,
  club_id uuid references public.clubs(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text check (role in ('admin', 'member')) not null default 'member',
  joined_at timestamp with time zone default now() not null,
  unique(club_id, user_id)
);

-- RLS 정책 설정
alter table public.club_members enable row level security;
create policy "모든 사용자가 동아리 멤버를 볼 수 있음" on public.club_members
  for select using (true);
create policy "동아리 관리자만 멤버를 추가할 수 있음" on public.club_members
  for insert with check (
    exists (
      select 1 from public.club_members
      where club_id = new.club_id and user_id = auth.uid() and role = 'admin'
    ) or 
    exists (
      select 1 from public.clubs
      where id = new.club_id and created_by = auth.uid()
    )
  );
create policy "동아리 관리자만 멤버를 삭제할 수 있음" on public.club_members
  for delete using (
    exists (
      select 1 from public.club_members
      where club_id = club_members.club_id and user_id = auth.uid() and role = 'admin'
    ) or 
    exists (
      select 1 from public.clubs
      where id = club_members.club_id and created_by = auth.uid()
    ) or 
    auth.uid() = user_id -- 자기 자신은 탈퇴할 수 있음
  );

-- attendance_sessions 테이블 정의
create table if not exists public.attendance_sessions (
  id uuid default gen_random_uuid() primary key,
  club_id uuid references public.clubs(id) on delete cascade not null,
  title text not null,
  description text,
  location text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  created_by uuid references public.profiles(id) not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- RLS 정책 설정
alter table public.attendance_sessions enable row level security;
create policy "동아리 멤버는 출석 세션을 볼 수 있음" on public.attendance_sessions
  for select using (
    exists (
      select 1 from public.club_members
      where club_id = attendance_sessions.club_id and user_id = auth.uid()
    )
  );
create policy "동아리 관리자만 출석 세션을 생성할 수 있음" on public.attendance_sessions
  for insert with check (
    exists (
      select 1 from public.club_members
      where club_id = new.club_id and user_id = auth.uid() and role = 'admin'
    ) or 
    exists (
      select 1 from public.clubs
      where id = new.club_id and created_by = auth.uid()
    )
  );
create policy "동아리 관리자만 출석 세션을 수정할 수 있음" on public.attendance_sessions
  for update using (
    exists (
      select 1 from public.club_members
      where club_id = attendance_sessions.club_id and user_id = auth.uid() and role = 'admin'
    ) or 
    exists (
      select 1 from public.clubs
      where id = attendance_sessions.club_id and created_by = auth.uid()
    )
  );
create policy "동아리 관리자만 출석 세션을 삭제할 수 있음" on public.attendance_sessions
  for delete using (
    exists (
      select 1 from public.club_members
      where club_id = attendance_sessions.club_id and user_id = auth.uid() and role = 'admin'
    ) or 
    exists (
      select 1 from public.clubs
      where id = attendance_sessions.club_id and created_by = auth.uid()
    )
  );

-- attendances 테이블 정의
create table if not exists public.attendances (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.attendance_sessions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status text check (status in ('present', 'late', 'absent', 'excused')) not null default 'absent',
  check_in_time timestamp with time zone,
  note text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  unique(session_id, user_id)
);

-- RLS 정책 설정
alter table public.attendances enable row level security;
create policy "동아리 멤버는 출석 현황을 볼 수 있음" on public.attendances
  for select using (
    exists (
      select 1 from public.attendance_sessions s
      join public.club_members m on s.club_id = m.club_id
      where s.id = attendances.session_id and m.user_id = auth.uid()
    )
  );
create policy "동아리 관리자는 출석을 기록할 수 있음" on public.attendances
  for insert with check (
    exists (
      select 1 from public.attendance_sessions s
      join public.club_members m on s.club_id = m.club_id
      where s.id = new.session_id and m.user_id = auth.uid() and m.role = 'admin'
    ) or
    exists (
      select 1 from public.attendance_sessions s
      join public.clubs c on s.club_id = c.id
      where s.id = new.session_id and c.created_by = auth.uid()
    ) or
    new.user_id = auth.uid() -- 자기 자신은 출석 체크 가능
  );
create policy "동아리 관리자는 출석을 수정할 수 있음" on public.attendances
  for update using (
    exists (
      select 1 from public.attendance_sessions s
      join public.club_members m on s.club_id = m.club_id
      where s.id = attendances.session_id and m.user_id = auth.uid() and m.role = 'admin'
    ) or
    exists (
      select 1 from public.attendance_sessions s
      join public.clubs c on s.club_id = c.id
      where s.id = attendances.session_id and c.created_by = auth.uid()
    )
  );

-- club_invites 테이블 정의
create table if not exists public.club_invites (
  id uuid default gen_random_uuid() primary key,
  club_id uuid references public.clubs(id) on delete cascade not null,
  code text not null unique,
  created_by uuid references public.profiles(id) not null,
  expires_at timestamp with time zone,
  is_active boolean default true not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- RLS 정책 설정
alter table public.club_invites enable row level security;
create policy "동아리 관리자는 초대 코드를 볼 수 있음" on public.club_invites
  for select using (
    exists (
      select 1 from public.club_members
      where club_id = club_invites.club_id and user_id = auth.uid() and role = 'admin'
    ) or
    exists (
      select 1 from public.clubs
      where id = club_invites.club_id and created_by = auth.uid()
    )
  );
create policy "동아리 관리자는 초대 코드를 생성할 수 있음" on public.club_invites
  for insert with check (
    exists (
      select 1 from public.club_members
      where club_id = new.club_id and user_id = auth.uid() and role = 'admin'
    ) or
    exists (
      select 1 from public.clubs
      where id = new.club_id and created_by = auth.uid()
    )
  );
create policy "동아리 관리자는 초대 코드를 수정할 수 있음" on public.club_invites
  for update using (
    exists (
      select 1 from public.club_members
      where club_id = club_invites.club_id and user_id = auth.uid() and role = 'admin'
    ) or
    exists (
      select 1 from public.clubs
      where id = club_invites.club_id and created_by = auth.uid()
    )
  );