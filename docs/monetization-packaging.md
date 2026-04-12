# Monetization Packaging Decision Memo

**Date:** 2026-04-11
**Status:** Draft
**Owner:** Gilfoyle
**Context:** Software Multitool currently offers free source code with free‑credit CTAs across the marketing site. To move beyond one‑time curiosity and build a sustainable revenue stream, we need a clear packaging story that defines what we sell, who each package is for, and what proof points are required to justify pricing.

## Goal

Define a tiered packaging model that:

- Preserves the current open‑source‑first evaluation experience
- Creates a clear upgrade path for teams that want more than the baseline starter
- Generates revenue without compromising product quality or maintainer trust

## Proposed Tiers

### Tier 1: Free Starter (current baseline)

**Audience:** Individual developers, founders, early evaluators
**What’s included:**

- Full source code under a permissive license (MIT)
- Local evaluation path (README quick‑start)
- Marketing site, dashboard shell, auth primitives, shared packages
- Free‑credit CTAs for hosted AI/email/analytics services
- Community support (GitHub Discussions, Discord)

**Revenue model:** None (acquisition funnel)

**Proof points needed:**

- [x] Reliable local evaluation path (README split)
- [x] Clear “what works out‑of‑the‑box” documentation
- [ ] Success‑state testimonials from early adopters

### Tier 2: Pro License (paid updates + support)

**Audience:** Small product teams, startups, agencies that want ongoing maintenance and verified compatibility
**What’s included:**

- Everything in Free Starter
- Priority access to version‑locked updates (e.g., Next.js 15 → 16, React 19 → 20, auth/provider integrations)
- Private GitHub repository for the licensed copy
- Security‑patch backports for the licensed version
- Direct support via email/private channel
- Optional: early‑access to new premium modules

**Revenue model:** One‑time license fee (per project) or annual subscription

**Proof points needed:**

- [ ] Defined update‑compatibility guarantee (what “verified” means)
- [ ] Support SLA wording
- [ ] License‑key delivery/integration flow
- [ ] Pricing page copy that differentiates from free tier

### Tier 3: Enterprise (premium modules + setup)

**Audience:** Larger teams, enterprises, non‑technical founders who want implementation assistance
**What’s included:**

- Everything in Pro License
- Premium modules (e.g., advanced multi‑tenant RBAC, audit logging, custom provider integrations, white‑label theming)
- Dedicated setup/onboarding call(s)
- Customization guidance (up to X hours)
- Priority feature‑request consideration

**Revenue model:** Custom quote (one‑time + optional retainer)

**Proof points needed:**

- [ ] At least one premium module built and documented
- [ ] Clear scope boundaries for setup assistance
- [ ] Case‑study or demo of a custom‑module integration
- [ ] Sales/contact funnel (Calendly, dedicated email)

## Packaging Principles

1. **Open core remains open** – The Free Starter stays fully source‑available and locally runnable. Paid tiers add maintenance, support, and convenience, not core‑functionality lock‑in.
2. **Updates as a product** – Many teams value verified compatibility with upstream framework changes; we can sell that assurance.
3. **Modules over forks** – Premium features should be opt‑in packages that work with the open‑core base, not a separate fork.
4. **Clear upgrade triggers** – Each tier should answer a specific need:
   - Free: “I want to evaluate the starter.”
   - Pro: “I’m building a real product and need updates/support.”
   - Enterprise: “I need extra features or hands‑on help.”

## Immediate Next Actions

1. **Validate Pro‑license demand** – Reach out to existing GitHub stars/Discord members with a short survey about update‑assurance needs.
2. **Build one premium‑module prototype** – Pick a high‑value feature (e.g., advanced RBAC) and develop it as a separately licensed package.
3. **Draft pricing page copy** – Create a `/pricing` section that presents the three tiers side‑by‑side, with clear CTAs for each.
4. **Implement license‑key delivery** – Simple mechanism that grants access to private repos or premium‑module downloads.

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Free tier becomes “good enough” for most users | Emphasize time‑saving and risk‑reduction benefits of verified updates; target teams with production‑critical timelines. |
| Support burden outweighs revenue | Start with email‑only support, define clear boundaries, automate common answers. |
| Premium‑module complexity fragments the codebase | Keep modules as optional `packages/` that depend on the core; maintain separate CI/test suites. |
| Cannibalizing open‑source goodwill | Be transparent about what stays open; position paid tiers as “sustainability” rather than “locking down.” |

## Decision

This memo proposes a three‑tier packaging model (Free Starter, Pro License, Enterprise). If aligned, we will:

1. Socialize the model with early adopters for feedback.
2. Begin building the first premium module (advanced RBAC).
3. Update the pricing page to reflect the tiered offering.

**Approval needed from:** Anthony (product/founder)

---

*This document is a living draft. Update as we learn more about customer needs and technical constraints.*
