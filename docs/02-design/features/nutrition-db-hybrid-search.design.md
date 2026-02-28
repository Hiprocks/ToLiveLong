# PDCA Design - nutrition-db-hybrid-search

- Feature: `nutrition-db-hybrid-search`
- Date: `2026-02-28`
- Phase: `Design`
- Level: `Dynamic`

## 1) Architecture

```text
Public Nutrition Sources (MFDS / 통합표준)
        |
        | (sync job: daily/weekly)
        v
Normalized Store (foods index)
        |
        | (runtime query)
        v
/api/foods/search
        |
        v
FoodSearchModal (검색 -> 선택 -> 자동 채움)
```

핵심 원칙:
- 런타임은 외부 API 직접호출 금지(내부 인덱스 우선)
- 외부 API는 배치 동기화 경로에서만 사용

## 2) Data Model (Normalized)

`foods` (internal index)
- `id` string (internal uuid)
- `source` enum (`mfds`, `korean_standard_food`, `korean_standard_ingredient`, `fallback`)
- `source_food_id` string
- `name_ko` string
- `aliases` string[] (선택)
- `serving_base_g` number (default 100)
- `calories_kcal` number
- `carbs_g` number
- `protein_g` number
- `fat_g` number
- `sugar_g` number
- `sodium_mg` number
- `updated_at` iso string
- `source_updated_at` iso string | null

인덱스:
- `name_ko` prefix/contains 검색 인덱스
- `aliases` 부분일치 보조 인덱스

## 3) Sync Strategy

### 3.1 Initial Load
- 소스별 페이지네이션으로 전량 수집
- 변환/정규화 후 upsert
- 실패 레코드 로그(파싱 오류, 단위 오류)

### 3.2 Incremental
- 배치 주기:
  - `daily`: 신규/변경분 조회 시도
  - `weekly`: 전체 재동기화 샘플 검증
- 버전/타임스탬프 비교 기반 upsert

### 3.3 Conflict Rules
- 동일 음식명 다중 소스 충돌 시 우선순위:
  1. `mfds`
  2. `korean_standard_food`
  3. `korean_standard_ingredient`
  4. fallback
- 우선순위가 같으면 최신 `source_updated_at` 채택

## 4) API Design

### GET `/api/foods/search`
Query:
- `q` (required, string)
- `limit` (optional, default 20, max 50)

Response:
```json
{
  "items": [
    {
      "id": "food_123",
      "name": "닭가슴살",
      "source": "mfds",
      "baseAmount": 100,
      "calories": 120,
      "carbs": 0,
      "protein": 23,
      "fat": 2,
      "sugar": 0,
      "sodium": 65
    }
  ]
}
```

오류:
- `400`: invalid query
- `500`: search failed

## 5) Frontend Integration (FoodSearchModal)

추가 모드:
- `manual`
- `template`
- `database` (신규)

흐름:
1. 사용자 검색어 입력(300ms debounce)
2. `/api/foods/search` 호출
3. 결과 카드 선택 시 영양값 자동 채움
4. 섭취량 변경 시 비례 환산
5. 최종 저장은 기존 `/api/sheets/records` 재사용

## 6) API Safety / Regression Guard

변경 금지:
- `/api/sheets/user`
- `/api/sheets/records`
- `/api/sheets/templates`
- `/api/analyze`

검증 항목:
- 신규 API 추가 후 기존 API 상태코드 200 유지
- 기존 저장/수정/삭제 플로우 무변경 확인

## 7) Rollout Plan
1. Phase A: 데이터 스키마 + mock search API (internal fixture)
2. Phase B: 동기화 배치 + 실제 인덱스 연동
3. Phase C: UI 공개 + 사용성 보정
4. Phase D: fallback 소스 연결(선택)

## 8) Test Plan
- Unit:
  - 수치 정규화/단위 환산 함수
  - source merge 우선순위
- Integration:
  - `/api/foods/search` keyword cases
  - modal 선택 -> 자동 채움 -> 저장
- Regression:
  - `npm run lint`
  - `npm run build`
  - 기존 API smoke tests

## 9) Next
- Next phase: `Do`
