# PDCA Analysis - dashboard-goal-unification

- Feature: `dashboard-goal-unification`
- Date: `2026-03-03`
- Phase: `Analyze`
- Level: `Dynamic`

## Question
- Dashboard에서 `오늘 칼로리` 카드와 `영양 목표 진행` 카드가 분리되어 있는 현재 구조가 적절한지 검토하고,
- 통합 시 UX/개발/회귀 관점의 타당성을 평가한다.

## Current Implementation Snapshot
- 칼로리 전용 카드: 도넛 차트 + 남은 칼로리 텍스트
  - `src/app/page.tsx` line 214, 218-248
- 영양소(탄/단/지/당/나트륨) 전용 카드: 항목별 진행 바
  - `src/app/page.tsx` line 264, 266-289
- 칼로리는 `NUTRIENT_ITEMS`에서 제외되어 별도 계산/렌더링
  - `src/app/page.tsx` line 26-32, 170-179

## Review Findings (Risk-first)
1. **중복된 진행도 로직으로 인한 일관성 리스크 (Medium)**
   - 칼로리와 영양소가 서로 다른 렌더링 블록/수식 경로를 사용한다.
   - 현재도 톤 계산 함수는 공유하지만(`getProgressTone`), UI/레이아웃 로직은 분리되어 이후 정책 변경 시 동기화 누락 가능성이 있다.
2. **목표 인지 흐름 분절 (Medium)**
   - 사용자가 “오늘 목표 달성 상태”를 한 덩어리로 보지 못하고, 칼로리와 영양소를 시선 이동하며 해석해야 한다.
   - 특히 모바일에서 카드 경계가 명확해 통합 맥락이 약해진다.
3. **완전 통합 시 가독성 저하 리스크 (High)**
   - 칼로리 도넛과 5개 영양 바를 단일 카드로 완전 통합하면 세로 밀도가 높아져 핵심 지표(칼로리) 강조가 약해질 수 있다.
   - 현재 레이아웃은 칼로리 우선 강조를 의도적으로 보장한다.

## Decision
- **결론: “완전 통합”은 비추천, “하이브리드 통합”이 적절**
  - 상단에 공통 헤더/요약(오늘 목표 진행)으로 통합 맥락 제공
  - 본문은 `칼로리(핵심)` + `영양소 상세`를 시각적으로 분리 유지
  - 즉, 정보 구조는 통합하고 시각 밀도는 분리한다.

## Proposed UX Direction (Hybrid)
1. 카드 제목을 `오늘 목표 진행`으로 통일
2. 헤더에 핵심 요약 배지 2개 제공
   - `칼로리 X / Y kcal`
   - `매크로 달성도 n/3` (탄/단/지 기준)
3. 본문 2영역 구성
   - 좌측/상단: 칼로리 도넛
   - 우측/하단: 탄/단/지/당/나트륨 진행 바
4. 모바일에서는 접힘(accordion) 옵션으로 영양 상세 토글 제공

## Impact Assessment
- FE: `src/app/page.tsx` 중심의 구조 정리 (중간)
- BE/API: 변경 없음 (낮음)
- QA: 모바일 가독성/정보 탐색 시간 회귀 확인 필요 (중간)

## Recommended Next PDCA Step
- 다음 단계: `Plan`
- 제안 feature명: `dashboard-goal-hybrid-integration`
- 착수 문서: `docs/01-plan/features/dashboard-goal-hybrid-integration.plan.md`
