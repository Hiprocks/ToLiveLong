# bkit Project Configuration

## Project Level

This project uses bkit with automatic level detection.
Call `bkit_detect_level` at session start to determine the current level.

### Level-Specific Guidance

**Starter** (beginners, static websites):
- Use simple HTML/CSS/JS or Next.js App Router
- Skip API and database phases
- Pipeline phases: 1 -> 2 -> 3 -> 6 -> 9
- Use `$starter` skill for beginner guidance

**Dynamic** (fullstack with BaaS):
- Use bkend.ai for backend services
- Follow phases: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 9 (phase 8 optional)
- Use `$dynamic` skill for fullstack guidance

**Enterprise** (microservices, K8s):
- All 9 phases required
- Use `$enterprise` skill for MSA guidance

## PDCA Status

ALWAYS check `docs/.pdca-status.json` for current feature status.
Use `bkit_get_status` MCP tool for parsed status with recommendations.

## Key Skills

| Skill | Purpose |
|-------|---------|
| `$pdca` | Unified PDCA workflow (plan, design, do, analyze, iterate, report) |
| `$plan-plus` | Brainstorming-enhanced planning (6 phases, HARD GATE) |
| `$starter` / `$dynamic` / `$enterprise` | Level-specific guidance |
| `$development-pipeline` | 9-phase pipeline overview |
| `$code-review` | Code quality analysis with static analysis patterns |
| `$bkit-templates` | PDCA document template selection |

## Response Format (MANDATORY)

### Starter Level (bkit-learning style)
ALWAYS include at the end of each response:
- **Learning Points**: 3-5 key concepts the user should learn
- **Next Learning Step**: What to study or practice next
- Use simple terms, avoid jargon. Use "Did you know?" callouts.

### Dynamic Level (bkit-pdca-guide style)
ALWAYS include at the end of each response:
- **PDCA Status Badge**: `[Feature: X | Phase: Y | Progress: Z%]`
- **Checklist**: What's done and what remains
- **Next Step**: Specific action with command/tool suggestion

### Enterprise Level (bkit-enterprise style)
ALWAYS include at the end of each response:
- **Tradeoff Analysis**: Pros/Cons of the approach taken
- **Cost Impact**: Development time, infrastructure cost, maintenance burden
- **Deployment Considerations**: Environment-specific notes

## Deployment Workflow (MANDATORY)

### 기본 원칙
- 개발은 `develop` 브랜치에서만 한다. `main`은 직접 수정하지 않는다.
- 프로덕션 배포 = `main` 브랜치 push. Vercel이 자동 감지해서 배포한다.
- `npx vercel --prod`는 **절대 사용하지 않는다.**
- 사용자가 배포 요청 없이 작업을 완료하면 마지막에 다음 문구를 표시한다:
  > "테스트 후 '배포해'라고 하시면 프로덕션에 배포합니다."

### 워크플로우
1. 구현 완료 → `git commit` + `git push origin develop`
   - Vercel이 프리뷰 URL 자동 생성 (테스트용)
2. 사용자가 프리뷰에서 테스트
3. 사용자 배포 요청 ("마무리해", "배포해", "올려줘", "deploy") →
   ```bash
   git checkout main
   git merge develop --ff-only
   git push origin main
   git checkout develop
   ```
   - `git push origin main` 이 Vercel 프로덕션 자동 배포를 트리거한다.

---

## UI/Design System Rules (MANDATORY)

### 색상 하드코딩 금지
- 색상값(`#xxxxxx`, `rgb()`, `rgba()`, `hsl()`, `oklch()`)을 컴포넌트 인라인 스타일이나 `contentStyle`에 직접 사용하지 않는다.
- **반드시 Tailwind CSS 클래스 또는 CSS 변수를 사용한다:**
  - 배경: `bg-background`, `bg-card`, `bg-muted` 등
  - 텍스트: `text-foreground`, `text-muted-foreground`, `text-primary` 등
  - 테두리: `border-border`, `border-primary` 등
- **예외:** 통계/대시보드 차트(Recharts)의 막대·목표선·격자·축 눈금 등 데이터 시각화용 색상은 기존 rgba 팔레트 사용을 허용한다.

### Recharts 툴팁 규칙
- `contentStyle`에 하드코딩 색상 금지
- 반드시 `content` prop에 커스텀 컴포넌트(Tailwind 클래스 사용)를 넘긴다:
  ```tsx
  <Tooltip
    content={(props) => (
      <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
        <p className="text-xs text-muted-foreground">{props.label}</p>
        <p className="text-sm font-semibold text-foreground">...</p>
      </div>
    )}
  />
  ```

### 신규 컴포넌트 작성 시 체크리스트
- [ ] 색상 하드코딩 없음
- [ ] Tailwind 유틸리티 클래스 사용
- [ ] 외부 라이브러리(recharts 등) 스타일은 커스텀 컴포넌트로 래핑

---

## Team Workflow (Multi-Role Mode)

Default team roles:
- PM: Scope definition, acceptance criteria, priority decisions
- FE: UI/UX implementation, state flow, client-side validation
- BE: API/data integration, schema consistency, server-side validation
- QA: Test scenarios, regression checks, release readiness

PDCA execution rules:
1. Plan: PM leads with BE/FE input. Define feature goal, constraints, and acceptance criteria.
2. Design: BE/FE co-own technical design. QA adds test strategy and risk checklist.
3. Do: FE/BE implement in parallel when possible, with explicit API contract sync.
4. Check: QA verifies acceptance criteria, regression scope, and edge cases.
5. Report: PM records outcome, unresolved risks, and next iteration scope.

Handoff and quality gates:
1. Every phase must produce a short artifact in `docs/` before moving forward.
2. Use `bkit_pdca_next` to transition phases and keep status synchronized.
3. No release handoff unless QA marks critical issues as resolved or explicitly deferred.
