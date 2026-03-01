# Food DB Top50 Official Verification

Last Updated: 2026-03-01

## Goal
- 상위 50개 핵심 음식의 영양값(100g 기준)과 1인분 중량(defaultAmount)을 공식 출처 기준으로 보정한다.
- `defaultAmountSource`가 `estimated_serving`인 항목을 우선적으로 `official_serving`으로 전환한다.

## Progress (2026-03-01)
- [x] 1차 구조 개선 완료: `reference_100g` 타입 추가
  - 의미: 1인분이 아니라 100g 기준 입력 정책을 명시
  - 대상: 주요 재료군(`mfds-096`~`mfds-126`) 적용
- [x] 2차 준비 완료: 단백질 핵심 15개 공식 대조 스크립트 추가
  - 실행: `npm run verify:official:protein`
  - 출력: `docs/official-protein-verification.json`
  - 필요 환경변수: `DATA_GO_KR_SERVICE_KEY`
- [ ] 2차 데이터 보정 진행중: Top50 항목별 공식 출처 대조 후 영양값/1인분 보정

## Scope
- 대상: 사용자 검색/등록 빈도가 높은 음식 50개
- 기준 필드:
  - `calories`, `carbs`, `protein`, `fat`, `sugar`, `sodium` (100g 기준)
  - `defaultAmount` (1인분 중량)
  - `defaultAmountSource` (`official_serving`/`estimated_serving`)

## Source Policy
- 1순위: 식품의약품안전처(MFDS), 국가표준식품성분표(농진청) 등 공공/공식 데이터
- 2순위: 공신력 있는 공개 데이터셋(표준 제공량 명시 필수)
- 금지: 출처 불명 블로그/커뮤니티 값 직접 반영

## Execution Rules
- 모든 보정은 `src/lib/foodsIndex.ts`에서 수행한다.
- 반올림 정책:
  - `calories`: 정수
  - `carbs`, `protein`, `fat`, `sugar`: 소수 1자리 또는 정수(기존 정책 일관 유지)
  - `sodium`: 정수(mg)
- 변경 시 `aliases`는 검색 회귀가 없도록 유지/보강한다.

## Verification Backlog (Top50)

### A. 단백질 핵심 재료군 (우선)
- [ ] 닭가슴살 (`mfds-003`)
- [ ] 돼지목살 (`mfds-096`)
- [ ] 돼지등심 (`mfds-097`)
- [ ] 돼지안심 (`mfds-098`)
- [ ] 돼지갈비 (`mfds-101`)
- [ ] 소등심 (`mfds-102`)
- [ ] 소안심 (`mfds-103`)
- [ ] 소채끝살 (`mfds-104`)
- [ ] 소갈비 (`mfds-108`)
- [ ] 차돌박이 (`mfds-109`)
- [ ] 닭다리살 (`mfds-111`)
- [ ] 닭안심 (`mfds-112`)
- [ ] 고등어 (`mfds-117`)
- [ ] 연어 (`mfds-118`)
- [ ] 참치 (`mfds-119`)

### B. 한국 외식 단백질 메뉴
- [ ] 불고기 (`mfds-017`)
- [ ] 제육볶음 (`mfds-022`)
- [ ] 돼지갈비찜 (`mfds-127`)
- [ ] 돼지갈비구이 (`mfds-128`)
- [ ] 양념갈비 (`mfds-129`)
- [ ] LA갈비구이 (`mfds-130`)
- [ ] 삼겹살구이 (`mfds-131`)
- [ ] 목살구이 (`mfds-132`)
- [ ] 소갈비찜 (`mfds-137`)
- [ ] 연어스테이크 (`mfds-143`)
- [ ] 연어덮밥 (`mfds-144`)
- [ ] 회덮밥 (`mfds-147`)
- [ ] 육회비빔밥 (`mfds-148`)
- [ ] 쭈꾸미볶음 (`mfds-149`)

### C. 주식/면/기본 식단
- [ ] 흰쌀밥 (`mfds-002`)
- [ ] 현미밥 (`mfds-001`)
- [ ] 비빔밥 (`mfds-016`)
- [ ] 김밥 (`mfds-019`)
- [ ] 라면 (`mfds-020`)
- [ ] 짜장면 (`mfds-024`)
- [ ] 짬뽕 (`mfds-025`)
- [ ] 칼국수 (`mfds-071`)
- [ ] 비빔국수 (`mfds-073`)
- [ ] 볶음밥 (`mfds-080`)

### D. 국/탕/찌개
- [ ] 김치찌개 (`mfds-014`)
- [ ] 된장찌개 (`mfds-015`)
- [ ] 순두부찌개 (`mfds-027`)
- [ ] 갈비탕 (`mfds-029`)
- [ ] 미역국 (`mfds-030`)
- [ ] 삼계탕 (`mfds-061`)
- [ ] 설렁탕 (`mfds-062`)
- [ ] 곰탕 (`mfds-063`)
- [ ] 순대국 (`mfds-065`)
- [ ] 차돌된장찌개 (`mfds-150`)

### E. 반찬/간편식
- [ ] 계란 (`mfds-004`)
- [ ] 두부 (`mfds-009`)
- [ ] 김치 (`mfds-041`)
- [ ] 멸치볶음 (`mfds-043`)
- [ ] 계란말이 (`mfds-047`)
- [ ] 계란찜 (`mfds-048`)

## Change Log Template
- Date:
- Item ID / Name:
- Before: kcal / C / P / F / sugar / sodium / defaultAmount / sourceFlag
- After: kcal / C / P / F / sugar / sodium / defaultAmount / sourceFlag
- Official Source:
- Note:

## QA Checklist
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `npm run verify:official:protein` (키 주입 후)
- [ ] DB검색 키워드 회귀 확인 (`갈비`, `목살`, `연어`, `고등어`, `닭가슴살`)
- [ ] 1인분 표기(공식/추정) 의도대로 노출 확인
