# PDCA 설계서 - my-bodycomp-algorithm-upgrade

- 기능명: `my-bodycomp-algorithm-upgrade`
- 작성일: `2026-02-27`
- 현재 단계: Design
- 계획 문서: `docs/01-plan/features/my-bodycomp-algorithm-upgrade.plan.md`

## 1) 설계 목표
- 체지방률 입력 여부에 따라 BMR 공식을 분기한다.
- 린매스업 목표를 독립 옵션으로 제공하고 목표 칼로리/매크로 계산에 반영한다.
- 식단 타입(매크로 비율) 선택이 계산 결과에 영향을 주도록 한다.
- 목표-식단 타입 상충 시 사용자에게 경고를 제공한다.

## 2) 데이터/타입 변경
- `PrimaryGoal`에 `recomposition` 추가
- `MacroPreference`에 `keto` 추가
- Google Sheets `user` 시트의 기존 컬럼은 유지하며 값만 확장

## 3) 계산 로직
### BMR 분기
- 체지방률 있음: Katch-McArdle
  - `LBM = weightKg * (1 - bodyFatPct/100)`
  - `BMR = 370 + 21.6 * LBM`
- 체지방률 없음: Mifflin-St Jeor 유지

### 목표 칼로리 배수
- 감량: `TDEE * 0.8`
- 증량: `TDEE * 1.1`
- 린매스업: `TDEE * 1.0`
- 유지: `TDEE * 1.0`
- 과지방/비만/고도비만: `0.75/0.7/0.65`

### 매크로 비율
- 균형: C 50% / P 20% / F 30%
- 고단백: C 40% / P 40% / F 20%
- 저탄고지: C 10% / P 20% / F 70%
- 린매스업은 단백질 최소 비중 35%를 보장(부족분은 탄수/지방에서 조정)

## 4) UI 변경
- 목표 선택에 `린매스업` 추가
- 식단 타입에 `저탄고지` 추가
- 목표-식단 타입 상충 시 경고 배너 표시

## 5) 테스트 계획
- 수동:
  - 체지방률 유/무에 따른 BMR 값 변화 확인
  - 린매스업 목표 선택 시 매크로 단백질 비중 상향 확인
  - 저탄고지 + 증량/린매스업 선택 시 경고 표시 확인
- 자동:
  - `npm run lint`
  - `npm run build`

## 6) 다음 단계
- 다음 단계: Do
- 실행 명령: `$pdca do my-bodycomp-algorithm-upgrade`
