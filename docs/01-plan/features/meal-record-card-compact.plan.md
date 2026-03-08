# Plan: meal-record-card-compact

## 1) Goal
홈 식단 기록 카드의 영양소 칩을 5개(탄·단·지·당·나트륨) → 3개(탄·단·지)로 줄이고
2줄 레이아웃을 1줄로 통합하여, 카드 높이를 현재 대비 약 40% 감소시킨다.

## 2) Background
- 현재 `MetricChip` 5개가 `grid-cols-2`(3줄)로 표시되어 카드 1개당 높이가 과도
- 사용자 1순위 정보: 음식명 + 칼로리 (이미 상단 표시 중)
- 당·나트륨은 카드에서 제거 가능 (수정 모달에서 여전히 확인/수정 가능)
- 탄단지는 목표 관리 핵심으로 항상 표시 유지

## 3) Scope

### In Scope
- `src/app/page.tsx` 식단 기록 카드의 MetricChip 5개 → 3개 (탄·단·지)
- `grid-cols-2` → `grid-cols-3`, 1줄 배치
- MetricChip 패딩 소폭 축소 (높이 감소)

### Out of Scope
- 수정 모달의 당·나트륨 입력 필드 (유지)
- 칩 클릭 시 당·나트륨 펼침 토글 (복잡도 대비 효과 낮음)
- FoodSearchModal 등 다른 화면의 카드 레이아웃

## 4) Requirements

### Functional
- 홈 식단 기록 카드에 탄수·단백질·지방 3개 칩만 표시
- 3개 칩은 `grid-cols-3`으로 1줄에 균등 배치
- 수정 버튼(✏)은 카드 우상단에 유지
- 수정 모달에서 당·나트륨 입력/수정 기능은 그대로 유지

### Non-Functional
- 기존 MetricChip 컴포넌트 재사용 (신규 컴포넌트 불필요)
- Tailwind 클래스만으로 처리, JS 추가 없음

## 5) Success Criteria
- [ ] 카드에서 당·나트륨 칩이 사라짐
- [ ] 탄·단·지 3칩이 1줄(grid-cols-3)로 배치됨
- [ ] 카드 높이가 시각적으로 줄어듦 (약 40% 이상)
- [ ] 수정 모달에서 당·나트륨 값 여전히 확인 및 수정 가능
- [ ] 빌드 에러 없음

## 6) Risks
| 리스크 | 대응 |
|--------|------|
| 당·나트륨 데이터가 카드에서 안 보임에 대한 혼란 | 수정 모달에서 확인 가능하므로 데이터 손실 없음 |
| grid-cols-3 에서 칩 텍스트 잘림 | 칩 텍스트 최소화 (label 짧게 유지: 탄수/단백질/지방) |

## 7) Implementation Note
- 변경 위치: `page.tsx` line ~284 의 MetricChip 5개 → 3개
- `sm:grid-cols-5` 클래스 제거, `grid-cols-3` 고정
- MetricChip px/py 패딩 소폭 축소 검토 (현재 `px-2 py-1.5`)
