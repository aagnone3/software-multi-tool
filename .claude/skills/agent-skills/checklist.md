# Skill Quality Checklist

Use this checklist when reviewing or creating skills.

## Core Quality

- [ ] **Description is specific** - includes key terms for discovery
- [ ] **Description includes what AND when** - explains both purpose and triggers
- [ ] **Description uses third person** - not "I can" or "You can"
- [ ] **SKILL.md body under 500 lines** - use progressive disclosure if longer
- [ ] **Additional details in separate files** - not crammed into SKILL.md
- [ ] **No time-sensitive information** - or uses "old patterns" section
- [ ] **Consistent terminology** - same terms used throughout
- [ ] **Examples are concrete** - not abstract descriptions
- [ ] **File references one level deep** - not deeply nested
- [ ] **Progressive disclosure used appropriately** - overview in SKILL.md, details in referenced files

## Frontmatter

- [ ] **Name is valid** - lowercase, hyphens, max 64 chars
- [ ] **Name uses gerund form** - verb + -ing preferred
- [ ] **Description is non-empty** - max 1024 chars
- [ ] **No reserved words** - no "anthropic" or "claude" in name
- [ ] **Allowed-tools specified** - appropriate for skill needs

## Content Structure

- [ ] **Quick Reference table** - if skill has key components/locations
- [ ] **Clear section organization** - logical flow from overview to details
- [ ] **Related Skills section** - cross-references to relevant skills
- [ ] **When to Use section** - explicit activation triggers

## Workflows

- [ ] **Workflows have clear steps** - numbered, sequential
- [ ] **Complex workflows have checklists** - trackable progress
- [ ] **Feedback loops included** - for quality-critical tasks
- [ ] **Validation steps explicit** - when to validate, what to check

## Code and Scripts

- [ ] **Scripts solve problems** - don't punt to Claude
- [ ] **Error handling is explicit** - helpful error messages
- [ ] **No magic numbers** - all values justified
- [ ] **Required packages listed** - installation instructions
- [ ] **Scripts documented** - what they do, how to use
- [ ] **No Windows-style paths** - use forward slashes

## Testing and Validation

- [ ] **Tested with real scenarios** - not just theoretical
- [ ] **Works with target models** - Haiku, Sonnet, Opus as needed
- [ ] **Discovery works** - skill activates on relevant queries

## Quick Quality Score

Rate each area 1-5, where 5 = excellent:

| Area | Score | Notes |
| --- | --- | --- |
| Conciseness | /5 | |
| Description quality | /5 | |
| Progressive disclosure | /5 | |
| Workflow clarity | /5 | |
| Cross-references | /5 | |

### Scoring Guide

- 20-25: Excellent skill
- 15-19: Good, minor improvements needed
- 10-14: Needs work on several areas
- Below 10: Major revision needed

## Common Issues to Check

### Description Issues

| Issue | Fix |
| --- | --- |
| Uses "I can" or "You can" | Rewrite in third person |
| Too vague ("helps with X") | Add specific key terms |
| Missing triggers | Add "Use when..." clause |
| Over 1024 characters | Condense to essentials |

### Content Issues

| Issue | Fix |
| --- | --- |
| Over 500 lines | Split into referenced files |
| Deeply nested references | Flatten to one level |
| Explains what Claude knows | Remove unnecessary context |
| Inconsistent terminology | Standardize on one term |

### Structure Issues

| Issue | Fix |
| --- | --- |
| No Related Skills | Add cross-references |
| No When to Use | Add activation triggers |
| Missing Quick Reference | Add if many components |
| No examples | Add concrete examples |
