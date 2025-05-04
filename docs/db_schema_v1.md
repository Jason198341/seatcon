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
  created_at timestamp with time zone default now()
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

---

## 4. RLS(행 수준 보안) 정책 예시
```sql
-- participants
alter table participants enable row level security;
create policy "Allow read" on participants for select using (true);

-- comments
alter table comments enable row level security;
create policy "Allow read/write" on comments for all using (true) with check (true);

-- notices
alter table notices enable row level security;
create policy "Allow read" on notices for select using (true);
```

---

> 실제 배포시, 역할별 정책/조건/인덱스 등 추가 설계 필요
