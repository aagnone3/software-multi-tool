# Skill Patterns

Common patterns for effective skill authoring.

## Template Pattern

Provide templates for output format. Match strictness to requirements.

### Strict Template (for API responses, data formats)

Use ALWAYS and exact structure when consistency is critical:

```markdown
# [Analysis Title]

## Executive summary

[One-paragraph overview of key findings]

## Key findings

- Finding 1 with supporting data
- Finding 2 with supporting data
- Finding 3 with supporting data

## Recommendations

1. Specific actionable recommendation
2. Specific actionable recommendation
```

### Flexible Template (when adaptation is useful)

Provide a sensible default but allow judgment:

> Here is a sensible default format, but use your best judgment. Adjust sections as needed for the specific analysis type.

## Examples Pattern

For skills where output quality depends on examples, provide input/output pairs:

**Example 1:**

- Input: Added user authentication with JWT tokens
- Output: `feat(auth): implement JWT-based authentication`

**Example 2:**

- Input: Fixed bug where dates displayed incorrectly in reports
- Output: `fix(reports): correct date formatting in timezone conversion`

**Example 3:**

- Input: Updated dependencies and refactored error handling
- Output: `chore: update dependencies and refactor error handling`

Follow this style: type(scope): brief description, then detailed explanation.

## Conditional Workflow Pattern

Guide Claude through decision points:

1. Determine the modification type:
   - **Creating new content?** → Follow "Creation workflow" below
   - **Editing existing content?** → Follow "Editing workflow" below

2. Creation workflow: Use library, build from scratch, export to format

3. Editing workflow: Unpack, modify directly, validate, repack

## Domain-Specific Organization

For skills with multiple domains, organize by domain:

```text
bigquery-skill/
├── SKILL.md (overview and navigation)
└── reference/
    ├── finance.md (revenue, billing metrics)
    ├── sales.md (opportunities, pipeline)
    ├── product.md (API usage, features)
    └── marketing.md (campaigns, attribution)
```

In SKILL.md, provide navigation:

- **Finance**: Revenue, ARR, billing → See `reference/finance.md`
- **Sales**: Opportunities, pipeline → See `reference/sales.md`

## Conditional Details Pattern

Show basic content, link to advanced:

**For simple edits**: Modify the XML directly.

**For tracked changes**: See `REDLINING.md`

**For OOXML details**: See `OOXML.md`

## Quick Reference Table Pattern

For skills with many components/locations:

| Component | Entry Point |
| --- | --- |
| Backend API | `packages/api/index.ts` |
| API Router | `packages/api/orpc/router.ts` |
| Auth | `packages/auth/auth.ts` |
| Database | `packages/database/prisma/schema.prisma` |
| Web App | `apps/web/app/` |

## Default with Escape Hatch Pattern

Don't present multiple approaches unless necessary.

**Bad (too many choices)**: "You can use pypdf, or pdfplumber, or PyMuPDF, or pdf2image, or..."

**Good (default with escape hatch)**: "Use pdfplumber for text extraction. For scanned PDFs requiring OCR, use pdf2image with pytesseract instead."

## Long Reference File Pattern

For files longer than 100 lines, include a table of contents:

```markdown
# API Reference

## Contents

- Authentication and setup
- Core methods (create, read, update, delete)
- Advanced features (batch operations, webhooks)
- Error handling patterns
- Code examples
```

Claude can then read complete file or jump to specific sections.

## Utility Scripts Pattern

Pre-made scripts offer advantages over generated code:

**analyze_form.py**: Extract all form fields from PDF

```bash
python scripts/analyze_form.py input.pdf > fields.json
```

Output format:

```json
{
  "field_name": {"type": "text", "x": 100, "y": 200},
  "signature": {"type": "sig", "x": 150, "y": 500}
}
```

**validate_boxes.py**: Check for overlapping bounding boxes

```bash
python scripts/validate_boxes.py fields.json
# Returns: "OK" or lists conflicts
```

**Benefits**:

- More reliable than generated code
- Save tokens (no code in context)
- Ensure consistency across uses

## MCP Tool Reference Pattern

Always use fully qualified tool names:

- `BigQuery:bigquery_schema` - Retrieve table schemas
- `GitHub:create_issue` - Create issues

Format: `ServerName:tool_name`
