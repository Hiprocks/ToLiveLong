# PDCA 설계서 - my-menu-replan

- 기능명: `my-menu-replan`
- 작성일: `2026-02-26`
- 담당 역할: PM / FE / BE / QA
- 현재 단계: Design
- 계획 문서: `docs/01-plan/features/my-menu-replan.plan.md`

## 1) 설계 목표
- 미등록/등록 상태 전환을 단일 진입점에서 명확히 처리한다.
- 사용자 입력 데이터와 계산 결과를 일관된 섹션 구조로 표현한다.
- 계산 로직을 UI에서 분리해 재사용성과 테스트 가능성을 확보한다.

## 2) 화면/플로우 설계
### 2.1 사용자 플로우
1. `My` 진입
2. `profile_registered` 확인
3. 미등록:
- 등록 모달 자동 오픈
- 필수 정보 입력 -> 저장
- 계산 수행 후 요약 화면 표시
4. 등록:
- 섹션형 요약 화면 표시
- 하단 `수정` 버튼으로 편집 모달 진입
- 저장 후 즉시 재계산/재렌더링

### 2.2 화면 구성
1. My Summary Screen
- 상단: 프로필 요약 카드(성별/나이/신체 기본값)
- 중단: 활동/체성분/목표 섹션
- 하단: 계산 결과 섹션(BMR/TDEE/Target Calories/Macro)
- 하단 고정 CTA: `수정`

2. Profile Edit Modal
- 섹션 A: 기본 프로필(필수)
- 섹션 B: 활동/라이프스타일
- 섹션 C: 체성분(선택)
- 섹션 D: 목표 설정(필수)
- 하단 액션: `취소` / `저장`

### 2.3 레이아웃 원칙
- 모바일 우선(단일 컬럼), 데스크톱은 2컬럼 확장 허용
- 중요 지표(BMR/TDEE)는 스크롤 없이 1화면 내 노출 우선
- 선택 입력은 기본 접힘 상태로 인지 부하 제어

## 3) 상태 모델 설계
```ts
type ViewMode = "summary" | "editing";
type SaveState = "idle" | "saving" | "success" | "error";

interface MyProfileState {
  profileRegistered: boolean;
  viewMode: ViewMode;
  saveState: SaveState;
  errorMessage: string | null;
  profile: UserProfileInput | null;
  computed: NutritionTargets | null;
}
```

- `profileRegistered=false` 시 진입 시점 `viewMode="editing"` 강제
- 저장 성공 시 `saveState="success"` -> 2초 후 `idle` 복귀

## 4) 데이터 모델 설계
### 4.1 입력 모델
```ts
type Gender = "male" | "female";
type PrimaryGoal = "cutting" | "maintenance" | "bulking";
type MacroPreference = "balanced" | "low_carb" | "high_protein";
type ActivityLevel = "sedentary" | "light" | "moderate" | "very" | "extra";

interface UserProfileInput {
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  occupationalActivityLevel?: ActivityLevel;
  exerciseFrequencyWeekly?: number;
  exerciseDurationMin?: number;
  exerciseIntensity?: "low" | "medium" | "high";
  neatLevel?: ActivityLevel;
  bodyFatPct?: number;
  skeletalMuscleKg?: number;
  waistHipRatio?: number;
  primaryGoal: PrimaryGoal;
  targetPaceKgPerWeek?: number;
  macroPreference: MacroPreference;
}
```

### 4.2 계산 결과 모델
```ts
interface NutritionTargets {
  bmr: number;
  tdee: number;
  targetCalories: number;
  carbsG: number;
  proteinG: number;
  fatG: number;
}
```

## 5) 계산 엔진 설계
### 5.1 핵심 공식 (변경 금지)
- `BMR = (10 x weight[kg]) + (6.25 x height[cm]) - (5 x age[years]) + s`
- Male: `s = +5`
- Female: `s = -161`
- `TDEE = BMR x PAL`

