---
name: agent-skills
description: Provides skill authoring best practices including token-efficient writing, progressive disclosure patterns, description optimization for discovery, and quality evaluation. Use when creating skills, reviewing existing skills, or improving skill discoverability.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Edit
  - Write
---

# Agent Skills Skill

Best practices for authoring effective Claude skills that are discoverable and useful.

## Core Principles

### Conciseness Is Key

The context window is a shared resource. Every token in your skill competes with conversation history and other context.

**Default assumption**: Claude is already very smart. Only add context Claude doesn't already have.

Ask yourself:

- "Does Claude really need this explanation?"
- "Can I assume Claude knows this?"
- "Does this paragraph justify its token cost?"

**Good** (~50 tokens): Show just the code example without explanation.

**Bad** (~150 tokens): Explain what PDFs are and how libraries work before showing code.

### Degrees of Freedom

Match specificity to the task's fragility and variability.

| Freedom Level | Use When | Example |
| --- | --- | --- |
| **High** | Multiple approaches valid, context-dependent | Code review process |
| **Medium** | Preferred pattern exists, some variation OK | Report generation template |
| **Low** | Operations are fragile, consistency critical | Database migration scripts |

**Analogy**: Think of Claude as exploring a path:

- **Narrow bridge with cliffs**: One safe way forward → specific guardrails (low freedom)
- **Open field**: Many paths lead to success → general direction (high freedom)

### Progressive Disclosure

SKILL.md is a table of contents pointing to details. Keep it under 500 lines.

**File Organization Pattern**:

```text
skill-name/
├── SKILL.md           # Main instructions (loaded when triggered)
├── examples.md        # Usage examples (loaded as needed)
├── checklist.md       # Quality checklist (loaded as needed)
└── patterns.md        # Common patterns (loaded as needed)
```

**Reference Pattern** (one level deep only): Use links like `See [FORMS.md](FORMS.md) for complete guide`.

## Skill Structure Requirements

### YAML Frontmatter

Required fields:

- `name`: Max 64 chars, lowercase letters/numbers/hyphens only
- `description`: Max 1024 chars, non-empty

```yaml
---
name: pdf-processing
description: Extracts text and tables from PDF files, fills forms, and merges documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.
---
```

### Naming Conventions

Use **gerund form** (verb + -ing) for skill names:

| Good | Avoid |
| --- | --- |
| `processing-pdfs` | `helper` |
| `analyzing-spreadsheets` | `utils` |
| `managing-databases` | `tools` |
| `testing-code` | `documents` |

### Writing Descriptions

**Critical for discovery**: Claude uses descriptions to select from 100+ skills.

Rules:

1. **Write in third person** (not "I can help you" or "You can use")
2. **Be specific** - include key terms and triggers
3. **Include both what AND when**

**Good**: `Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.`

**Bad**: `Helps with documents`

## Workflow Patterns

### Multi-Step Workflows

Break complex operations into clear steps. For complex tasks, provide a checklist that Claude can copy and track:

```text
Task Progress:
- [ ] Step 1: Analyze the form
- [ ] Step 2: Create field mapping
- [ ] Step 3: Validate mapping
- [ ] Step 4: Fill the form
- [ ] Step 5: Verify output
```

### Feedback Loops

Pattern: Run validator → fix errors → repeat

1. Make your edits to the file
2. **Validate immediately**: Run the validation script
3. If validation fails: Review error, fix issues, run validation again
4. **Only proceed when validation passes**

## Content Guidelines

### Avoid Time-Sensitive Information

**Bad**: "If you're doing this before August 2025, use the old API."

**Good**: Use an "old patterns" section with collapsible details for deprecated approaches.

### Use Consistent Terminology

Choose one term and use it throughout:

| Good (consistent) | Bad (inconsistent) |
| --- | --- |
| Always "API endpoint" | Mix "endpoint", "URL", "route", "path" |
| Always "field" | Mix "field", "box", "element", "control" |

## Common Patterns

See [patterns.md](patterns.md) for detailed patterns including:

- Template pattern
- Examples pattern
- Conditional workflow pattern

## Quality Checklist

See [checklist.md](checklist.md) for the complete quality checklist covering:

- Core quality checks
- Code and scripts checks
- Testing requirements

## Examples

See [examples.md](examples.md) for:

- Good and bad skill examples
- Before/after improvements
- Real-world patterns from this repository

## Anti-Patterns to Avoid

1. **Deeply nested references** - Keep references one level deep from SKILL.md
2. **Windows-style paths** - Use forward slashes: `scripts/helper.py`
3. **Too many options** - Provide a default with an escape hatch
4. **Vague descriptions** - Be specific about what AND when
5. **Time-sensitive content** - Use "old patterns" sections instead

## When to Use This Skill

Invoke this skill when:

- Creating a new skill
- Reviewing existing skills for improvements
- Understanding skill best practices
- Optimizing skill descriptions for discovery
- Structuring skill content for progressive disclosure

## Related Skills

- **architecture**: Understand codebase structure when documenting
- **tools**: Reference when creating tool-specific skills
