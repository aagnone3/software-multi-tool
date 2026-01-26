# PostHog Tool Usage Dashboard Setup

This guide explains how to set up a PostHog dashboard to track tool usage by users.

## Events Being Tracked

The following events are now tracked across all tools:

| Event | Description | Key Properties |
| ----- | ----------- | -------------- |
| `tool_viewed` | User visits a tool page | `tool_name`, `page_path`, `session_id`, `is_authenticated` |
| `tool_upload_started` | User uploads a file | `tool_name`, `file_type`, `file_size`, `session_id` |
| `tool_processing_started` | Processing job begins | `tool_name`, `job_id`, `from_cache`, `session_id` |
| `tool_processing_completed` | Processing succeeds | `tool_name`, `job_id`, `processing_duration_ms`, `from_cache` |
| `tool_processing_failed` | Processing fails | `tool_name`, `job_id`, `error_type`, `processing_duration_ms` |
| `tool_result_downloaded` | User downloads results | `tool_name`, `job_id`, `download_format` |

## Creating the Dashboard

### Step 1: Create New Dashboard

1. Go to PostHog > Dashboards
2. Click "New Dashboard"
3. Name it "Tool Usage Analytics"
4. Add the following insights:

---

### Insight 1: Tool Usage by Tool (Bar Chart)

**Purpose:** See which tools are used most frequently

**Query:**

- Event: `tool_processing_completed`
- Breakdown by: `tool_name`
- Date range: Last 30 days
- Chart type: Bar chart

**HogQL Alternative:**

```sql
SELECT
    properties.$tool_name AS tool_name,
    count() AS usage_count
FROM events
WHERE event = 'tool_processing_completed'
    AND timestamp >= now() - INTERVAL 30 DAY
GROUP BY tool_name
ORDER BY usage_count DESC
```

---

### Insight 2: Daily Tool Usage Trend (Line Chart)

**Purpose:** Track usage trends over time

**Query:**

- Event: `tool_processing_completed`
- Breakdown by: `tool_name`
- Date range: Last 30 days
- Chart type: Line chart

---

### Insight 3: Unique Users by Tool (Table)

**Purpose:** See how many distinct users (sessions) use each tool

**HogQL:**

```sql
SELECT
    properties.$tool_name AS tool_name,
    countDistinct(properties.$session_id) AS unique_sessions,
    count() AS total_uses,
    round(count() / countDistinct(properties.$session_id), 2) AS uses_per_session
FROM events
WHERE event = 'tool_processing_completed'
    AND timestamp >= now() - INTERVAL 30 DAY
GROUP BY tool_name
ORDER BY unique_sessions DESC
```

---

### Insight 4: Processing Success Rate (Funnel)

**Purpose:** Track conversion from tool view to successful processing

**Funnel Steps:**

1. `tool_viewed`
2. `tool_processing_started`
3. `tool_processing_completed`

**Breakdown by:** `tool_name`
**Date range:** Last 30 days

---

### Insight 5: Average Processing Time by Tool

**Purpose:** Monitor processing performance

**HogQL:**

```sql
SELECT
    properties.$tool_name AS tool_name,
    round(avg(toFloat64OrNull(properties.$processing_duration_ms)) / 1000, 2) AS avg_seconds,
    round(median(toFloat64OrNull(properties.$processing_duration_ms)) / 1000, 2) AS median_seconds,
    round(quantile(0.95)(toFloat64OrNull(properties.$processing_duration_ms)) / 1000, 2) AS p95_seconds,
    count() AS total_jobs
FROM events
WHERE event = 'tool_processing_completed'
    AND timestamp >= now() - INTERVAL 30 DAY
    AND properties.$processing_duration_ms IS NOT NULL
GROUP BY tool_name
ORDER BY avg_seconds DESC
```

---

### Insight 6: Error Rate by Tool

**Purpose:** Monitor failure rates and identify problematic tools

**HogQL:**

```sql
SELECT
    properties.$tool_name AS tool_name,
    countIf(event = 'tool_processing_failed') AS failures,
    countIf(event = 'tool_processing_completed') AS successes,
    countIf(event = 'tool_processing_started') AS started,
    round(countIf(event = 'tool_processing_failed') * 100.0 /
          countIf(event = 'tool_processing_started'), 2) AS failure_rate_pct
FROM events
WHERE event IN ('tool_processing_started', 'tool_processing_completed', 'tool_processing_failed')
    AND timestamp >= now() - INTERVAL 30 DAY
GROUP BY tool_name
ORDER BY failure_rate_pct DESC
```

---

### Insight 7: Error Types Breakdown

**Purpose:** Understand what types of errors occur

**HogQL:**

```sql
SELECT
    properties.$tool_name AS tool_name,
    properties.$error_type AS error_type,
    count() AS error_count
FROM events
WHERE event = 'tool_processing_failed'
    AND timestamp >= now() - INTERVAL 30 DAY
GROUP BY tool_name, error_type
ORDER BY error_count DESC
LIMIT 20
```

