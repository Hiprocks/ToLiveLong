# PDCA 계획서 - my-menu-replan

- 기능명: `my-menu-replan`
- 작성일: `2026-02-26`
- 담당 역할: PM / FE / BE / QA
- 현재 단계: Plan

## 1) 목표
`My` 메뉴를 사용자 프로필 입력 화면이 아니라, 개인화 영양 설정의 기준점이 되는 핵심 허브로 재기획한다.

- 미등록 사용자는 진입 즉시 등록 모달에서 시작한다.
- 등록 사용자는 섹션형 정보 구조로 현재 상태와 목표를 빠르게 파악하고 수정할 수 있어야 한다.
- 입력값 기반 계산 결과(BMR/TDEE/목표 칼로리/권장 매크로)를 신뢰 가능하게 제공한다.

## 2) 문제 정의
현재 `My` 메뉴는 다음 문제가 있다.

- 최초 진입 사용자의 다음 행동이 모호하다.
- 입력/조회/수정 흐름이 분리되어 정보 탐색 비용이 높다.
- 영양 계산 로직과 UI 표현의 연결 기준이 명확하지 않다.

## 3) 범위
### 포함 범위 (In Scope)
- 미등록/등록 상태 분기 UX
- 등록/수정 모달의 섹션화된 입력 구조
- 필수 데이터와 선택 데이터의 구분
- BMR/TDEE/목표 칼로리/매크로 계산 정의
- 결과 표시 섹션(요약 + 상세)
- 입력 검증, 오류 메시지, 저장 피드백

### 제외 범위 (Out of Scope)
- 병원/질환 기반 의료 진단 로직
- 웨어러블 실시간 동기화
- 식단 추천 엔진 고도화(레시피 자동 추천)

## 4) 핵심 사용자 시나리오
1. 미등록 사용자
- `My` 메뉴 진입
- 등록 모달 자동 표시
- 필수 정보 입력 후 저장
- 계산 결과와 섹션형 요약 화면으로 전환

2. 등록 사용자
- `My` 메뉴 진입
- 등록된 정보를 섹션별로 조회
- 하단 `수정` 버튼 클릭
- 변경 저장 후 계산값과 UI 즉시 갱신

## 5) 정보 구조(IA)
- 섹션 A: 기본 프로필(필수)
- 섹션 B: 활동/라이프스타일
- 섹션 C: 체성분(선택, 입력 시 정밀 계산)
- 섹션 D: 목표 설정
- 섹션 E: 계산 결과 요약(일일 권장값, 매크로 분배)

## 6) 기능 요구사항
1. 상태 분기
- `profile_registered = false` 이면 등록 모달 자동 오픈
- `profile_registered = true` 이면 섹션형 조회 화면 표시

2. 등록/수정 UI
- 입력 모달은 섹션 단위 스텝 또는 아코디언 구조를 사용
- 필수 섹션(기본 프로필, 목표 설정)은 항상 상단 노출
- 선택 섹션(체성분)은 접힘 상태 기본값 허용

3. 필수 입력 데이터 (Mandatory Data)
- 성별(`gender`)
- 나이(`age`)
- 키(`height_cm`)
- 현재 체중(`weight_kg`)

4. 활동/라이프스타일 데이터
- 직업 활동 수준(`occupational_activity_level`)
- 운동 빈도(`exercise_frequency_weekly`)
- 운동 시간(`exercise_duration_min`)
- 운동 강도(`exercise_intensity`)
- 비운동성 활동(`neat_level`)

5. 체성분 상세 데이터 (선택)
- 체지방률(`body_fat_pct`)
- 골격근량(`skeletal_muscle_kg`)
- 허리-엉덩이 비율(`waist_hip_ratio`)

6. 목표 설정 파라미터
- 최종 목표(`primary_goal`: cutting / maintenance / bulking)
- 목표 달성 속도(`target_pace_kg_per_week`)
- 매크로 선호(`macro_preference`: balanced / low_carb / high_protein 등)

