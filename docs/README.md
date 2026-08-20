# MenuCast Documentation Index

Welcome to the **MenuCast (miniKast)** technical and architecture documentation.

---

## 📚 Table of Contents

1. [**Product Requirements Document (PRD)**](file:///Users/battosai/Dev/menucast/docs/prd.md)
   - Product vision, user personas (Maya, Carlos, Elena), success KPIs, and prioritized Epics.
   - Non-functional requirements, release roadmap, and open design decisions.

2. [**Project Overview**](file:///Users/battosai/Dev/menucast/docs/project-overview.md)
   - Executive summary and core value proposition.
   - Component responsibilities (`apps/web`, `apps/figma-plugin`, `apps/tv-android`, `supabase`).
   - Current POC status & capabilities.

3. [**Architecture & Data Contracts**](file:///Users/battosai/Dev/menucast/docs/architecture.md)
   - High-level system architecture diagram (Mermaid).
   - Detailed cross-component lifecycle workflows (Screen Pairing, Figma 1-Click Push).
   - Full Database Schema reference (`tvs`, `menus`, `api_tokens`).
   - REST API endpoint specifications.

4. [**Agent Project Context**](file:///Users/battosai/Dev/menucast/project-context.md)
   - Core development rules, constraints, and environment configuration.
   - Build commands and monorepo scripts for all packages.
   - Invariants for display engine performance and Figma sandbox communication.
