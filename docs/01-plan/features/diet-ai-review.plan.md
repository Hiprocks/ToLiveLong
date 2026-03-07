# Plan: 식단 AI 평가 (diet-ai-review)

**작성일**: 2026-03-06  
**Feature ID**: diet-ai-review  
**Phase**: Plan  
**방법론**: Plan Plus (Brainstorming-Enhanced PDCA)

---

## 1. User Intent

통계 페이지에서 버튼 하나로 최근 7일 식단을 AI가 분석해 구체적이고 직설적인 피드백을 받는다.  
결과는 재생성 전까지 localStorage에 유지되며, 매주 반복 확인해 개선 추이를 파악하는 데 사용한다.

### 핵심 문제
데이터는 있지만 "잘 하고 있는지 / 어디가 문제인지" 스스로 판단하기 어렵다.  
AI가 목표 수치 + 신체 프로필을 모두 반영해 개인화된 평가를 제공해야 한다.

### 사용 패턴
매주 반복 체크 — "지난주보다 나아졌나?" 확인용

---

## 2. Alternatives Explored

| 방안 | 요약 | Effort | 선택 여부 |
|------|------|--------|-----------|
| A. 일반 API 호출 | POST → JSON 응답 대기 | Low | 미선택 |
| B. 스트리밍 응답 | Gemini Stream → 타이핑 효과 실시간 표시 | Medium | **선택** |
| C. 사전 캐싱 | 페이지 진입 시 백그라운드 생성 | High | 미선택 |

**B 선택 이유**: 응답까지 3~8초 대기 중 타이핑 효과로 체감 속도 향상. 기존 Gemini 패턴 재사용 가능.

---

## 3. YAGNI 스코프

### Must Have
1. 통계 페이지 상단 "AI 평가받기" 버튼
2. 최근 7일 칼로리·탄단지 실제 vs 목표 데이터 전송
3. 신체 프로필(나이·성별·체중·목표·활동수준) 데이터 전송
4. Gemini 스트리밍 응답 → 타이핑 효과 표시
5. 평가 결과 3섹션 구조화 (잘한 점 / 부족·과한 점 / 개선 행동)
6. 재생성 버튼
7. 마지막 결과 localStorage 유지 (재생성 전까지)

### Won't Do (이번 MVP 제외)
- 평가 히스토리 저장 (서버 보관)
- 결과 공유 버튼
- 매주 알림 (PWA 푸시)
- 영양소 클릭 드릴다운

---

## 4. Architecture

### 데이터 흐름

```
[stats/page.tsx]
  └─ "AI 평가받기" 버튼 클릭
       ├─ localStorage 키: "diet-ai-review-last"
       │    ├─ 값 있음 → 즉시 표시 + "재생성" 버튼 노출
       │    └─ 값 없음 → 자동으로 API 호출 시작
       └─ "재생성" 클릭 → POST /api/analyze/diet-review
            ├─ body: { summaries: DailySummary[], targets: DailyTargets, profile: UserProfile }
            └─ Response: ReadableStream (text/plain; charset=utf-8)
                 └─ 청크 누적 → 타이핑 효과 렌더링
                      └─ 완료 시 localStorage 저장 (타임스탬프 포함)
```

### 신규 파일
- `src/app/api/analyze/diet-review/route.ts` — 스트리밍 API 엔드포인트

### 수정 파일
- `src/app/stats/page.tsx` — 평가 UI 섹션 추가

---

## 5. API 설계

### POST /api/analyze/diet-review

**Request Body**
```typescript
{
  summaries: Array<{
    date: string;       // "YYYY-MM-DD"
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
  }>;
  targets: {
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
  };
  profile: {
    age?: number;
    gender?: string;
    weight?: number;
    goal?: string;
    activityLevel?: string;
  };
}
```

**Response**: `text/plain; charset=utf-8` (스트리밍)

---

## 6. Gemini 프롬프트 구조

```
당신은 영양 전문가입니다. 아래 사용자 데이터를 바탕으로 가감없이 평가해주세요.

[사용자 프로필]
- 나이: {age}세, 성별: {gender}, 체중: {weight}kg
- 목표: {goal}, 활동 수준: {activityLevel}

[최근 7일 영양 섭취 (실제 vs 목표)]
| 날짜 | 칼로리 | 탄수화물 | 단백질 | 지방 |
...데이터...
| 목표 | {cal}kcal | {carbs}g | {protein}g | {fat}g |

아래 3가지 섹션으로 평가해주세요. 각 섹션 앞에 이모지를 붙여주세요.

✅ 잘한 점
(목표를 잘 지킨 영양소, 일관성 있게 유지한 부분)

⚠️ 부족하거나 과한 점
(목표 대비 차이가 큰 영양소, 그로 인한 건강 영향 설명)

🎯 이번 주 개선 행동 제안
(구체적이고 실천 가능한 행동 1~3가지)

조언은 직설적으로, 전문 용어는 쉽게 풀어서 설명해주세요.
```

---

## 7. UI/UX 설계

### 상태별 표시

| 상태 | UI |
|------|-----|
| 첫 진입 (평가 없음) | "AI에게 식단 평가받기" 버튼 |
| 로딩 중 (스트리밍) | 타이핑 커서 애니메이션 + 텍스트 누적 표시 |
| 완료 | 평가 텍스트 전체 표시 + 생성 시각 + "재생성" 버튼 |
| 재생성 중 | 기존 텍스트 fade out → 새 텍스트 타이핑 |
| 에러 | "평가를 불러오지 못했습니다. 다시 시도해주세요." |

### localStorage 키
```
KEY: "diet-ai-review-last"
VALUE: { text: string; generatedAt: string; }  // generatedAt: ISO 날짜
```

---

## 8. Success Criteria

| 기준 | 목표값 |
|------|--------|
| 첫 글자 표시까지 (TTFT) | < 2초 |
| 전체 응답 완료 | < 15초 |
| 평가 3섹션 항상 포함 | 100% |
| 재방문 시 localStorage 즉시 표시 | 페이지 진입 후 0ms |
| 7일 미만 데이터 처리 | 에러 없이 있는 날짜만 전송 |

---

## 9. Risks & Mitigations

| 리스크 | 영향 | 대응 |
|--------|------|------|
| 7일 데이터 없거나 부족 | 평가 품질 저하 | 있는 날짜만 전송 + 프롬프트에 "N일치 데이터" 명시 |
| Gemini 모델 불가 | 응답 실패 | 기존 `DEFAULT_MODEL_CANDIDATES` fallback 패턴 재사용 |
| 스트리밍 중 네트워크 에러 | 불완전한 텍스트 표시 | 부분 텍스트 유지 + 에러 메시지 append |
| localStorage 용량 초과 | 저장 실패 | try-catch로 graceful fail, 메모리에만 유지 |
| 프로필 미입력 사용자 | 개인화 불가 | 프로필 없는 항목은 프롬프트에서 제외 |