---

### Insight 8: Download Rate by Tool

**Purpose:** Track how often users download/export results

**HogQL:**

```sql
SELECT
    properties.$tool_name AS tool_name,
    countIf(event = 'tool_result_downloaded') AS downloads,
    countIf(event = 'tool_processing_completed') AS completions,
    round(countIf(event = 'tool_result_downloaded') * 100.0 /
          countIf(event = 'tool_processing_completed'), 2) AS download_rate_pct
FROM events
WHERE event IN ('tool_processing_completed', 'tool_result_downloaded')
    AND timestamp >= now() - INTERVAL 30 DAY
GROUP BY tool_name
ORDER BY download_rate_pct DESC
```

---

### Insight 9: Authenticated vs Anonymous Usage

**Purpose:** Track user authentication status

**HogQL:**

```sql
SELECT
    properties.$tool_name AS tool_name,
    CASE
        WHEN properties.$is_authenticated = 'true' THEN 'Authenticated'
        ELSE 'Anonymous'
    END AS user_type,
    count() AS usage_count
FROM events
WHERE event = 'tool_processing_completed'
    AND timestamp >= now() - INTERVAL 30 DAY
GROUP BY tool_name, user_type
ORDER BY tool_name, user_type
```

---

### Insight 10: File Types Processed

**Purpose:** Understand what types of files users upload

**HogQL:**

```sql
SELECT
    properties.$tool_name AS tool_name,
    properties.$file_type AS file_type,
    count() AS upload_count,
    round(avg(toFloat64OrNull(properties.$file_size)) / 1024, 2) AS avg_size_kb
FROM events
WHERE event = 'tool_upload_started'
    AND timestamp >= now() - INTERVAL 30 DAY
    AND properties.$file_type IS NOT NULL
GROUP BY tool_name, file_type
ORDER BY upload_count DESC
LIMIT 20
```

---

### Insight 11: Cache Hit Rate

**Purpose:** Monitor caching effectiveness

**HogQL:**

```sql
SELECT
    properties.$tool_name AS tool_name,
    countIf(properties.$from_cache = 'true') AS cache_hits,
    countIf(properties.$from_cache != 'true' OR properties.$from_cache IS NULL) AS cache_misses,
    round(countIf(properties.$from_cache = 'true') * 100.0 / count(), 2) AS cache_hit_rate_pct
FROM events
WHERE event = 'tool_processing_completed'
    AND timestamp >= now() - INTERVAL 30 DAY
GROUP BY tool_name
ORDER BY cache_hit_rate_pct DESC
```

---

### Insight 12: Tool Usage Heatmap (Weekly)

**Purpose:** See when tools are most used

**Query:**

- Event: `tool_processing_completed`
- Chart type: Heatmap (by day of week and hour)
- Date range: Last 30 days

---

## Dashboard Layout Recommendation

Organize the dashboard into sections:

### Row 1: Overview

- Tool Usage by Tool (bar chart, large)
- Daily Tool Usage Trend (line chart, large)

### Row 2: Users & Engagement

- Unique Users by Tool (table, medium)
- Authenticated vs Anonymous Usage (bar chart, medium)
- Download Rate by Tool (bar chart, medium)

### Row 3: Performance

- Average Processing Time by Tool (table, medium)
- Processing Success Rate Funnel (funnel, medium)
- Cache Hit Rate (bar chart, medium)

### Row 4: Errors & Files

- Error Rate by Tool (bar chart, medium)
- Error Types Breakdown (table, medium)
- File Types Processed (table, medium)

---

## Creating Alerts

Set up alerts for important metrics:

### Alert 1: High Error Rate

- Trigger when: `tool_processing_failed` count > 10 in 1 hour
- Notification: Slack/email

### Alert 2: Processing Time Spike

- Trigger when: Average `processing_duration_ms` > 60000 (1 minute)
- Notification: Slack/email

---

## Quick Reference: Property Names

When creating queries, use these exact property names:

| Property | Type | Description |
| -------- | ---- | ----------- |
| `$tool_name` | string | Tool identifier (e.g., "news-analyzer") |
| `$session_id` | string | Anonymous session ID |
| `$is_authenticated` | boolean | Whether user is logged in |
| `$job_id` | string | Processing job ID |
| `$processing_duration_ms` | number | Time taken in milliseconds |
| `$from_cache` | boolean | Whether result was cached |
| `$error_type` | string | Type of error that occurred |
| `$file_type` | string | MIME type of uploaded file |
| `$file_size` | number | File size in bytes |
| `$download_format` | string | Export format (json, txt, etc.) |
| `$page_path` | string | URL path of the tool page |
| `$referrer` | string | Referring page |

---

## Notes

- All queries use `timestamp >= now() - INTERVAL 30 DAY` by default - adjust as needed
- The `$` prefix is PostHog's convention for custom properties
- For real-time monitoring, consider creating a separate "Tool Usage Live" dashboard with shorter time ranges
- Session IDs link anonymous usage together - use this to track user journeys before signup
