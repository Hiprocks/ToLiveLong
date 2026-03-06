# Context

## 1) 프로젝트 개요
- 프로젝트명: ToLiveLong
- 목적: 일일 식단/영양(칼로리, 탄수화물, 단백질, 지방, 당, 나트륨) 기록 및 목표 대비 추적
- 대상: 개인 단독 사용
- 기준 문서: `docs/overview.md`

## 2) 핵심 기능 (3개 도메인)
1. 일일 목표값 설정 (온보딩에서 계산 후 저장)
2. 식단 등록 (수기 / AI 사진 분석 / 템플릿 재사용)
3. 기록 조회 및 편집 (오늘 대시보드 + 날짜별 히스토리)

## 3) 기술 스택
- Framework: Next.js App Router
- Language: TypeScript (`strict: true`)
- UI: React 19, Tailwind CSS v4, lucide-react, recharts
- Data: Google Sheets API v4 (`googleapis`)
- AI: Gemini API (`gemini-1.5-pro`)
- Hosting: Vercel

## 4) 현재 구현 상태 (2026-02-25 기준)
- 구현 완료:
  - `src/lib/sheets.ts` Google Sheets 공통 접근 로직
  - `src/app/api/sheets/records` GET/POST
  - `src/app/api/sheets/records/[id]` PUT/DELETE
  - `src/app/api/sheets/templates` GET/POST
  - `src/app/api/sheets/user` GET/PUT
  - `src/app/page.tsx` 대시보드 Google Sheets 연동
  - `src/app/history/page.tsx` 날짜별 조회 + 수정/삭제
  - `src/app/my/page.tsx` 목표값 조회/수정
  - `src/components/FoodSearchModal.tsx` 수기/템플릿 입력 + 저장
  - `src/components/PhotoAnalysisModal.tsx` 분석 결과 저장 + 템플릿 저장 옵션
  - Supabase 관련 잔존 파일/의존성 제거 완료
  - API 입력 검증/에러 응답 표준화 적용
  - same-origin 쓰기 가드 적용
  - 기록 저장 시 템플릿 저장 실패 롤백 처리
  - 레코드 조회/수정/삭제에서 전체 시트 스캔 최소화
  - 공통 에러 배너 UI 적용 (`src/components/ErrorBanner.tsx`)
  - 날짜 처리 로컬 포맷 유틸 통일 (`src/lib/date.ts`)
  - 템플릿 모달 메모리 캐시 적용 (60초)

## 5) Google Sheets 구조
### Sheet: `records`
- 컬럼: `id`, `date`, `meal_type`, `food_name`, `amount`, `calories`, `carbs`, `protein`, `fat`, `sugar`, `sodium`

### Sheet: `templates`
- 컬럼: `id`, `food_name`, `base_amount`, `calories`, `carbs`, `protein`, `fat`, `sugar`, `sodium`

### Sheet: `user` (단일 행)
- 컬럼: `daily_calories`, `carbs`, `protein`, `fat`, `sugar`, `sodium`

## 6) API Routes
- `GET /api/sheets/records`: 날짜 기준 기록 조회 (날짜 컬럼 인덱싱 조회)
- `POST /api/sheets/records`: 기록 추가 (옵션: 템플릿 저장)
- `PUT /api/sheets/records/[id]`: 기록 수정 (id 컬럼 기반 조회)
- `DELETE /api/sheets/records/[id]`: 기록 삭제 (id 컬럼 기반 조회)
- `GET /api/sheets/templates`: 템플릿 목록 조회
- `POST /api/sheets/templates`: 템플릿 추가
- `GET /api/sheets/user`: 목표값 조회
- `PUT /api/sheets/user`: 목표값 수정
- `POST /api/analyze`: Gemini 이미지 분석

## 7) 디렉터리 핵심
- `src/lib/sheets.ts`: Sheets 인증/CRUD 유틸
- `src/lib/types.ts`: 공통 타입
- `src/lib/apiValidation.ts`: API 입력 검증
- `src/lib/apiGuard.ts`: same-origin 쓰기 요청 가드
- `src/lib/date.ts`: 로컬 날짜 포맷 유틸
- `src/app/api/sheets/*`: Sheets API 라우트
- `src/app/page.tsx`: 오늘 대시보드
- `src/app/history/page.tsx`: 날짜별 기록 관리
- `src/app/my/page.tsx`: 목표값 관리
- `src/components/FoodSearchModal.tsx`: 수기/템플릿 입력
- `src/components/PhotoAnalysisModal.tsx`: 사진 분석 입력
- `src/components/ErrorBanner.tsx`: 공통 에러 표시

