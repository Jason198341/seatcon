-- 참가자 테이블
create table participants (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  role text not null,
  language text,
  created_at timestamp with time zone default now(),
  invite_code text,
  approved boolean default false
);

-- 메시지 테이블
create table comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references participants(id),
  user_role text not null,
  text text not null,
  created_at timestamp with time zone default now()
);

-- 공지 테이블
create table notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  created_at timestamp with time zone default now()
);

-- 초대코드 테이블
create table invites (
  id serial primary key,
  code text not null,
  role text not null,
  used boolean default false,
  created_at timestamp with time zone default now()
);

-- RLS 정책
alter table participants enable row level security;
create policy "Allow read" on participants for select using (true);
create policy "Allow insert with invite" on participants for insert using (invite_code is not null and approved = false);
create policy "Allow update self" on participants for update using (auth.uid() = id);

alter table comments enable row level security;
create policy "Allow read/write" on comments for all using (true) with check (true);

alter table notices enable row level security;
create policy "Allow read" on notices for select using (true);
create policy "Admin write" on notices for insert using (EXISTS (SELECT 1 FROM participants WHERE participants.id = auth.uid() AND participants.role = 'admin'));

alter table invites enable row level security;
create policy "Admin insert" on invites for insert using (EXISTS (SELECT 1 FROM participants WHERE participants.id = auth.uid() AND participants.role in ('admin','staff')));