### 5.2 PAL 매핑
- Sedentary: `1.2`
- Lightly Active: `1.375`
- Moderately Active: `1.55`
- Very Active: `1.725`
- Extra Active: `1.9`

### 5.3 목표 칼로리 로직
- cutting: `TDEE - deficit`
- maintenance: `TDEE`
- bulking: `TDEE + surplus`

### 5.4 매크로 배분 기본안
- balanced: C 45 / P 30 / F 25
- low_carb: C 30 / P 35 / F 35
- high_protein: C 35 / P 40 / F 25

### 5.5 보정 계산
- `bodyFatPct`가 존재하면 Katch-McArdle 보정값 병행 계산(옵션)
- 기본 표시는 Mifflin-St Jeor 결과 우선

## 6) API 계약 설계
기존 `user` API 경로 재사용을 기본으로 한다.

1. 조회
- `GET /api/sheets/user`
- 응답: `UserProfileInput + NutritionTargets` (없으면 null 기반 기본 구조)

2. 저장/수정
- `PUT /api/sheets/user`
- 요청: `UserProfileInput`
- 응답: 저장된 프로필 + 재계산 결과

### 6.1 오류 처리
- `400`: 유효성 실패(필수값/범위 오류)
- `500`: 저장 또는 계산 실패
- UI는 상단 배너 + 필드 인라인 오류 동시 표기

## 7) UI/UX 상세 규칙
1. 입력 검증 규칙
- age: 10~120
- heightCm: 100~250
- weightKg: 20~400
- bodyFatPct: 2~70
- waistHipRatio: 0.5~2.0

2. 마이크로카피
- 빈 상태 CTA: `프로필을 등록하면 나에게 맞는 목표 칼로리를 계산해드려요`
- 저장 성공: `내 정보가 저장되었어요`
- 저장 실패: `저장에 실패했습니다. 입력값을 확인해 주세요`

3. 상호작용 규칙
- ESC: 모달 닫기
- 배경 클릭: 모달 닫기(미저장 변경 시 확인 다이얼로그)
- 저장 중: 버튼 비활성화 + 로딩 텍스트

4. 접근성
- 모든 필드 `label` 연결, 오류는 `aria-describedby` 연결
- 포커스 트랩, 초기 포커스는 첫 필수 입력으로 이동

## 8) 컴포넌트 설계
- `src/app/my/page.tsx`
  - 분기/조회/갱신 오케스트레이션
- `src/components/my/ProfileSummarySection.tsx`
  - 등록 데이터 섹션 렌더링
- `src/components/my/ProfileEditModal.tsx`
  - 입력 폼 + 검증 + 저장 트리거
- `src/components/my/NutritionResultCard.tsx`
  - 계산 지표 시각화
- `src/lib/nutrition/calculateTargets.ts`
  - 공식/매핑/매크로 계산 순수 함수 모듈

## 9) 테스트 전략
1. 단위 테스트
- `calculateTargets` 공식 검증
- PAL 매핑, goal/macro 분기 검증
- 경계값(age/height/weight) 검증

2. 통합 테스트
- `GET/PUT /api/sheets/user` 요청-응답 계약 검증
- 저장 후 재조회 일관성 검증

3. 수동/E2E 시나리오
- 미등록 첫 진입 -> 등록 -> 결과 표시
- 등록 상태 -> 수정 -> 저장 -> 값 반영
- 잘못된 값 입력 -> 오류 메시지 확인

## 10) 구현 순서
1. `calculateTargets.ts` 및 테스트 작성
2. `ProfileEditModal` 입력/검증 구현
3. `My` 페이지 분기/조회/저장 연결
4. 결과 카드 및 섹션 UI 고도화
5. lint/build/수동 시나리오 검증

## 11) 오픈 이슈
- Katch-McArdle 보정 결과를 기본값으로 쓸지 옵션값으로만 노출할지 결정 필요
- `macro_preference` 프리셋 종류 확장 여부 결정 필요

## 12) 다음 단계
- 다음 단계: Do
- 실행 명령: `$pdca do my-menu-replan`