## 8) 환경 변수
- `GOOGLE_SHEETS_ID`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GEMINI_API_KEY`

## 9) 문서 운영 규칙
- 기능 상태 변경: `docs/overview.md` 갱신
- 구조/API 변경: `docs/Context.md` 갱신
- 할 일 추가/완료: `docs/Todo.md` 갱신
- 실수/회귀: `docs/MistakeNote.md` 기록
- 데이터 스키마 변경: `docs/Schema.md` 갱신

---

## 10) Context Update (2026-02-25)

- Dashboard entry UX changed to single floating action button with mode sheet.
- `FoodSearchModal` now supports:
  - `initialMode` prop (`manual` | `template`)
  - recent-template prioritization via localStorage
  - required-field validation for `food_name` and `amount`
- `PhotoAnalysisModal` now supports:
  - required-field validation before save
  - optional `onSaved` callback for global success feedback
- Analyze normalization logic extracted into `src/lib/analyzePayload.ts`.
- Analyze unit test added: `src/lib/analyzePayload.test.ts`.
- Build gate updated: `prebuild -> test:analyze -> build`.

---

## 11) Context Update (2026-02-25, Meal Type Removal)

- `MealRecord` no longer includes `meal_type` in app-level type/API payload.
- Records sheet compatibility is kept by preserving column position while writing empty value for legacy `meal_type` slot.
- Dashboard target UI now uses progress bars (current/target) under calorie gauge.

---

## 12) UI Language Policy (2026-02-27)

- 사용자에게 노출되는 메뉴명/탭명/주요 액션명은 한글만 사용한다.
- 신규 UI 추가 시 영어 메뉴명은 금지한다.
- 기존 영어 메뉴명 발견 시 기능 변경 여부와 무관하게 한글로 우선 치환한다.

## 13) UI Language Policy (2026-02-26, enforced)

- User-facing menu names, tab names, and primary action labels must be Korean only.
- New English menu labels are not allowed.
- If an English label is found in existing UI, replace it with Korean in the same change set.

---

## 14) Context Update (2026-02-27, My Body Composition)

- My 프로필에 린매스업(Body Recomposition) 목표 추가.
- 식단 타입(균형/고단백/저탄고지) 선택을 매크로 계산에 반영.
- 체지방률 입력 시 Katch-McArdle 기반 BMR 계산 적용.
- 목표-식단 타입 상충 시 경고 안내 문구 추가.

## 15) Reference (2026-02-27)

- 코드베이스 요약 문서: `docs/CodebaseAnalysis.md`

## 16) Context Update (2026-02-27, My AI Notes Storage)

- My AI 조언 결과를 `user` 시트에 저장하고 표시하도록 변경.
- GET 시 AI 재호출하지 않고 저장된 AI 결과를 사용.

## 17) Context Update (2026-03-06, AI Text Entry + Loading Overlay)

- 대시보드 `+` 메뉴에 `AI 등록` 진입이 추가됨.
- 신규 API `POST /api/analyze/text` 도입:
  - 자연어 식사 입력을 Gemini로 분석해 `food_name`, `amount`, 영양성분, `intake_summary` 반환.
- `TextAnalysisModal` 결과가 `FoodSearchModal` 수기 입력 prefill로 연결됨.
- `FoodSearchModal`에 `AI 답변 요약` 박스가 추가됨 (UI 검토용, records 저장 스키마는 유지).
- 공통 `src/components/LoadingOverlay.tsx` 도입으로 대시보드/히스토리/내정보/모달의 로딩 표시를 일관화.
- `my` 페이지 AI 테스트 중복 요청 방지 및 사진 분석 실패 토스트 안내가 추가됨.

---

## 18) Context Update (2026-03-06, Goal System Refactor)

- 목표 체계 4개 고정: `cutting / bulking / recomposition / maintenance`
- **NEAT 별도 입력 폐지**: `neatLevel` 타입 제거, 활동 수준 단일 드롭다운("활동 수준")으로 통합
- `sedentary` PAL 계수 1.2 → **1.35** 확정
- `macroPreference` 타입 및 UI 제거
- `waistCm` (optional) 신규 입력 추가 — 지방 추적 지표
- `calculateTargets.ts` 전면 재구성:
  - PAL = ACTIVITY_FACTOR[occupationalActivityLevel] only (NEAT_ADJUSTMENT 삭제)
  - lean recomposition 분기 (체지방 ≤15%/23% → maintenance 칼로리)
  - 단백질 상한: 체중×2.2g, 칼로리 35% 동시 적용
  - 지방: 칼로리 비율(25~30%) + 최소 보장(체중×0.6g)
  - 출력 단위: 칼로리 10 kcal, 매크로 5g 반올림
- `calculateTargets.test.ts` 신규 작성 (4 시나리오, 4/4 PASS)
- Google Sheets `user` 시트: `waistCm` 컬럼 추가, `macroPreference` 제거

## 19) Context Update (2026-03-06, Protein Calculation Hotfix)

- `recomposition` 목표 + 체지방률 입력 시 LBM 기반 단백질 계산 적용 (기존 cutting 전용 → cutting/recomposition 공통)
- LBM 계수 분리: cutting = 2.2 g/kg LBM, recomposition = **2.5 g/kg LBM**
  - recomposition은 근 합성 자극이 동반되므로 cutting보다 높은 단백질 필요
  - 예) 60kg 남성 체지방 27.2% → 95g → **110g**
- 단위 테스트 2개 추가 (총 6개): recomposition LBM×2.5, cutting LBM×2.2 경로 각각 검증
- `calculateTargets.test.ts`에서 잔존 `neatLevel` 참조 제거
