# ToLiveLong Overview

## 1) 결정사항 요약
- Supabase 제거, Google Sheets API v4로 전환
- 범위 축소: 개인용 핵심 3개 도메인
- 사용자 신체정보 기반 목표 계산(내 정보 저장) 지원

## 2) 최종 기능 범위 (Target)
1. 목표값 설정
2. 식단 등록 (수기 / AI / 템플릿 / DB검색 / 즐겨찾기)
3. 조회/편집 (오늘 대시보드 + 히스토리 + 통계 + 내 정보)

## 3) 현재 구현 상태 (As-Is, 2026-03-13)

### 페이지 구성
| 경로 | 설명 |
|---|---|
| `/` | 대시보드: 오늘 식단 목록, 칼로리 도넛 게이지, 영양소 진행바 |
| `/history` | 히스토리: 날짜 네비게이션(좌우 버튼 + 날짜 피커), 기록 조회/수정/삭제 |
| `/stats` | 통계: 주간/월간 영양 바차트(Recharts), AI 식단 리뷰(스트리밍) |
| `/my` | 내 정보: 신체 프로필 등록, AI 목표 계산, 식단 리뷰 캐시 표시 |
| `/onboarding` | 온보딩: 최초 신체 프로필 입력 플로우 |

### API Routes
| 경로 | 메서드 | 설명 |
|---|---|---|
| `/api/sheets/records` | GET, POST | 날짜별 기록 조회, 신규 기록 추가 (옵션: 템플릿 동시 저장) |
| `/api/sheets/records/[id]` | GET, PUT, DELETE | 기록 단건 조회/수정/삭제 |
| `/api/sheets/records/summary` | GET | 기간별 일별 합산 요약 (통계 페이지용) |
| `/api/sheets/templates` | GET, POST, PUT, DELETE | 템플릿 CRUD |
| `/api/sheets/user` | GET, PUT | 신체 프로필 + 목표값 조회/수정 |
| `/api/sheets/user/diet-review` | POST | AI 식단 리뷰 결과 저장 |
| `/api/analyze` | POST | 음식 사진 → 영양성분 JSON (Gemini Vision) |
| `/api/analyze/text` | POST | 자연어 → 영양성분 JSON + intake_summary (Gemini) |
| `/api/analyze/diet-review` | POST | 기간 식단 요약 → AI 코칭 텍스트 스트리밍 (Gemini) |
| `/api/foods/search` | GET | 한국 음식 DB 키워드 검색 (226개 내부 인덱스) |

### 핵심 라이브러리 모듈
| 파일 | 역할 |
|---|---|
| `src/lib/sheets.ts` | Google Sheets API v4 공통 클라이언트 |
| `src/lib/sheetsCache.ts` | Next.js `unstable_cache` 기반 Sheets 데이터 캐싱 (TTL별 무효화) |
| `src/lib/clientSyncCache.ts` | 클라이언트 메모리 캐시 + dirty 플래그 (낙관적 업데이트 지원) |
| `src/lib/nutrition/calculateTargets.ts` | BMR/TDEE 계산, 목표별 매크로 배분 (Katch-McArdle 포함) |
| `src/lib/nutrition/aiTargets.ts` | Gemini 기반 AI 코칭 피드백 생성 + fallback 로직 |
| `src/lib/nutritionTone.ts` | 영양소 4단계 톤 시스템 (low/ok/slight/high) |
| `src/lib/mealAdjustments.ts` | 섭취 조정 메타 (국/탕 건더기 선택, 섭취 비율) + 역산 로직 |
| `src/lib/foodsIndex.ts` | 한국 음식 DB 인덱스 (226개, 공식 데이터 기반) |
| `src/lib/analyzePayload.ts` | Gemini 응답 JSON 정규화 + 영양성분 상하한 보정 |
| `src/lib/apiGuard.ts` | same-origin 쓰기 가드 |
| `src/lib/types.ts` | 공용 타입 정의 |
| `src/hooks/useModalHistory.ts` | PWA 백버튼 모달 스택 제어 (이중 back 방지) |

### 주요 컴포넌트
| 컴포넌트 | 역할 |
|---|---|
| `MealEntryFab` | 식단 등록 진입 FAB (+버튼): 수기/AI/템플릿/DB검색/즐겨찾기 |
| `FoodSearchModal` | 수기/DB검색/AI 텍스트 입력, 섭취 조정(국/탕, 비율) |
| `PhotoAnalysisModal` | 사진 업로드 → Gemini 분석 → prefill |
| `TextAnalysisModal` | 자연어 입력 → Gemini 분석 → prefill + AI 답변 요약 |
| `CalorieGauge` | 칼로리 도넛 SVG 게이지 |
| `MealTable` | 기록 리스트 + 인라인 편집 |
| `IntakeSummaryTable` | 영양소 진행바 테이블 |
| `DateNavCard` | 날짜 네비게이션 카드 (좌우 이동 + 피커) |
| `LoadingOverlay` | 공통 로딩 오버레이 |
| `BottomNav` | 하단 네비게이션 바 |

