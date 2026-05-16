# Feature Flag Common Patterns

Complete server-side and client-side usage patterns. Import functions from `@repo/api/lib/feature-flags`.

## Progressive Rollout

```typescript
// In PostHog: Set flag to 10% rollout
const enabled = await isFeatureEnabled("new-algorithm", userId);
if (enabled) {
  return newAlgorithm(data);
}
return legacyAlgorithm(data);
```

## A/B Testing with Variants

```typescript
// In PostHog: Create multivariate flag with "control", "variant-a", "variant-b"
const variant = await getFeatureFlag("pricing-page", userId, {
  defaultValue: "control",
});

switch (variant) {
  case "variant-a":
    return <PricingPageA />;
  case "variant-b":
    return <PricingPageB />;
  default:
    return <PricingPageControl />;
}
```

## Feature Gates by Plan

```typescript
const canUseAdvancedFeature = await isFeatureEnabled("advanced-analytics", userId, {
  properties: {
    plan: user.subscription?.plan ?? "free",
  },
});
```

## Kill Switch

```typescript
// In PostHog: Create boolean flag, default OFF
// Turn ON to disable problematic feature
const isDisabled = await isFeatureEnabled("disable-payments", userId);
if (isDisabled) {
  throw new Error("Payments temporarily disabled for maintenance");
}
```
