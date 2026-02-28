# PDCA Plan - nutrition-db-hybrid-search

- Feature: `nutrition-db-hybrid-search`
- Date: `2026-02-28`
- Current Phase: `Plan`
- Level: `Dynamic`

## 1) Goal
- 수기 입력/사진 분석만으로 부족한 식단 입력 UX를 보완하기 위해, 한국 음식 중심 영양성분 검색 기능을 제공한다.
- 외부 공공 API 의존도를 줄이기 위해 내부 캐시 인덱스를 구축하고, 앱 런타임은 내부 검색 API만 사용한다.

## 2) Scope
### In Scope
- 한국 공공 영양 데이터 소스 연동 (MFDS/통합표준 중심)
- 내부 표준 스키마(`foods`) 정의 및 정규화
- 동기화 배치(초기 적재 + 증분 갱신) 설계
- 앱 검색 API(`/api/foods/search`) 설계
- FoodSearchModal 연동을 위한 UX 흐름 정의

### Out of Scope
- OCR/사진 분석 모델 개선
- 사용자 개인화 추천 엔진
- 다국가 영양 DB 완전 통합

## 3) Functional Requirements
| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-01 | 음식명 키워드로 영양 DB 검색 가능 | High | Pending |
| FR-02 | 검색 결과 선택 시 100g 기준 영양값 자동 반영 | High | Pending |
| FR-03 | 섭취량 입력 시 영양값 비례 환산 | High | Pending |
| FR-04 | 결과 없음 시 보조 소스 fallback 가능 | Medium | Pending |
| FR-05 | 검색 결과에 데이터 출처 표시 | Medium | Pending |

## 4) Non-Functional Requirements
| Category | Criteria | Verification |
|---|---|---|
| Performance | 검색 API p95 < 500ms | local/prod API timing check |
| Reliability | 외부 API 장애 시 내부 캐시 검색 지속 | outage simulation |
| Data Quality | 단위/필드 표준화(칼로리, 탄/단/지, 당, 나트륨) | schema validation |
| Security | API 키/비밀값 서버 환경변수 관리 | env/config review |

## 5) Success Criteria (DoD)
- [ ] `/api/foods/search`에서 한국 음식 검색 결과 반환
- [ ] FoodSearchModal에서 검색 선택 후 자동 채움 동작
- [ ] 기존 `/api/sheets/*`, `/api/analyze` 회귀 없음
- [ ] `npm run lint`, `npm run build` 통과
- [ ] 데이터 소스/라이선스/출처 표기 정책 문서화

## 6) Risks and Mitigation
| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| 외부 API 응답 지연/쿼터 | High | Medium | 내부 캐시 인덱스 우선 조회, 배치 동기화 |
| 소스별 필드 불일치 | Medium | High | 단일 표준 스키마 + 변환 계층 도입 |
| 라이선스/출처 표기 누락 | High | Medium | 소스별 메타 필드(출처/수집일) 강제 저장 |
| 검색 품질 저하(동의어/표기) | Medium | Medium | 키워드 정규화/별칭 컬럼/부분일치 인덱스 |

## 7) Delivery Sequence
1. 데이터 소스 확정 및 표준 스키마 확정
2. 동기화 스크립트/배치 구현
3. 내부 검색 API 구현
4. FoodSearchModal UI 연동
5. 회귀/품질 검증 및 운영 적용

## 8) Next Phase
- Next: `Design`
- Command suggestion: `$pdca design nutrition-db-hybrid-search`
