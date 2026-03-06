# Report - goal-system-setup-improvement

- Feature: `goal-system-setup-improvement`
- Date: `2026-03-06`
- Match Rate: **90%**
- Duration: 2026-03-04 ~ 2026-03-06

---

## 1) 요약

목표 체계를 4개 고정 구조로 단순화하고, BMR/TDEE/매크로 계산을 규칙 기반 엔진으로 완전히 재구성했다.
NEAT 별도 입력을 제거하고 활동 수준 단일 드롭다운으로 UX를 단순화했으며, `sedentary` 계수를 1.35로 확정했다.

---

## 2) 관련 문서

| 문서 | 경로 |
|------|------|
| Plan | `docs/01-plan/features/goal-system-setup-improvement.plan.md` |
| Design | `docs/02-design/features/goal-system-setup-improvement.design.md` |
| Analysis | `docs/03-analysis/goal-system-setup-improvement.analysis.md` |

---

## 3) 완료 항목

### 계산 엔진 (calculateTargets.ts)

- [x] Mifflin-St Jeor BMR 계산
- [x] PAL 기반 TDEE 계산 (5단계, sedentary=1.35)
- [x] NEAT_ADJUSTMENT 테이블 제거, getEffectivePal 단순화
- [x] 목표별 칼로리 배수 (cutting 0.80 / bulking 1.05 / recomp 0.925 / maint 1.00)
- [x] lean recomposition 분기 (체지방 ≤15%/23% → 유지 칼로리 적용)
- [x] 단백질 계산: 체지방 미입력/입력 분기, 상한(체중×2.2, 칼로리 35%) 적용
- [x] 지방: 목표별 비율(25~30%) + 최소 보장(체중×0.6g)
- [x] 탄수화물: 잔여 칼로리 자동 계산
- [x] 출력 단위: 칼로리 10 kcal, 매크로 5g 반올림

### 타입 / 데이터 (types.ts, sheets.ts, api/sheets/user)

- [x] `neatLevel` 타입에서 제거
- [x] `macroPreference` 타입에서 제거
- [x] `waistCm` (optional) 추가
- [x] Google Sheets 직렬화/역직렬화 업데이트

### UI (ProfileEditModal, ProfileSummarySection)

- [x] NEAT 드롭다운 제거
- [x] "활동 수준" 단일 드롭다운으로 통합
- [x] waistCm 입력 필드 및 표시 반영
- [x] macroPreference 선택 UI 제거

### 테스트 (calculateTargets.test.ts)

- [x] 4개 시나리오 단위 테스트 신규 작성
- [x] 활동 계수 변경 기반 기대값 갱신, 4/4 통과

---

## 4) 품질 지표

| 항목 | 결과 |
|------|------|
| Match Rate | 90% |
| TypeScript 타입 오류 | 0 |
| ESLint 오류 | 0 |
| 단위 테스트 | 4/4 PASS |

---

## 5) 이월 항목 (다음 이터레이션)

| 항목 | 이유 |
|------|------|
| 2주 평균 체중 변화 기반 자동 보정 (±100~150 kcal) | 히스토리 데이터 구조 선행 필요 |
| 운동시간 기반 PAL 미세 보정 (+0.05~0.15) | 단순화 우선, 추후 정확도 개선 시 추가 |
| AI 동적 트리거 (단백질 달성률 <80% 등) | 달성률 집계 로직 선행 필요 |

---

## 6) Lessons Learned

| 구분 | 내용 |
|------|------|
| Keep | 의사결정 항목을 Plan 단계에 명시하여 구현 중 재토론 최소화 |
| Problem | feature 브랜치 구현 진행 중 PDCA 문서가 plan 단계에 멈춰 있었음 |
| Try | 구현 시작 전 design 문서 작성 후 진입 → 계산 로직 불일치 조기 발견 가능 |

---

## 7) Next

- 본 기능 archive 처리
- 다음 feature 결정 및 plan 단계 시작
