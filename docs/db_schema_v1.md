# DB 스키마 및 RLS 정책 설계 (Supabase/Postgres)

---

## 1. participants (참가자)
```sql
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
```

## 2. comments (채팅 메시지)
```sql
create table comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references participants(id),
  user_role text not null,
  text text not null,
  created_at timestamp with time zone default now()
);
```

## 3. notices (공지)
```sql
create table notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  created_at timestamp with time zone default now()
);
```

## 4. invites (초대코드)
```sql
create table invites (
  id serial primary key,
  code text not null,
  role text not null,
  used boolean default false,
  created_at timestamp with time zone default now()
);
```

---

## 5. RLS(행 수준 보안) 정책 예시
```sql
-- participants
alter table participants enable row level security;
create policy "Allow read" on participants for select using (true);
create policy "Allow insert with invite" on participants for insert using (invite_code is not null and approved = false);
create policy "Allow update self" on participants for update using (auth.uid() = id);

-- comments
alter table comments enable row level security;
create policy "Allow read/write" on comments for all using (true) with check (true);

-- notices
alter table notices enable row level security;
create policy "Allow read" on notices for select using (true);
create policy "Admin write" on notices for insert using (EXISTS (SELECT 1 FROM participants WHERE participants.id = auth.uid() AND participants.role = 'admin'));

-- invites
alter table invites enable row level security;
create policy "Admin insert" on invites for insert using (EXISTS (SELECT 1 FROM participants WHERE participants.id = auth.uid() AND participants.role in ('admin','staff')));
```

---

> 실제 배포시, 역할별 정책/조건/인덱스 등 추가 설계 필요
