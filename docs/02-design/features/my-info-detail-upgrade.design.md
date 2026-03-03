# PDCA Design - my-info-detail-upgrade

- Feature: `my-info-detail-upgrade`
- Date: `2026-03-03`
- Phase: `Design`
- Level: `Dynamic`
- Plan: `docs/01-plan/features/my-info-detail-upgrade.plan.md`

## 1) Design Goals
- 목표 수치를 카드형 지표로 세분화해 해석 시간을 줄인다.
- AI 피드백을 실행 가능한 코칭 형태로 표준화한다.
- AI 응답 실패 시에도 fallback으로 동일한 정보 밀도를 확보한다.

## 2) UI Design
### Target Card
- 파일: `src/components/my/NutritionResultCard.tsx`
- 변경:
  - 지표를 2열(모바일)/3열(md) 그리드로 구성
  - 항목: BMR, TDEE, 목표 칼로리, 탄수화물, 단백질, 지방, 당류, 나트륨
  - 별도 박스로 `권장 매크로(탄/단/지)` 요약 표시
  - AI 피드백 박스 제목을 `AI 분석 피드백` 또는 `기본 계산 피드백`으로 표시

## 3) AI Notes Design
### Prompt
- 파일: `src/lib/nutrition/aiTargets.ts`
- 규칙:
  - 한국어
  - 200자 이내
  - 체형/목표 분석
  - 운동 처방(강도/시간/주당 횟수)
  - 식단 권장(단백질 중심, 지방 최소화)
  - BMR/TDEE/목표 칼로리/탄단지 포함

### Fallback
- `bodyFatPct`, `waistHipRatio` 우선으로 체형 힌트 생성
- 운동 입력 미존재 시 기본값 사용:
  - 빈도: 주 3회
  - 시간: 45분
  - 강도: 중강도
- 200자 초과 시 축약형 문구로 대체

## 4) Data/API Safety
- API 스키마 변경 없음 (`/api/sheets/user` 유지)
- `NutritionTargets` 타입 변경 없음
- 저장/조회 컬럼 구조 변경 없음

## 5) Verification Plan
- Static: `npm run lint`
- Manual:
  - My 페이지에서 목표 수치 항목 분리 노출 확인
  - AI 테스트 실행 후 피드백 형식 확인
  - AI 미사용/실패 상황에서 fallback 문구 형식 확인

## 6) Next Phase
- Next: `Do`