7. 계산 결과 표시
- 입력값 저장 후 `My` 메뉴에서 다음 값을 즉시 표시
- `BMR`, `TDEE`, `Target Calories`, `Macro Target (C/P/F)`
- 계산 근거(공식, 활동계수)는 툴팁/도움말로 제공

8. 수정 기능
- 하단 고정 `수정` 버튼 제공
- 수정 완료 시 성공 피드백 및 섹션 재계산 반영

## 7) 계산 규칙 (핵심 명령 유지)
1. 기본 BMR 공식: `Mifflin-St Jeor`

`BMR = (10 x weight[kg]) + (6.25 x height[cm]) - (5 x age[years]) + s`

- Male: `s = +5`
- Female: `s = -161`

2. TDEE 계산

`TDEE = BMR x PAL`

3. PAL (Activity Factor)
- Sedentary: `1.2`
- Lightly Active: `1.375`
- Moderately Active: `1.55`
- Very Active: `1.725`
- Extra Active: `1.9`

4. 목표 칼로리 조정
- Cutting: `TDEE - deficit`
- Maintenance: `TDEE`
- Bulking: `TDEE + surplus`

5. 선택 정밀 계산
- 체지방률 입력 시 Katch-McArdle 기반 보정 계산 옵션 제공
- 기본값은 Mifflin-St Jeor 유지

## 8) UI/UX 전문 설계 기준
1. 정보 우선순위
- 첫 화면에서 "현재 상태 요약 + 다음 행동(수정)"만 보여 인지부하 최소화
- 고급 입력(체성분)은 선택 진입으로 분리

2. 입력 경험
- 단위 표기를 필드 라벨에 고정 노출(`cm`, `kg`, `%`, `분`)
- 숫자 입력은 허용 범위 가이드와 즉시 검증 메시지 제공
- 모바일에서 숫자 키패드 우선 호출

3. 상태 피드백
- 빈 상태: 등록 유도 CTA 명확화
- 로딩 상태: 섹션 단위 스켈레톤 제공
- 오류 상태: 필드 인라인 오류 + 상단 요약 배너 동시 제공
- 저장 상태: `idle -> saving -> success/error` 표준화

4. 접근성
- 모든 입력에 명시적 label 연결
- 색상 외 텍스트/아이콘으로 상태 전달
- 키보드 탐색, ESC 닫기, 포커스 트랩 준수

## 9) 완료 기준 (Definition of Done)
- 미등록/등록 분기 흐름이 정상 동작한다.
- 필수 입력 누락 시 저장이 차단되고 원인이 명확히 노출된다.
- 저장 후 계산 결과가 즉시 갱신된다.
- 수정 버튼으로 재진입/재저장이 가능하다.
- BMR/TDEE 계산 결과가 정의된 공식과 일치한다.
- `npm run lint`, `npm run build` 통과
- 수동 테스트 시나리오 문서 반영

## 10) 리스크 및 대응
- 리스크: 계산 로직 불일치로 신뢰도 저하
  - 대응: 계산 유틸 단일화 + 단위 테스트 추가
- 리스크: 입력 항목 과다로 이탈 증가
  - 대응: 필수/선택 분리 + 단계적 공개(Progressive Disclosure)
- 리스크: 모바일 입력 피로도
  - 대응: 기본값 제안, 숫자 키패드, 자동 포커스 이동

## 11) 산출물
- 코드(예상):
  - `src/app/my/page.tsx`
  - `src/components/my/ProfileSummarySection.tsx`
  - `src/components/my/ProfileEditModal.tsx`
  - `src/lib/nutrition/calculateTargets.ts`
- 문서:
  - `docs/01-plan/features/my-menu-replan.plan.md`
  - `docs/02-design/features/my-menu-replan.design.md` (다음 단계)
  - `docs/03-analysis/my-menu-replan.analysis.md` (검증 단계)

## 12) 다음 단계
- 다음 단계: Design
- 실행 명령: `$pdca design my-menu-replan`
