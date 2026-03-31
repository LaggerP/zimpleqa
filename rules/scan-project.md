# Phase 1: Scan Project

Analyze the frontend codebase to build a complete map of what needs testing.

## Step 1: Read existing context

Check for and read these files if they exist:
- `CLAUDE.md` — project-level context
- `AGENTS.md` — agent instructions
- `.cursor/rules` or `.cursor/rules/*.md` — editor rules
- `.github/copilot-instructions.md` — copilot instructions

These files contain project-specific knowledge that informs test generation.

## Step 2: Detect project structure

Determine if this is a monorepo or standalone project:

| Signal | Structure |
|--------|-----------|
| `pnpm-workspace.yaml` exists | pnpm workspace |
| `lerna.json` exists | Lerna monorepo |
| `nx.json` exists | Nx monorepo |
| `turbo.json` exists | Turborepo |
| `apps/` or `packages/` directories | Likely monorepo |
| None of the above | Standalone project |

If monorepo detected, identify the frontend app and any backend services.

## Step 3: Detect framework and dependencies

Read `package.json` and identify the framework, router, UI library, and notable dependencies. These inform how routes are structured and how the UI is built.

## Step 4: Scan routes

Based on the detected framework, find all user-facing routes. Ignore backend/API routes.

## Step 5: Identify features and flows

Walk through every route and its associated source files. For each, identify:

1. **What can the user do on this page?** — Every interaction is a potential test
2. **What data does this page display or modify?** — Forms, lists, details, dashboards
3. **What can go wrong?** — Validation errors, empty states, permission denials
4. **How does this page connect to others?** — Navigation flows, multi-step processes

Group related routes into features. A feature is any cohesive user flow — it could be authentication, a checkout process, a document editor, a settings panel, a chat interface, a map interaction, or anything else the app offers.

**Priority:** Assign based on business impact, not feature type.
- **High**: Features where bugs cause data loss, security issues, or prevent core functionality
- **Medium**: Important features that have workarounds if broken
- **Low**: Nice-to-have features, informational pages

## Checkpoint: Validate with developer

**STOP.** Present the detected features to the developer.

Show a table with all features, their priority, routes, and a brief description. Ask:

1. Are these features correct? Any missing?
2. Are the priorities right? Should any be higher/lower?
3. Are there flows I should focus on or skip?
4. Is there anything the code doesn't show? (external services, business rules, edge cases)

**Wait for the developer's response.** Incorporate corrections before proceeding.

## Done

After the developer confirms, proceed to Phase 2-3: [write-tests.md](write-tests.md).
