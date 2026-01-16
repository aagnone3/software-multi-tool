# Skill Examples

Real-world examples of good and bad skill patterns.

## Description Examples

### Good Descriptions

**PDF Processing skill**: `Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.`

**Excel Analysis skill**: `Analyze Excel spreadsheets, create pivot tables, generate charts. Use when analyzing Excel files, spreadsheets, tabular data, or .xlsx files.`

**Git Commit Helper skill**: `Generate descriptive commit messages by analyzing git diffs. Use when the user asks for help writing commit messages or reviewing staged changes.`

### Bad Descriptions

- `Helps with documents` - Too vague
- `Processes data` - Too generic
- `I can help you process Excel files` - First person breaks discovery
- `You can use this to process Excel files` - Second person is inconsistent

## Conciseness Examples

### Before (verbose - ~150 tokens)

Explains what PDFs are and how libraries work before showing the code:

> PDF (Portable Document Format) files are a common file format that contains text, images, and other content. To extract text from a PDF, you'll need to use a library. There are many libraries available for PDF processing, but we recommend pdfplumber...

### After (concise - ~50 tokens)

Shows just the code example:

```python
import pdfplumber
with pdfplumber.open("file.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```

## Progressive Disclosure Examples

### Good: High-level guide with references

Keep SKILL.md focused on quick start and navigation:

1. Show a quick example
2. Link to detailed files: `See [FORMS.md](FORMS.md) for form filling guide`

Claude loads additional files only when needed.

### Bad: Too deeply nested

Avoid chains like: SKILL.md → advanced.md → details.md

Claude may only partially read deeply nested files. Keep references one level deep.

## Degrees of Freedom Examples

### High Freedom (text-based instructions)

Use when multiple approaches are valid:

1. Analyze the code structure and organization
2. Check for potential bugs or edge cases
3. Suggest improvements for readability
4. Verify adherence to project conventions

### Medium Freedom (template with parameters)

Use when a preferred pattern exists but variation is OK:

```python
def generate_report(data, format="markdown", include_charts=True):
    # Process data
    # Generate output in specified format
    # Optionally include visualizations
```

### Low Freedom (specific scripts)

Use when operations are fragile:

```bash
python scripts/migrate.py --verify --backup
# Do not modify the command or add additional flags.
```

## Workflow Examples

### Good: Checklist pattern for complex workflows

```text
Task Progress:
- [ ] Step 1: Analyze the form (run analyze_form.py)
- [ ] Step 2: Create field mapping (edit fields.json)
- [ ] Step 3: Validate mapping (run validate_fields.py)
- [ ] Step 4: Fill the form (run fill_form.py)
- [ ] Step 5: Verify output (run verify_output.py)
```

Each step has clear instructions below.

### Good: Feedback loop pattern

1. Make your edits to `document.xml`
2. **Validate immediately**: `python scripts/validate.py`
3. If validation fails: Review error, fix issues, run validation again
4. **Only proceed when validation passes**

## Repository-Specific Examples

### Good Skill from This Repository

The `architecture` skill demonstrates good patterns:

```yaml
---
name: architecture
description: Use this skill when exploring the codebase structure, understanding integrations, or navigating the monorepo. Provides comprehensive architecture overview including API layer, frontend, database, and external integrations.
allowed-tools:
  - Read
  - Grep
  - Glob
---
```

**Why it's good**:

- Clear, specific description with key terms
- Third-person voice
- Includes both what (architecture overview) and when (exploring, navigating)
- Appropriate tool restrictions

### Good Command/Skill Reference Pattern

From the `linear` skill - a single pattern to remember:

```bash
pnpm --filter @repo/scripts linear <resource> <action> [options]
```

**Why it's good**:

- Single pattern to remember
- Concrete example
- Links specific to general
