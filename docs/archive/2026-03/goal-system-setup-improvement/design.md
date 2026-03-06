# Design - goal-system-setup-improvement

- Feature: `goal-system-setup-improvement`
- Date: `2026-03-06`
- Phase: `Design`
- Based on: `docs/01-plan/features/goal-system-setup-improvement.plan.md`

---

## 1) 아키텍처 결정

### 1.1 설계 원칙

- **계산은 시스템, 해석은 AI**: 칼로리·매크로 수치는 `calculateTargets.ts` 단일 소스. AI는 코칭 문장만 생성.
- **단순 입력, 정교한 내부 로직**: 사용자는 활동 수준 1개만 선택. NEAT 별도 입력 없음.
- **목표 4개 고정**: `cutting / bulking / recomposition / maintenance`. UI 레이블은 한국어.

### 1.2 파일 구조

```
src/lib/
  types.ts                         — UserProfileInput 인터페이스 (neatLevel 제거, waistCm 추가)
  nutrition/
    calculateTargets.ts            — 핵심 계산 엔진
    calculateTargets.test.ts       — 단위 테스트
    aiTargets.ts                   — AI 코칭용 매크로 래퍼
src/components/my/
  ProfileEditModal.tsx             — 프로필 편집 (활동 수준 단일 드롭다운)
  ProfileSummarySection.tsx        — 프로필 요약 표시
src/app/api/sheets/user/route.ts   — Google Sheets 사용자 데이터 R/W
```

---

## 2) 계산 로직 설계

### 2.1 BMR — Mifflin-St Jeor

```
남성: BMR = 10W + 6.25H - 5A + 5
여성: BMR = 10W + 6.25H - 5A - 161
```

### 2.2 활동 계수 (PAL)

| 코드 | 레이블 | PAL |
|------|--------|-----|
| sedentary | 거의 없음 | 1.35 |
| light | 가벼움 | 1.375 |
| moderate | 보통 | 1.55 |
| very | 높음 | 1.725 |
| extra | 매우 높음 | 1.9 |

- NEAT 별도 입력 없음 (활동 수준에 통합)
- 운동시간 보정은 현 단계에서 미적용 (추후 개선)
- TDEE = round(BMR × PAL)

### 2.3 목표별 칼로리 배수

| 목표 | 배수 |
|------|------|
| cutting | 0.80 |
| bulking | 1.05 |
| recomposition | 0.925 |
| maintenance | 1.00 |

- **lean recomposition 분기**: `recomposition` + 체지방률 ≤ 15%(남) / ≤ 23%(여) → 배수 1.00 적용
- 최소 목표 칼로리: 1,000 kcal
- 출력 단위: 10 kcal 반올림

### 2.4 단백질

체지방률 미입력:

| 목표 | g/kg 체중 |
|------|-----------|
| cutting | 2.0 |
| bulking | 1.8 |
| recomposition | 1.6 |
| maintenance | 1.4 |

체지방률 입력 + `cutting`:
- LBM = 체중 × (1 - 체지방률/100)
- Protein = clamp(LBM × 2.2, LBM × 1.8, LBM × 2.6)

상한 제한:
- 체중 × 2.2g 초과 불가
- 목표 칼로리의 35% 초과 불가
- 출력 단위: 5g 반올림

### 2.5 지방

```
ratioBased = targetCalories × FAT_RATIO / 9
floorByWeight = 체중 × 0.6
fat = max(ratioBased, floorByWeight)
```

| 목표 | FAT_RATIO |
|------|-----------|
| cutting | 0.25 |
| bulking | 0.25 |
| recomposition | 0.30 |
| maintenance | 0.30 |

- 출력 단위: 5g 반올림

### 2.6 탄수화물

```
carbs = (targetCalories - protein×4 - fat×9) / 4
```

- 출력 단위: 5g 반올림

---

## 3) 데이터 모델 변경

### 3.1 UserProfileInput (types.ts)

| 필드 | 변경 | 설명 |
|------|------|------|
| `neatLevel` | **제거** | NEAT 별도 입력 폐지 |
| `macroPreference` | **제거** | AI 코칭으로 대체 |
| `waistCm` | **추가** (optional) | 지방 추적 지표 |
| `occupationalActivityLevel` | 유지 | 단일 활동 수준 입력 |

### 3.2 Google Sheets (sheets.ts / api/sheets/user)

- `waistCm` 컬럼 직렬화/역직렬화 추가
- `macroPreference` 컬럼 제거

---

## 4) UI 설계

### 4.1 ProfileEditModal

- "직업 활동량" + "일상 활동량(NEAT)" 두 드롭다운 → **"활동 수준" 단일 드롭다운**
- `waistCm` 입력 필드 추가 (권장 입력)
- `macroPreference` 선택 UI 제거

### 4.2 ProfileSummarySection

- "직업 활동량" + "일상 활동량(NEAT)" 두 행 → **"활동 수준" 한 행**으로 통합
- `waistCm` 표시 행 추가

---

## 5) 테스트 계획

| 시나리오 | 검증 항목 |
|----------|-----------|
| 기본 유지 목표 | TDEE = PAL-only, 출력 단위 검증 |
| 4개 목표 배수 | targetCalories, fat 값 검증 |
| lean recomposition | bodyFatPct ≤ 15% → maint 칼로리 적용 |
| 고령·고체중 cutting | 단백질 상한(체중·칼로리 캡) 검증 |

---

## 6) 범위 외 (추후)

- 2주 평균 체중 변화 기반 칼로리 자동 보정 (±100~150 kcal)
- 운동시간 기반 PAL 미세 보정 (+0.05~0.15)
- AI 강화 트리거 (단백질 달성률 <80% 등)
