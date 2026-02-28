# PDCA 설계서 - ui-text-koreanization-cleanup

- 기능명: `ui-text-koreanization-cleanup`
- 작성일: `2026-02-27`
- 현재 단계: Design
- 계획 문서: `docs/01-plan/features/ui-text-koreanization-cleanup.plan.md`

## 1) 설계 목표
- 사용자에게 노출되는 주요 텍스트에서 영어 라벨을 제거한다.
- 영양 지표 약어(C/P/F, BMR, TDEE 등)를 한국어로 표기한다.
- 변경 범위를 UI 텍스트에 한정해 기능 동작에는 영향이 없도록 한다.

## 2) 설계 상세
1. 식단 목록 테이블
- C/P/F 헤더 → 탄/단/지로 변경
- 모바일 보조 라벨 `C:` `P:` `F:` → `탄:` `단:` `지:` 로 변경

2. 영양 결과 카드
- `BMR` → `기초대사량`
- `TDEE` → `활동대사량`
- 나머지 단위 표기는 유지(예: kcal, g)

3. 칼로리 게이지
- 내부 데이터 라벨 `"Calories"` → `"칼로리"`로 변경

## 3) 테스트 계획
- 수동:
  - 기록 테이블의 헤더/보조 라벨이 한국어로 표시되는지 확인
  - 내정보 > 계산 결과 카드에서 한국어 라벨 적용 확인
- 자동:
  - `npm run lint`
  - `npm run build`

## 4) 다음 단계
- 다음 단계: Do
- 실행 명령: `$pdca do ui-text-koreanization-cleanup`