### Gemini API 모델 fallback 체인
`gemini-2.5-pro → gemini-2.5-flash → gemini-2.0-flash`  
(구버전 gemini-1.5-flash, gemini-1.5-pro는 삭제됨 — `DEFAULT_MODEL_CANDIDATES` 목록에서 제거 필요)

### 완료 항목
- Google Sheets 공통 클라이언트 + API Routes 전체
- 대시보드/히스토리/통계/내 정보 페이지 연동
- 식단 등록: 수기/템플릿/DB검색/사진분석/AI 자연어/즐겨찾기 통합 플로우
- 영양소 4단계 톤 시스템 (low/ok/slight/high) + 달성 아이콘
- 섭취 조정 메타(IntakeMeta): 국/탕 건더기 선택, 25%/50%/75%/100% 비율
- Sheets 서버 캐시 (`unstable_cache`) + 클라이언트 동기화 캐시
- AI 식단 리뷰 (스트리밍): 주간 데이터 기반 코칭 텍스트
- 음식 DB 226개 (공식 데이터 기반 1인분 중량 보정)
- PWA: manifest, SW, 아이콘, 백버튼 이중 방지 (`useModalHistory`)
- same-origin 쓰기 가드, 날짜 로컬 기준 통일, 입력 검증 표준화
- 즐겨찾기 원탭 등록 + 최근 사용 순 정렬

## 4) 기능-문서 반영 플로우
1. 기능 변경 발생 시 `docs/CHANGELOG.md`를 먼저 업데이트
2. 기능/상태 요약 변경 시 `docs/overview.md` 업데이트
3. 기술구조/API 변경 시 `docs/Context.md` 업데이트
4. 작업 항목 변경 시 `docs/Todo.md` 업데이트
5. 회귀/실수 발생 시 `docs/MistakeNote.md` 기록
6. 시트 컬럼/매핑 변경 시 `docs/Schema.md` 업데이트

## 5) 다음 구현 우선순위
- [P3] PWA 운영 UX: 설치 유도 배너(`beforeinstallprompt`), 오프라인 캐시 전략 세분화
- [P3] E2E 스모크 테스트 자동화 (등록/수정/삭제 핵심 시나리오)
- [P4] 주간 인사이트 리포트 (달성률 요약, 이탈 구간 하이라이트)
- [P4] 바코드 스캔 기반 음식 등록
- [P4] 스트릭/리마인드 기능

---

## Update Log

### 2026-02-25
- Google Sheets API v4 전환, Supabase 제거
- `+` FAB → 수기/템플릿/사진분석 3가지 진입
- 대시보드 칼로리 게이지 + 영양소 진행바 도입
- 입력 검증/에러 응답 표준화, same-origin 가드 적용
- `prebuild` 시 `test:analyze` 자동 실행

### 2026-02-25 (추가)
- `meal_type` UI/페이로드에서 제거
- 대시보드 목표 영역 바 그래프 방식으로 변경
- 일일 기록 단일 통합 리스트로 변경

### 2026-02-27
- 린매스업(recomposition) 목표 추가, 매크로 타입(균형/고단백/저탄고지) 반영
- 체지방률 입력 시 Katch-McArdle 기반 BMR 계산 적용

### 2026-03-06 (AI 자연어 등록)
- 식단 등록에 `AI 등록` 추가: 자연어 입력 → `POST /api/analyze/text` → prefill
- `FoodSearchModal`에서 AI 답변 요약(`intake_summary`) 표시
- 공통 `LoadingOverlay` 도입으로 로딩 UX 일관화

### 2026-03-06 (목표 체계 리팩터)
- 목표 4종 고정 (cutting/maintenance/bulking/recomposition)
- `calculateTargets.ts` 전면 재구성: sedentary 계수 1.35, NEAT 폐지
- lean recomposition 분기, 단백질/지방 상한, 10kcal/5g 반올림
- `macroPreference` 제거, `waistCm` 입력 추가

### 2026-03-07 ~ 03-12 (UX 고도화)
- **통계 페이지** (`/stats`): 주간/월간 Recharts 바차트, AI 식단 리뷰 스트리밍
- **4단계 톤 시스템**: `nutritionTone.ts` 도입 (low/ok/slight/high + 달성 아이콘)
- **섭취 조정 메타** (`IntakeMeta`): 국/탕 건더기 선택, 25~100% 비율 조정 + 역산
- **즐겨찾기 즉시 등록**: FAB에서 즐겨찾기 원탭 등록, 최근 사용 순 정렬
- **Sheets 서버 캐시**: `sheetsCache.ts` — `unstable_cache` + 태그 무효화
- **클라이언트 캐시**: `clientSyncCache.ts` — 메모리 캐시 + dirty 플래그
- **음식 DB 확대**: 150 → 226개 (외식 76개 추가, 공식 데이터 기반 보정)
- **PWA 백버튼 개선**: `useModalHistory` — 모달 닫기 후 이중 back 방지
- **`/api/analyze/diet-review`**: 기간 식단 요약 → AI 코칭 텍스트 스트리밍
- **`/api/sheets/records/summary`**: 기간별 일별 합산 요약 API 추가
- `MealEntryFab`: 대시보드/통계 페이지 공유, FAB 안정화 (프로덕션 빌드 수정)
