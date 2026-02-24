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
- 남은 정리:
  - Supabase 관련 잔존 파일/의존성 제거
  - `.env.local` 변수 전환 정리

## 5) Google Sheets 구조
### Sheet: `records`
- 컬럼: `id`, `date`, `meal_type`, `food_name`, `amount`, `calories`, `carbs`, `protein`, `fat`, `sugar`, `sodium`

### Sheet: `templates`
- 컬럼: `id`, `food_name`, `base_amount`, `calories`, `carbs`, `protein`, `fat`, `sugar`, `sodium`

### Sheet: `user` (단일 행)
- 컬럼: `daily_calories`, `carbs`, `protein`, `fat`, `sugar`, `sodium`

## 6) API Routes
- `GET /api/sheets/records`: 날짜 기준 기록 조회
- `POST /api/sheets/records`: 기록 추가 (옵션: 템플릿 저장)
- `PUT /api/sheets/records/[id]`: 기록 수정
- `DELETE /api/sheets/records/[id]`: 기록 삭제
- `GET /api/sheets/templates`: 템플릿 목록 조회
- `POST /api/sheets/templates`: 템플릿 추가
- `GET /api/sheets/user`: 목표값 조회
- `PUT /api/sheets/user`: 목표값 수정
- `POST /api/analyze`: Gemini 이미지 분석

## 7) 디렉터리 핵심
- `src/lib/sheets.ts`: Sheets 인증/CRUD 유틸
- `src/lib/types.ts`: 공통 타입
- `src/app/api/sheets/*`: Sheets API 라우트
- `src/app/page.tsx`: 오늘 대시보드
- `src/app/history/page.tsx`: 날짜별 기록 관리
- `src/app/my/page.tsx`: 목표값 관리
- `src/components/FoodSearchModal.tsx`: 수기/템플릿 입력
- `src/components/PhotoAnalysisModal.tsx`: 사진 분석 입력

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
