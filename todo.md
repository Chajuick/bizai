# BizAI - 영업 관리 AI 프로젝트 TODO

## 데이터베이스 스키마
- [x] clients 테이블 (고객사 관리)
- [x] salesLogs 테이블 (영업일지)
- [x] promises 테이블 (일정 관리)
- [x] orders 테이블 (수주 관리)
- [x] deliveries 테이블 (납품/매출)
- [x] attachments 테이블 (첨부파일)
- [x] DB 마이그레이션 적용

## 백엔드 API (tRPC)
- [x] clients 라우터 (CRUD)
- [x] salesLogs 라우터 (CRUD + AI 분석)
- [x] promises 라우터 (CRUD + 상태 관리)
- [x] orders 라우터 (CRUD + 상태 관리)
- [x] deliveries 라우터 (CRUD)
- [x] dashboard 라우터 (KPI 집계)
- [x] AI 음성 변환 엔드포인트 (Whisper API)
- [x] AI LLM 구조화 엔드포인트
- [x] 오디오 업로드 REST 엔드포인트 (/api/upload-audio)

## AI 기능
- [x] 음성 녹음 → Whisper API 변환 (한국어)
- [x] LLM 영업일지 자동 구조화 (고객명, 날짜, 금액, 다음 액션 추출)
- [x] 일정 자동 등록 연동
- [x] 수주 알림 (notifyOwner)

## 프론트엔드 디자인 시스템
- [x] 청사진(Blueprint) 테마 CSS 설정 (진한 로열 블루 + 그리드 패턴)
- [x] 전역 레이아웃 (모바일 하단 네비게이션 + 데스크탑 사이드바)
- [x] 공통 컴포넌트 (StatusBadge, VoiceRecorder)
- [x] 음성 녹음 컴포넌트 (VoiceRecorder)

## 핵심 페이지
- [x] 랜딩 페이지 (LandingPage) - 로그인 전 소개
- [x] 대시보드 (Dashboard) - KPI 카드, 최근 활동, 예정 일정, 매출 차트
- [x] 영업일지 목록 (SalesLogs) - 검색, 필터
- [x] 영업일지 작성 (SalesLogNew) - 음성 녹음, AI 분석
- [x] 영업일지 상세 (SalesLogDetail) - AI 요약, 다음 액션
- [x] 일정 관리 (Promises) - 상태별 탭, 완료/취소
- [x] 수주 관리 (Orders) - 상태별 탭, 금액 집계
- [x] 납품/매출 관리 (Deliveries) - 청구/수금 처리
- [x] 고객사 관리 (Clients) - 검색
- [x] 고객사 상세 (ClientDetail) - 히스토리 조회

## 테스트
- [x] auth.logout 라우터 vitest (1 test)
- [x] salesLogs 라우터 vitest
- [x] promises 라우터 vitest
- [x] orders 라우터 vitest
- [x] dashboard 라우터 vitest
- [x] 전체 11개 테스트 통과

## 향후 개선 사항
- [ ] 일정 리마인더 스케줄러 (예정 일정 전 자동 알림)
- [ ] 캘린더 뷰 (일정 월별 보기)
- [ ] 수주 → 납품 자동 연결 워크플로우
- [ ] 엑셀/PDF 내보내기
- [ ] PWA 설정 (오프라인 지원)


## 추가 기능
- [x] 일정 → 수주 전환 기능 (일정 상세에서 "수주 생성" 버튼 추가 완료)
- [x] 각 항목 수정/삭제 기능 (영업일지, 일정, 수주, 납품 모두 구현 완료)
- [x] 수주 → 납품 전환 기능 (수주 상세에서 "납품 생성" 버튼 추가 완료)
