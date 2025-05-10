-- schedules 테이블 생성
CREATE TABLE IF NOT EXISTS schedules (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time VARCHAR(5), -- HH:MM 형식
  end_time VARCHAR(5), -- HH:MM 형식
  location VARCHAR(100),
  type VARCHAR(50) CHECK (type IN ('컨퍼런스', '워크샵', '네트워킹', '전시', '기타')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 샘플 일정 데이터 삽입
INSERT INTO schedules (title, description, start_date, end_date, start_time, end_time, location, type) VALUES
('컨퍼런스 등록 및 티켓 발급', '컨퍼런스 참가자 등록 및 명찰 발급', '2025-05-10', '2025-05-10', '08:00', '09:00', '메인 로비', '컨퍼런스'),
('개회식', '컨퍼런스 개회식 및 환영사', '2025-05-10', '2025-05-10', '09:00', '09:30', '메인 컨퍼런스홀', '컨퍼런스'),
('협력사 발표 세션 1', '협력사 주요 발표 세션', '2025-05-10', '2025-05-10', '09:30', '12:00', '메인 컨퍼런스홀', '컨퍼런스'),
('중식', '참가자 점심 식사 제공', '2025-05-10', '2025-05-10', '12:00', '13:00', '구내 식당', '기타'),
('협력사 발표 세션 2', '협력사 주요 발표 세션', '2025-05-10', '2025-05-10', '13:00', '17:00', '메인 컨퍼런스홀', '컨퍼런스'),
('네트워킹 리셉션', '참가자 간 교류를 위한 네트워킹 리셉션', '2025-05-10', '2025-05-10', '17:30', '19:30', '그랜드 볼룸', '네트워킹'),

('시트 기술 워크샵', '최신 시트 기술 동향 워크샵', '2025-05-11', '2025-05-11', '08:30', '10:00', '워크샵룸 A', '워크샵'),
('연구소 발표 세션', '남양연구소 및 해외연구소 발표', '2025-05-11', '2025-05-11', '10:30', '12:00', '메인 컨퍼런스홀', '컨퍼런스'),
('중식', '참가자 점심 식사 제공', '2025-05-11', '2025-05-11', '12:00', '13:00', '구내 식당', '기타'),
('패널 토론: 시트 기술의 미래', '업계 전문가들의 패널 토론', '2025-05-11', '2025-05-11', '13:00', '14:30', '메인 컨퍼런스홀', '컨퍼런스'),
('협력사 발표 세션 3', '협력사 주요 발표 세션', '2025-05-11', '2025-05-11', '14:30', '17:00', '메인 컨퍼런스홀', '컨퍼런스'),
('갈라 디너', '참가자 갈라 디너 및 시상식', '2025-05-11', '2025-05-11', '18:00', '21:00', '그랜드 볼룸', '네트워킹'),

('인도 시장 특별 세션', '인도 시장 특화 제품 및 기술 발표', '2025-05-12', '2025-05-12', '09:00', '12:00', '스몰 컨퍼런스홀', '컨퍼런스'),
('중식', '참가자 점심 식사 제공', '2025-05-12', '2025-05-12', '12:00', '13:00', '구내 식당', '기타'),
('혁신 기술 쇼케이스', '주요 기술 혁신 사례 전시 및 발표', '2025-05-12', '2025-05-12', '13:00', '16:00', '스몰 컨퍼런스홀', '전시'),
('폐회식', '컨퍼런스 폐회식 및 요약', '2025-05-12', '2025-05-12', '16:00', '17:00', '메인 컨퍼런스홀', '컨퍼런스'),
('전시회 (상시)', '협력사 및 연구소 전시물 관람', '2025-05-10', '2025-05-12', '09:00', '18:00', '전시관 A, B', '전시');

-- RLS(Row Level Security) 정책 설정
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자는 일정을 읽을 수 있음
CREATE POLICY schedules_select_all ON schedules
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 관리자만 일정을 추가/수정/삭제할 수 있음
CREATE POLICY schedules_insert_admin ON schedules
  FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  ));

CREATE POLICY schedules_update_admin ON schedules
  FOR UPDATE
  USING (auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  ));

CREATE POLICY schedules_delete_admin ON schedules
  FOR DELETE
  USING (auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  ));

-- 인덱스 생성
CREATE INDEX idx_schedules_dates ON schedules(start_date, end_date);
CREATE INDEX idx_schedules_type ON schedules(type);
