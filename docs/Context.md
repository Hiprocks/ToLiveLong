# Context

## 1) 프로젝트 개요
- 프로젝트명: ToLiveLong
- 목적: 일일 식단/영양(칼로리, 탄수화물, 단백질, 지방, 당, 나트륨) 기록 및 목표 대비 추적
- 기준 문서: `docs/overview.md` (기능 명세/현재 구현 상태)
- 현재 상태: MVP 구현 단계 (핵심 기록/조회/사진 분석 일부 완료, History/My는 WIP)

## 2) 기술 스택
- Framework: Next.js App Router (`next@16.1.1`)
- Language: TypeScript (`strict: true`)
- UI: React 19, Tailwind CSS v4, lucide-react, recharts, framer-motion(설치됨)
- Data: Supabase (`@supabase/supabase-js`)
- AI: Gemini (`@google/generative-ai`, `gemini-1.5-pro`)
- Lint: ESLint + next/core-web-vitals + next/typescript

## 3) 디렉터리/구조
- `src/app/layout.tsx`: 루트 레이아웃, 하단 네비게이션 포함
- `src/app/page.tsx`: 오늘 식단 메인 화면(합계/게이지/요약/리스트)
- `src/app/onboarding/page.tsx`: 사용자 정보 입력 후 목표치 계산/저장(localStorage)
- `src/app/history/page.tsx`: 히스토리 페이지(현재 placeholder)
- `src/app/my/page.tsx`: 내 정보 페이지(현재 placeholder)
- `src/app/api/analyze/route.ts`: 이미지 분석 API(Gemini)
- `src/components/*`: 기록 모달, 사진 분석 모달, 테이블, 게이지, 하단 네비
- `src/lib/supabase.ts`: Supabase client
- `src/lib/calculations.ts`: BMR/TDEE 기반 목표 영양 계산
- `src/lib/food-data.ts`: 로컬 음식 검색용 샘플 데이터
- `supabase_schema.sql`: DB 스키마 초안

## 4) 현재 핵심 동작
- 온보딩에서 사용자 신체정보/목표를 입력하면 일일 목표치를 계산해 localStorage 저장
- 메인에서 당일 로그를 Supabase `daily_logs`에서 조회 후 합산 표시
- 음식 검색 모달: 로컬 데이터에서 선택/서빙 비율 계산 후 저장
- 사진 분석 모달: `/api/analyze` -> Gemini 응답(JSON) -> 사용자 확인 후 저장

## 5) 데이터 모델 정리
- 코드에서 사용하는 로그 필드:
  - `meal_type`, `menu_name`, `calories`, `carbs`, `protein`, `fat`, `sugar`, `sodium`, `date`, `created_at`
- `supabase_schema.sql` 현재 필드:
  - `meal_type`, `menu_name`, `calories`, `carbs`, `protein`, `fat`, `image_url`, `date`, `created_at`
- 차이점:
  - 코드에는 `sugar`, `sodium` 저장 로직이 있으나 스키마에는 없음 (스키마 불일치)

## 6) 환경 변수
- 클라이언트(Supabase):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- 서버(API route):
  - `GEMINI_API_KEY`

## 7) 컨벤션/개발 지침
- TypeScript strict 모드 유지
- import alias `@/*` 사용
- 컴포넌트는 함수형 + 훅 기반
- 스타일은 Tailwind 유틸리티 우선, 글로벌 토큰은 `src/app/globals.css`
- 기능 추가 시 우선 문서 동기화:
  - 요구사항 변경: `docs/overview.md` 반영
  - 기술/구조 변경: `docs/Context.md` 반영
- 작업 항목 관리:
  - 앞으로 할 일은 `docs/Todo.md`에 기록
- 실수/회고 관리:
  - 실수 또는 회귀 발생 시 `docs/MistakeNote.md`에 원인/재발방지 기록

## 8) 현재 확인된 리스크
- 텍스트 인코딩 깨짐(한글 표시 이상)이 일부 파일/문구에서 관찰됨
- DB 스키마와 앱 쓰기 필드 불일치(`sugar`, `sodium`)
- RLS 정책이 현재 `for all using (true)`로 매우 완화됨
- `history`, `my` 페이지가 placeholder 상태
- `src/components/AddMealModal.tsx`는 현재 실사용 경로에서 미사용

## 9) 운영 규칙 (중요)
- 새 작업 시작 전: `docs/Context.md`와 `docs/Todo.md` 확인
- 작업 중 요구사항 변경 발견 시: 즉시 `docs/Context.md` 갱신
- 버그/실수/회귀 발견 시: `docs/MistakeNote.md` 기록 후 재발방지 액션을 Todo에 추가

## 10) 참조 파일
- 기능 명세: `docs/overview.md`
- 실행 가이드: `README.md`, `env_setup.txt`
- 스키마: `supabase_schema.sql`

## 11) 문서 반영 플로우 연결
- 기능 변경 시 `docs/overview.md`의 `5) 기능 추가 시 문서 반영 플로우`를 따른다.
- 해당 플로우에 따라 `docs/Context.md`, `docs/Todo.md`, `docs/MistakeNote.md`, `docs/Schema.md`를 함께 갱신한다.
