-- 참가자 테이블
create table participants (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  role text not null,
  language text,
  created_at timestamp with time zone default now()
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

-- RLS 정책
alter table participants enable row level security;
create policy "Allow read" on participants for select using (true);

alter table comments enable row level security;
create policy "Allow read/write" on comments for all using (true) with check (true);

alter table notices enable row level security;
create policy "Allow read" on notices for select using (true);
