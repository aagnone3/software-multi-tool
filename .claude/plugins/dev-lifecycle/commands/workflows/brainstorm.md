---
description: Explore requirements and possibilities before creating a formal ticket
---

# Brainstorm

Explore ideas, gather context, and flesh out requirements before committing to a formal Linear ticket.

## Purpose

Use this command in the early ideation phase when:

- You have a rough idea but need to explore possibilities
- You want to understand constraints before committing to scope
- You need to research existing patterns or solutions
- You want to discover edge cases before planning

**Output:** A refined understanding that can feed into `/workflows:plan`

## Workflow

### Phase 1: Capture the Idea

Ask the user to describe their idea or problem in rough terms:

```text
What problem are you trying to solve or what idea do you want to explore?

Feel free to be vague - we'll refine it together. Examples:
- "I want users to be able to export their data"
- "The dashboard feels slow"
- "We need better error handling"
```

### Phase 2: Research Context

Based on the idea, run relevant research agents:

**For new features:**

```text
Use Task tool with subagent_type: "dev-lifecycle:research:best-practices"
Prompt: "Research best practices for [feature concept] in [relevant technology]"

Use Task tool with subagent_type: "dev-lifecycle:research:framework-docs"
Prompt: "Find documentation for [relevant libraries/frameworks]"
```

**For improvements:**

```text
Use Task tool with subagent_type: "dev-lifecycle:research:git-history"
Prompt: "Analyze the evolution of [area of code] to understand current state"

Use Task tool with subagent_type: "dev-lifecycle:research:learnings"
Prompt: "Search for past learnings related to [topic]"
```

### Phase 3: Explore the Codebase

Use exploration to understand current state:

```text
Use Task tool with subagent_type: "Explore"
Prompt: "How does [related functionality] currently work in this codebase?"
```

Key questions to answer:

- What existing code relates to this idea?
- What patterns are already established?
- What constraints exist (technical, architectural)?
- What would need to change?

### Phase 4: Expand Possibilities

Present the user with options and variations:

```markdown
## Exploration Findings

### Current State
[Summary of how things work now]

### Possible Approaches

**Option A: [Minimal Change]**
- Scope: [description]
- Pros: Lower risk, faster delivery
- Cons: May not address root cause

**Option B: [Moderate Change]**
- Scope: [description]
- Pros: Balances effort and impact
- Cons: Requires [dependencies]

**Option C: [Comprehensive Change]**
- Scope: [description]
- Pros: Addresses root cause, future-proof
- Cons: Higher effort, more risk

### Questions to Consider
1. [Question about scope]
2. [Question about priority]
3. [Question about constraints]
```

### Phase 5: Discover Edge Cases

Proactively explore edge cases and risks:

```markdown
## Edge Cases to Consider

### User Scenarios
- What if the user [unusual scenario]?
- How should it behave when [edge case]?
- What about [accessibility/i18n consideration]?

### Technical Constraints
- [Database consideration]
- [Performance consideration]
- [Security consideration]

### Integration Points
- How does this interact with [related system]?
- What about [third-party integration]?
```

### Phase 6: Summarize for Planning

Create a summary that can feed into `/workflows:plan`:

```markdown
## Brainstorm Summary

### Problem Statement
[Refined problem description]

### Recommended Approach
[Selected option with reasoning]

### Key Requirements
1. [Requirement]
2. [Requirement]
3. [Requirement]

### Open Questions
- [Questions needing user input]

### Edge Cases to Address
- [Edge cases that should be in acceptance criteria]

### Related Areas
- [Existing code to modify]
- [Documentation to update]
- [Tests to write]

---

Ready to create a ticket? Use `/workflows:plan` with this context.
```

## Interactive Exploration

Throughout the process, ask clarifying questions:

**Scope questions:**

- "How important is [feature X] vs [feature Y]?"
- "Is this a must-have or nice-to-have?"
- "What's the minimum viable version?"

**Priority questions:**

- "How urgent is this? What's driving the timeline?"
- "What happens if we don't do this?"
- "Is there a dependency on something else?"

**Context questions:**

- "Who are the primary users of this feature?"
- "Are there any existing solutions we should consider?"
- "What's the expected volume/scale?"

## Example Interaction

**User:** `/workflows:brainstorm "I want to add analytics to track user behavior"`

**Assistant:** Let me help you explore this idea.

First, let me research best practices and understand the current codebase...

*Runs research agents*

Based on my research:

## Exploration Findings

### Current State

The codebase already has a PostHog integration at `apps/web/modules/analytics/`. The provider pattern is already established.

### Possible Approaches

**Option A: Expand PostHog Usage**

- Add more events to existing PostHog integration
- Pros: No new dependencies, consistent with current approach
- Cons: Limited to PostHog's capabilities

**Option B: Add Custom Event Layer**

- Create abstraction over PostHog for custom business events
- Pros: More flexibility, easier testing
- Cons: Additional complexity

**Option C: Add Backend Analytics**

- Server-side event tracking for reliability
- Pros: Catches events even with ad blockers
- Cons: Requires database changes, more infrastructure

### Questions to Consider

1. What specific user behaviors do you want to track?
2. Is frontend-only tracking sufficient, or do you need backend reliability?
3. Are there compliance considerations (GDPR, etc.)?

Which direction interests you most?

---
Context: $ARGUMENTS
