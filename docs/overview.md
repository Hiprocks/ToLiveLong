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
  - Supabase 잔존 코드/의존성 제거 완료
  - 입력 검증/에러 응답 표준화
  - same-origin 쓰기 가드 적용
  - 날짜 처리 로컬 기준(`yyyy-MM-dd`) 통일
  - 템플릿 모달 캐시(60초) 적용
  - Google Sheets 실데이터 스모크 테스트 완료
    - `POST /records` -> `GET /records?date=` -> `PUT /records/[id]` -> `DELETE /records/[id]`

## 4) 기능-문서 반영 플로우
1. 기능/상태 변경 시 `docs/overview.md` 업데이트
2. 기술구조/API 변경 시 `docs/Context.md` 업데이트
3. 작업 항목 변경 시 `docs/Todo.md` 업데이트
4. 회귀/실수 발생 시 `docs/MistakeNote.md` 기록
5. 시트 컬럼/매핑 변경 시 `docs/Schema.md` 업데이트

## 5) 다음 구현 우선순위
- 등록 과정 UX 개선 (수기/템플릿/사진분석 진입 흐름 단순화)
- 등록 UI 개선 (입력 단계, 저장 상태, 에러/성공 피드백 개선)
- 템플릿 UX 정책 확정 (검색/선택/즐겨찾기)

---

## 6) Update Log (2026-02-25)

- Meal entry flow simplified to a single `+` action button with three options:
  - Manual entry
  - Use template
  - Analyze photo
- Save feedback is now unified at the dashboard level (success flash banner).
- Entry validation baseline aligned:
  - `food_name` required
  - `amount >= 1g` required
- Template UX policy updated:
  - Keep search + select flow
  - Recently used templates are prioritized client-side
  - Favorites are deferred (policy only, no DB schema change)
- Analyze API response robustness improved:
  - tolerant JSON extraction
  - normalized nutrition payload with numeric bounds
- Build quality gate updated:
  - `prebuild` runs `test:analyze` before `next build`

---

## 7) Update Log (2026-02-25)

- Meal category (`meal_type`) removed from UI and API payload.
- Dashboard target section changed from table style to bar-graph style under total calorie gauge.
- Daily records are now displayed as a single unified list.
