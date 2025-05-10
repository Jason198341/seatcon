-- exhibits 테이블 생성
CREATE TABLE IF NOT EXISTS exhibits (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  company VARCHAR(100) NOT NULL,
  contact_name VARCHAR(100) NOT NULL,
  contact_phone VARCHAR(20),
  contact_email VARCHAR(100),
  display_method VARCHAR(100), -- 샘플/벅/판넬/온라인
  size_l NUMERIC(10,2),
  size_w NUMERIC(10,2),
  size_h NUMERIC(10,2),
  requirements TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 샘플 전시물 데이터 추가
INSERT INTO exhibits (title, company, contact_name, contact_phone, contact_email, display_method, size_l, size_w, size_h, requirements) VALUES
('차세대 코어 메커니즘 개발', '대원정밀공업', '진우재', '010-8761-5269', 'woojae_jin@dwjm.co.kr', '판넬 / 샘플', 900, 900, 1000, '전시용 테이블 필요'),
('LCD 터치 디스플레이 백 시트 공기 청정기', '대유에이텍', '김상현', '010-9463-3658', 'shkim@dayou.co.kr', '시트 1석 및 지그', 1100, 780, 1400, 'SP3 시트1석 및 고정 지그 전시'),
('후석 공압식 시트', '대유에이텍', '문지환', '010-3123-6929', 'mason@dayou.co.kr', '시트 1대분 및 지그', 750, 1350, 1450, NULL),
('후석 공압식 시트_발판', '대유에이텍', '문지환', '010-3123-6929', 'mason@dayou.co.kr', '지그', 900, 600, 400, NULL),
('롤러식 마사지 모듈적용 라운지 릴렉스 시트', '대원산업', '신재광', '010-8720-4434', 'jkshin@dwsu.co.kr', '샘플', 820, 1320, 1270, '시트 앗세이'),
('롤러식 마사지 모듈적용 라운지 릴렉스 시트', '대원산업', '신재광', '010-8720-4434', 'jkshin@dwsu.co.kr', '샘플', 700, 1000, 600, '프레임 앗세이'),
('Seat Components: Cushion Extension (Manual)', 'Brose India', 'Pradnyesh Patil', '+91-9552537275', 'Pradnyesh.patil@brose.com', '샘플', 500, 300, 120, 'Power & Cable will be required >> 3 pieces, 2000mm long exhibition table --> 2'),
('Seat Components: Calf Rest (Legrest)', 'Brose India', 'Pradnyesh Patil', '+91-9552537275', 'Pradnyesh.patil@brose.com', '샘플', NULL, NULL, NULL, NULL),
('Seat Components: Rear Power Striker', 'Brose India', 'Pradnyesh Patil', '+91-9552537275', 'Pradnyesh.patil@brose.com', '샘플', 220, 150, 170, NULL),
('Seat Components: Lumbar Support (Power mechanical)', 'Brose India', 'Pradnyesh Patil', '+91-9552537275', 'Pradnyesh.patil@brose.com', '샘플', NULL, NULL, NULL, NULL),
('롤러 마사지 시트', '디에스시동탄', '최민식', '010-4582-4830', 'mschoi2@godsc.co.kr', '샘플', 1400, 700, 1400, '220V 전원 1구 필요'),
('파워스트라이크 적용시트', '디에스시동탄', '황인창', '010-2547-7249', 'ichwang@godsc.co.kr', '샘플', NULL, NULL, NULL, 'SX3i 후석 선행시트 대체'),
('개인특화 엔터테인먼트 시트', '디에스시동탄', '박문수', '010-7232-8140', 'mspark@godsc.co.kr', '샘플', 1600, 860, 1500, '220V 전원 1구 필요'),
('파워롱레일+파워스위블 적용 시트', '다스', '이재갑', '010-9681-4567', 'LJG4444@i-das.com', '샘플/판넬', 1100, 1000, 1000, '전원 필요, 브레이크 모듈 전시대 필요'),
('매뉴얼 릴렉션 시트#1 - 레버타입(틸팅 & 릴렉션)', '다스', '이재갑', '010-9681-4567', 'LJG4444@i-das.com', '샘플/판넬', 1100, 650, 1000, NULL),
('통풍 시트', 'AEW', '이진성', '010-5588-8981', 'james.lee@aew-group.com', '시트 1석', 800, 550, 1100, '220V 전원 2구 필요'),
('Rubbing Massage 시트', 'AEW', '이진성', '010-5588-8981', 'james.lee@aew-group.com', '시트 1석', 800, 550, 1100, NULL),
('Adaptive 시트', 'AEW', '이진성', '010-5588-8981', 'james.lee@aew-group.com', '시트 1석', 800, 550, 1100, NULL),
('통풍+맛사지 시트', 'AEW', '이진성', '010-5588-8981', 'james.lee@aew-group.com', '시트 1석', 800, 550, 1100, NULL),
('Multi function seat', 'AEW', '이진성', '010-5588-8981', 'james.lee@aew-group.com', '시트 1석', 800, 550, 1100, NULL);

-- 더 많은 샘플 데이터 추가 (총 68개 중 일부)
INSERT INTO exhibits (title, company, contact_name, contact_phone, contact_email, display_method, size_l, size_w, size_h, requirements) VALUES
('Lear ComfortMaxR & Core Mechanism', '리어코리아', '김용환', '010-3778-6934', 'jkim@lear.com', '전시 테이블 (2개)', 1800, 800, 700, '바닥이 아닌 테이블 위에 전시 (전원 2구 필요)'),
('경형프레임 매뉴얼 레그레스트', '현대트랜시스', '황성준', '010-2773-3723', 'sungjunh@hyundai-transys.com', '시트 1석', 600, 700, 1280, NULL),
('경형 프레임(MNL/PWR)', '현대트랜시스', '황성준', '010-2773-3723', 'sungjunh@hyundai-transys.com', '시트(매뉴얼) 1석', 600, 700, 1200, NULL),
('경형 프레임(MNL/PWR)', '현대트랜시스', '황성준', '010-2773-3723', 'sungjunh@hyundai-transys.com', '시트(파워) 1석', 600, 700, 1200, NULL),
('매뉴얼 콘솔 레일', '현대트랜시스', '손동현', '010-5241-7542', 'dhyeon.son@hyundai-transys.com', '샘플 1개', 1100, 400, 200, '전시 테이블 필요'),
('매뉴얼 리클라이너', '현대트랜시스', '손동현', '010-5241-7542', 'dhyeon.son@hyundai-transys.com', '샘플 1개', 320, 120, 120, '전시 테이블 필요, 스탠바이미 (※ 자율주행차 인테리어 솔루션 영상 재생)'),
('Air-tube형 통풍시트 원단', '케이엠모터스㈜', '안윤희', '010-3000-5686', 'hiyhahn@naver.com', '판넬/샘플', 500, 500, 1000, '샘플전시용 테이블 요청'),
('PBV 모빌리티 기반 특화 구조 선행 연구', '현대트랜시스', '박한경', '010-9046-9258', 'hankpark@hyundai-transys.com', '샘플 1개(프레임)', 500, 500, 1500, NULL);

-- RLS(Row Level Security) 정책 설정
ALTER TABLE exhibits ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자는 전시물을 읽을 수 있음
CREATE POLICY exhibits_select_all ON exhibits
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 관리자만 전시물을 추가/수정/삭제할 수 있음
CREATE POLICY exhibits_insert_admin ON exhibits
  FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  ));

CREATE POLICY exhibits_update_admin ON exhibits
  FOR UPDATE
  USING (auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  ));

CREATE POLICY exhibits_delete_admin ON exhibits
  FOR DELETE
  USING (auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  ));

-- 인덱스 생성
CREATE INDEX idx_exhibits_company ON exhibits(company);
CREATE INDEX idx_exhibits_contact_name ON exhibits(contact_name);
