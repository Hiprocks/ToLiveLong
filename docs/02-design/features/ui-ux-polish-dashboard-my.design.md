# PDCA Design - ui-ux-polish-dashboard-my

- Feature: `ui-ux-polish-dashboard-my`
- Date: `2026-02-28`
- Phase: `Design`
- Level: `Dynamic`

## 1) Design Goals
- Dashboard 식단 행에서 핵심 영양 정보가 첫 시선에 바로 읽히도록 정보 위계를 재설계한다.
- 기록 수정 모달의 모든 수치 입력 필드에 라벨을 명시해 편집 오류를 줄인다.
- 내정보 화면의 콘텐츠 우선순위를 "목표 수치(AI) -> 프로필 요약 -> AI 응답 테스트"로 정렬한다.
- 전역 색상 토큰을 현대적인 대비 구조로 다듬되, 기존 기능 흐름과 API 호출은 변경하지 않는다.

## 2) Information Architecture
### Dashboard Meal Row
- 행 단위 카드 구조로 전환한다.
- 1줄: 음식명(강조) + 섭취량(g) + 칼로리(kcal)
- 2줄: 탄수화물/단백질/지방/당/나트륨을 미니 메트릭 그룹으로 표시
- 단백질은 보조 강조 색상으로 인지성 강화

### History Edit Modal
- 기존 placeholder 중심 입력에서 label + input 구조로 변경
- 모든 필드(중량/칼로리/탄수/단백질/지방/당/나트륨)에 제목 노출

### My Page Section Order
- 최상단: 목표 수치(AI) 결과 카드
- 중단: 기본/목표/활동 정보 카드
- 최하단: AI 응답 테스트 카드

## 3) Visual System Update
### Token Direction
- 배경: 단일 평면이 아닌 차분한 딥 톤 그라디언트 기반
- 카드: 배경과 분리되는 표면 색 + 얕은 보더 + 그림자
- 텍스트: 본문 대비 강화, 보조 텍스트는 읽기 가능한 채도 유지
- 포인트: 기본 CTA(Primary)와 단백질 메트릭 보조 강조 색을 분리

### Scope
- `src/app/globals.css` 색상 토큰
- Dashboard/History/My 핵심 컴포넌트 표면/타이포/메트릭 스타일

## 4) API Safety Design
- 이번 작업은 렌더링 계층만 변경한다.
- API endpoint, fetch URL, request payload, response schema는 수정하지 않는다.
- 회귀 검증 시 `/api/sheets/user`, `/api/sheets/records`, `/api/sheets/templates` 호출 성공을 확인한다.

## 5) Test Design
- Static checks: `npm run lint`, `npm run build`
- UI regression:
  - Dashboard: 모든 영양 필드가 클릭 없이 보이는지
  - History edit: 라벨 누락 없는지
  - My page: 섹션 순서가 요구사항과 일치하는지
- API regression:
  - 배포 URL 기준 `GET /api/sheets/user`, `GET /api/sheets/records?date=...` 정상 응답 확인

## 6) Implementation Files
- `src/components/MealTable.tsx`
- `src/app/history/page.tsx`
- `src/components/my/ProfileSummarySection.tsx`
- `src/components/my/NutritionResultCard.tsx`
- `src/app/my/page.tsx`
- `src/app/globals.css`

## 7) Next Phase
- Next: `Do`
