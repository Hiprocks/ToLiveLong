# Plan: weekly-stats-chart

## 1. User Intent
- 칼로리 + 탄수/단백질/지방의 실제 섭취량을 목표 대비로 기간별로 확인
- 주간 바 차트(이전/다음 주 탐색) + 월간 요약 카드
- 별도 통계 페이지(/stats) 신설, 하단 네비에 탭 추가

## 2. Scope (YAGNI 확정)

### Must Have
| 항목 | 내용 |
|------|------|
| `/stats` 페이지 | 하단 네비 4번째 탭 ("통계") |
| 주간 바 차트 — 칼로리 | 메인 크게, 목표 기준선 포함, 주 단위 탐색 |
| 주간 소형 차트 — 탄수/단백질/지방 | 3개 나란히, 각 목표선 포함 |
| 월간 요약 카드 | 평균 칼로리·탄단지 vs 목표, 목표 달성일 수 |
| `GET /api/sheets/records/summary` | from/to 날짜 범위 → 일별 집계 반환 |

### Won't Do
- 월별 캘린더 뷰 (B-2로 분리)
- 나트륨/당 추세

## 3. API 설계
```
GET /api/sheets/records/summary?from=YYYY-MM-DD&to=YYYY-MM-DD

Response: DailySummary[]
[
  { "date": "2026-03-01", "calories": 1820, "carbs": 210, "protein": 95, "fat": 55 },
  ...
]
```
- from/to 사이 날짜 중 기록 없는 날은 결과에서 생략 (클라이언트가 0으로 처리)
- 서버에서 listRows → 날짜 필터 → 일별 합산
- unstable_cache tag: `records`, TTL: 30s

## 4. 화면 레이아웃 (방안 X)
```
/stats
─────────────────────────
[주간 바 차트 — 칼로리]
  < 이전 주   03.01 ~ 03.07   다음 주 >
  목표선──────────────────
  ██  ██  ██  ██  ██  ██  ██
  일  월  화  수  목  금  토

[탄수]     [단백질]     [지방]
목표선      목표선       목표선
██ ██ ██   ██ ██ ██    ██ ██ ██

─────────────────────────
[월간 요약 — 2026년 3월]
  평균 칼로리  1,820 / 2,000
  탄수         210 / 280g
  단백질        95 / 120g
  지방          55 / 65g
  목표 달성일   12 / 31일
```

## 5. File Changes
- `src/app/api/sheets/records/summary/route.ts` (신규)
- `src/lib/sheetsCache.ts` (getCachedSummary 추가)
- `src/app/stats/page.tsx` (신규)
- `src/components/BottomNav.tsx` (통계 탭 추가)

## 6. Success Criteria
- 주간 차트에서 칼로리·탄단지 4개 영양소를 목표 대비로 확인 가능
- 주 단위 이전/다음 탐색 가능
- 월간 평균·달성일 확인 가능
- summary API 캐시 적용으로 반복 조회 빠름
