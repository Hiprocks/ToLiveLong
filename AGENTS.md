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
