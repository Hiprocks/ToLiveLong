# Plan: API Response Cache (api-response-cache)

## 1. User Intent
- **Problem**: 매 요청마다 Google Sheets API를 직접 호출해 첫 진입 및 등록 후 반영이 느림
- **Goal**: 첫 진입 속도 + 식단 등록 후 갱신 속도 둘 다 개선
- **Constraint**: 추가 인프라 없이 Vercel + Next.js 내장 기능만 사용

## 2. Approach Selected
**Next.js `unstable_cache` + `revalidateTag`** (방안 B)
- 서버사이드 캐시: Vercel Data Cache에 Sheets 응답 저장
- 쓰기 후 즉시 태그 기반 무효화 → 실시간성 유지
- 비용 0원, 추가 서비스 없음

## 3. Scope (YAGNI 확정)

### Must Have
| 항목 | 태그 | TTL |
|------|------|-----|
| GET /api/sheets/records (날짜별) | `records` | 30s |
| GET /api/sheets/templates | `templates` | 300s |
| GET /api/sheets/user | `user` | 300s |
| 모든 쓰기 후 revalidateTag | - | - |

### Won't Do
- Upstash Redis / 외부 캐시
- ISR (정적 재생성)
- refreshAi=1 경로 캐시 (AI 재생성은 항상 fresh)

## 4. Architecture

```
Client Request
     ↓
Next.js API Route Handler
     ↓
unstable_cache wrapper (sheetsCache.ts)
     ├── HIT  → Vercel Data Cache (fast, ~10ms)
     └── MISS → Google Sheets API (~800-2000ms)

Write (POST/PUT/DELETE)
     ↓
Google Sheets API
     ↓
revalidateTag('records' | 'templates' | 'user')
     → 다음 GET에서 fresh 데이터 반환
```

## 5. File Changes
- `src/lib/sheetsCache.ts` (신규): unstable_cache 래퍼 함수 모음
- `src/app/api/sheets/records/route.ts`: GET → cached, POST → revalidateTag
- `src/app/api/sheets/records/[id]/route.ts`: PUT/DELETE → revalidateTag
- `src/app/api/sheets/templates/route.ts`: GET → cached, POST/PUT/DELETE → revalidateTag
- `src/app/api/sheets/user/route.ts`: GET → cached (non-refreshAi), PUT → revalidateTag

## 6. Success Criteria
- Google Sheets API 호출 횟수 대폭 감소 (캐시 히트 시 0회)
- 반복 방문 시 records/templates/user 응답 시간 < 100ms 목표
- 쓰기 후 다음 GET에서 항상 최신 데이터 반환

## 7. Risks
| 리스크 | 대응 |
|--------|------|
| `unstable_cache` 실험적 API | Next.js 16 기준 동작 검증됨, stable_cache로 이름 변경 예정 |
| Vercel 서버리스 인스턴스 재시작 시 캐시 소멸 | TTL 내 재시작 시 Sheets 재호출 → 허용 범위 |
| 클라이언트 캐시와 서버 캐시 이중 레이어 | 클라이언트 캐시는 그대로 유지 (빠른 탭 전환용) |
