# MenuCast Documentation Index

Welcome to the **MenuCast (miniKast)** technical and architecture documentation.

---

## 📚 Table of Contents

1. [**Product Requirements Document (PRD)**](file:///Users/battosai/Dev/menucast/docs/prd.md)
   - Product vision, user personas (Maya, Carlos, Elena), success KPIs, and prioritized Epics.
   - Non-functional requirements, release roadmap, and open design decisions.

2. [**Architecture & Data Contracts**](file:///Users/battosai/Dev/menucast/docs/architecture.md)
   - High-level system architecture diagram (Mermaid).
   - Detailed cross-component lifecycle workflows (Screen Pairing, Figma 1-Click Push).
   - Full Database Schema reference (`tvs`, `menus`, `api_tokens`, `screen_groups`, `playlists`).
   - REST API & WebSocket specifications, ADRs, and performance budgets.

3. [**Epics & User Stories Breakdown**](file:///Users/battosai/Dev/menucast/docs/epics.md)
   - Granular backlog of Epics (EPIC-1 to EPIC-5) and testable User Stories with acceptance criteria.

4. [**Sprint Plan & Tracking Board**](file:///Users/battosai/Dev/menucast/docs/sprint-plan.md)
   - Active sprint status (Sprint 1, 2, and 3), story point estimates, dependencies, and Definition of Done (DoD).

5. [**Project Overview**](file:///Users/battosai/Dev/menucast/docs/project-overview.md)
   - Executive summary and core value proposition.
   - Component responsibilities (`apps/web`, `apps/figma-plugin`, `apps/tv-android`, `supabase`).
   - Current POC status & capabilities.

6. [**Agent Project Context**](file:///Users/battosai/Dev/menucast/project-context.md)
   - Core development rules, constraints, and environment configuration.
   - Build commands and monorepo scripts for all packages.
   - Invariants for display engine performance and Figma sandbox communication.
