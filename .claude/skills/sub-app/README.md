# Sub-App Development Skill

> **For Claude Code**: Comprehensive guidance on creating new sub-applications (tools/utilities) within the multi-app architecture.

## Overview

This skill provides step-by-step instructions for building complete sub-applications from scratch, including:

- Tool registry configuration
- Database schema design patterns
- API endpoint implementation
- Async job queue integration
- Frontend UI components
- Rate limiting setup

## When to Use This Skill

Use this skill when:

- ✅ Creating a new tool/sub-app from scratch
- ✅ Implementing tool-specific database models
- ✅ Setting up API endpoints for a tool
- ✅ Understanding the async job queue pattern
- ✅ Building tool-specific UI components

**Don't use this skill for**:

- ❌ Just registering an existing tool in the config (use the `tools` skill instead)
- ❌ General architecture questions (use the `architecture` skill instead)

## Quick Start

1. **Register the tool** in `config/index.ts`
2. **Define database schema** (if needed) in Prisma schema
3. **Create API module** in `packages/api/modules/`
4. **Implement job processor** (for async tools)
5. **Build frontend UI** in `apps/web/app/(saas)/app/tools/`
6. **Test and deploy**

## Key Design Patterns

### Generic Job Model

All tools share a single `ToolJob` model:

```prisma
model ToolJob {
  id       String   @id
  toolSlug String   // Identifies which tool owns this
  input    Json     // Tool-specific input
  output   Json?    // Tool-specific output
  status   ToolJobStatus
  // ... other fields
}
```

**Benefits**:

- No migration needed per tool
- Unified job queue
- Simple tool-specific schemas via JSON
- Easy to add new tools

### Public vs Private Tools

Tools can be:

- **Public**: Accessible without authentication (growth-friendly)
  - Anonymous users get limited usage (tracked by sessionId)
  - Authenticated users get enhanced features

- **Private**: Require authentication
  - Full feature access from the start
  - Better for premium or sensitive tools

### Async Processing Pattern

For long-running operations:

1. Client submits job via API
2. API creates job record and returns job ID
3. Background worker picks up job
4. Client polls for job status/results
5. Results displayed when complete

## File Structure

```text
Sub-App Components:
├── config/index.ts                          # Tool registry entry
├── packages/database/
│   ├── prisma/schema.prisma                 # Database models (optional)
│   └── prisma/queries/tool-jobs.ts          # Generic job queries (shared)
├── packages/api/modules/<tool-name>/
│   ├── router.ts                            # API router
│   ├── types.ts                             # Input/output schemas
│   ├── procedures/                          # API procedures
│   │   ├── create-job.ts
│   │   ├── get-job.ts
│   │   └── list-jobs.ts
│   └── lib/
│       └── processor.ts                     # Job processing logic
└── apps/web/app/(saas)/app/tools/<tool-slug>/
    └── page.tsx                             # Frontend UI
```

## Examples

See `examples.md` for complete walkthroughs:

1. **Simple Synchronous Tool** - Fast processing, no job queue
2. **Async Tool with Job Queue** - Background processing with polling
3. **Hybrid Tool** - Quick preview + detailed processing

## Resources

- **Full Documentation**: `SKILL.md`
- **Examples**: `examples.md`
- **Existing Implementations**:
  - Background Remover: `bg-remover` tool
  - Speaker Diarization: `diarization` tool
  - News Analyzer: `news-analyzer` tool

## Related Skills

- **tools**: Simple tool registration (no backend implementation)
- **architecture**: Overall codebase structure
- **prisma-migrate**: Database migrations
- **better-auth**: User authentication

## Contributing

When creating a new tool:

1. Follow the patterns in this skill
2. Write tests for API procedures and processors
3. Document tool-specific patterns in code comments
4. Update this skill if you discover new patterns
