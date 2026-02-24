# ToLiveLong Overview

## 1) 결정사항 요약
- Supabase 제거, Google Sheets API v4로 전환
- 범위 축소: 개인용 핵심 3개 도메인
- 사용자 신체정보는 저장하지 않고 목표값만 저장

## 2) 최종 기능 범위 (Target)
1. 목표값 설정
2. 식단 등록 (수기 / AI / 템플릿)
3. 조회/편집 (오늘 대시보드 + 히스토리 + 내 정보)

## 3) 현재 구현 상태 (As-Is, 2026-02-25)
- 완료:
  - Google Sheets 공통 클라이언트(`src/lib/sheets.ts`)
  - records/templates/user API Routes 구현
  - 대시보드 페이지 Sheets 연동
  - 히스토리 페이지 조회/수정/삭제
  - 내 정보 페이지 목표값 조회/수정
  - 식단 입력 모달(수기/템플릿) 연동
  - 사진 분석 모달 저장 연동
- 진행 중:
  - Supabase 잔존 코드/의존성 제거
  - 환경변수 정리

## 4) 기능-문서 반영 플로우
1. 기능/상태 변경 시 `docs/overview.md` 업데이트
2. 기술구조/API 변경 시 `docs/Context.md` 업데이트
3. 작업 항목 변경 시 `docs/Todo.md` 업데이트
4. 회귀/실수 발생 시 `docs/MistakeNote.md` 기록
5. 시트 컬럼/매핑 변경 시 `docs/Schema.md` 업데이트

## 5) 다음 구현 우선순위
- Supabase 완전 제거
- `.env.local` 정리
- 기본 사용자 검증 시나리오 점검(등록/수정/삭제/목표 저장)
