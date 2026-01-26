/**
 * Prisma Zod Generator - Single File (inlined)
 * Auto-generated. Do not edit.
 */

import * as z from 'zod';
// File: TransactionIsolationLevel.schema.ts

export const TransactionIsolationLevelSchema = z.enum(['ReadUncommitted', 'ReadCommitted', 'RepeatableRead', 'Serializable'])

export type TransactionIsolationLevelEnum = z.infer<typeof TransactionIsolationLevelSchema>;

// File: UserScalarFieldEnum.schema.ts

export const UserScalarFieldEnumSchema = z.enum(['id', 'name', 'email', 'emailVerified', 'image', 'createdAt', 'updatedAt', 'username', 'role', 'banned', 'banReason', 'banExpires', 'onboardingComplete', 'paymentsCustomerId', 'locale', 'twoFactorEnabled'])

export type UserScalarFieldEnumEnum = z.infer<typeof UserScalarFieldEnumSchema>;

// File: SessionScalarFieldEnum.schema.ts

export const SessionScalarFieldEnumSchema = z.enum(['id', 'expiresAt', 'ipAddress', 'userAgent', 'userId', 'impersonatedBy', 'activeOrganizationId', 'token', 'createdAt', 'updatedAt'])

export type SessionScalarFieldEnumEnum = z.infer<typeof SessionScalarFieldEnumSchema>;

// File: AccountScalarFieldEnum.schema.ts

export const AccountScalarFieldEnumSchema = z.enum(['id', 'accountId', 'providerId', 'userId', 'accessToken', 'refreshToken', 'idToken', 'expiresAt', 'password', 'accessTokenExpiresAt', 'refreshTokenExpiresAt', 'scope', 'createdAt', 'updatedAt'])

export type AccountScalarFieldEnumEnum = z.infer<typeof AccountScalarFieldEnumSchema>;

// File: VerificationScalarFieldEnum.schema.ts

export const VerificationScalarFieldEnumSchema = z.enum(['id', 'identifier', 'value', 'expiresAt', 'createdAt', 'updatedAt'])

export type VerificationScalarFieldEnumEnum = z.infer<typeof VerificationScalarFieldEnumSchema>;

// File: PasskeyScalarFieldEnum.schema.ts

export const PasskeyScalarFieldEnumSchema = z.enum(['id', 'name', 'publicKey', 'userId', 'credentialID', 'counter', 'deviceType', 'backedUp', 'transports', 'createdAt', 'aaguid'])

export type PasskeyScalarFieldEnumEnum = z.infer<typeof PasskeyScalarFieldEnumSchema>;

// File: TwoFactorScalarFieldEnum.schema.ts

export const TwoFactorScalarFieldEnumSchema = z.enum(['id', 'secret', 'backupCodes', 'userId'])

export type TwoFactorScalarFieldEnumEnum = z.infer<typeof TwoFactorScalarFieldEnumSchema>;

// File: OrganizationScalarFieldEnum.schema.ts

export const OrganizationScalarFieldEnumSchema = z.enum(['id', 'name', 'slug', 'logo', 'createdAt', 'metadata', 'paymentsCustomerId'])

export type OrganizationScalarFieldEnumEnum = z.infer<typeof OrganizationScalarFieldEnumSchema>;

// File: MemberScalarFieldEnum.schema.ts

export const MemberScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'userId', 'role', 'createdAt'])

export type MemberScalarFieldEnumEnum = z.infer<typeof MemberScalarFieldEnumSchema>;

// File: InvitationScalarFieldEnum.schema.ts

export const InvitationScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'email', 'role', 'status', 'expiresAt', 'inviterId'])

export type InvitationScalarFieldEnumEnum = z.infer<typeof InvitationScalarFieldEnumSchema>;

// File: PurchaseScalarFieldEnum.schema.ts

export const PurchaseScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'userId', 'type', 'customerId', 'subscriptionId', 'productId', 'status', 'createdAt', 'updatedAt'])

export type PurchaseScalarFieldEnumEnum = z.infer<typeof PurchaseScalarFieldEnumSchema>;

// File: AiChatScalarFieldEnum.schema.ts

export const AiChatScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'userId', 'title', 'messages', 'createdAt', 'updatedAt'])

export type AiChatScalarFieldEnumEnum = z.infer<typeof AiChatScalarFieldEnumSchema>;

// File: AgentSessionScalarFieldEnum.schema.ts

export const AgentSessionScalarFieldEnumSchema = z.enum(['id', 'sessionType', 'userId', 'organizationId', 'toolSlug', 'toolId', 'jobId', 'isComplete', 'messages', 'context', 'extractedData', 'totalInputTokens', 'totalOutputTokens', 'createdAt', 'updatedAt'])

export type AgentSessionScalarFieldEnumEnum = z.infer<typeof AgentSessionScalarFieldEnumSchema>;

// File: ToolScalarFieldEnum.schema.ts

export const ToolScalarFieldEnumSchema = z.enum(['id', 'slug', 'name', 'description', 'icon', 'creditCost', 'creditUnit', 'enabled', 'public', 'createdAt', 'updatedAt'])

export type ToolScalarFieldEnumEnum = z.infer<typeof ToolScalarFieldEnumSchema>;

// File: ToolJobScalarFieldEnum.schema.ts

export const ToolJobScalarFieldEnumSchema = z.enum(['id', 'toolSlug', 'toolId', 'status', 'priority', 'input', 'output', 'error', 'userId', 'sessionId', 'attempts', 'maxAttempts', 'startedAt', 'completedAt', 'expiresAt', 'createdAt', 'updatedAt', 'pgBossJobId', 'newsAnalysisId'])

export type ToolJobScalarFieldEnumEnum = z.infer<typeof ToolJobScalarFieldEnumSchema>;

// File: NewsAnalysisScalarFieldEnum.schema.ts

export const NewsAnalysisScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'userId', 'sourceUrl', 'sourceText', 'title', 'analysis', 'createdAt', 'updatedAt'])

export type NewsAnalysisScalarFieldEnumEnum = z.infer<typeof NewsAnalysisScalarFieldEnumSchema>;

// File: RateLimitEntryScalarFieldEnum.schema.ts

export const RateLimitEntryScalarFieldEnumSchema = z.enum(['id', 'identifier', 'toolSlug', 'toolId', 'windowStart', 'windowEnd', 'count', 'createdAt', 'updatedAt'])

export type RateLimitEntryScalarFieldEnumEnum = z.infer<typeof RateLimitEntryScalarFieldEnumSchema>;

// File: CreditBalanceScalarFieldEnum.schema.ts

export const CreditBalanceScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'periodStart', 'periodEnd', 'included', 'used', 'overage', 'purchasedCredits', 'createdAt', 'updatedAt'])

export type CreditBalanceScalarFieldEnumEnum = z.infer<typeof CreditBalanceScalarFieldEnumSchema>;

// File: CreditTransactionScalarFieldEnum.schema.ts

export const CreditTransactionScalarFieldEnumSchema = z.enum(['id', 'balanceId', 'amount', 'type', 'toolSlug', 'toolId', 'jobId', 'description', 'createdAt'])

export type CreditTransactionScalarFieldEnumEnum = z.infer<typeof CreditTransactionScalarFieldEnumSchema>;

// File: AuditLogScalarFieldEnum.schema.ts

export const AuditLogScalarFieldEnumSchema = z.enum(['id', 'createdAt', 'userId', 'organizationId', 'action', 'resource', 'resourceId', 'ipAddress', 'userAgent', 'sessionId', 'success', 'metadata', 'expiresAt'])

export type AuditLogScalarFieldEnumEnum = z.infer<typeof AuditLogScalarFieldEnumSchema>;

// File: NotificationScalarFieldEnum.schema.ts

export const NotificationScalarFieldEnumSchema = z.enum(['id', 'createdAt', 'userId', 'type', 'category', 'title', 'body', 'actionUrl', 'read', 'readAt'])

export type NotificationScalarFieldEnumEnum = z.infer<typeof NotificationScalarFieldEnumSchema>;

// File: NotificationPreferenceScalarFieldEnum.schema.ts

export const NotificationPreferenceScalarFieldEnumSchema = z.enum(['id', 'userId', 'createdAt', 'updatedAt', 'billing', 'security', 'team', 'system'])

export type NotificationPreferenceScalarFieldEnumEnum = z.infer<typeof NotificationPreferenceScalarFieldEnumSchema>;

// File: FileScalarFieldEnum.schema.ts

export const FileScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'userId', 'filename', 'mimeType', 'size', 'storagePath', 'bucket', 'createdAt', 'updatedAt'])

export type FileScalarFieldEnumEnum = z.infer<typeof FileScalarFieldEnumSchema>;

// File: FileTagScalarFieldEnum.schema.ts

export const FileTagScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'name', 'createdAt'])

export type FileTagScalarFieldEnumEnum = z.infer<typeof FileTagScalarFieldEnumSchema>;

// File: FileToTagScalarFieldEnum.schema.ts

export const FileToTagScalarFieldEnumSchema = z.enum(['fileId', 'tagId', 'createdAt'])

export type FileToTagScalarFieldEnumEnum = z.infer<typeof FileToTagScalarFieldEnumSchema>;

// File: ArchiveScalarFieldEnum.schema.ts

export const ArchiveScalarFieldEnumSchema = z.enum(['id', 'name', 'priority', 'data', 'state', 'retry_limit', 'retry_count', 'retry_delay', 'retry_backoff', 'start_after', 'started_on', 'singleton_key', 'singleton_on', 'created_on', 'completed_on', 'keep_until', 'output', 'dead_letter', 'policy', 'archived_on'])

export type ArchiveScalarFieldEnumEnum = z.infer<typeof ArchiveScalarFieldEnumSchema>;

// File: JobScalarFieldEnum.schema.ts

export const JobScalarFieldEnumSchema = z.enum(['id', 'name', 'priority', 'data', 'state', 'retry_limit', 'retry_count', 'retry_delay', 'retry_backoff', 'start_after', 'started_on', 'singleton_key', 'singleton_on', 'created_on', 'completed_on', 'keep_until', 'output', 'dead_letter', 'policy'])

export type JobScalarFieldEnumEnum = z.infer<typeof JobScalarFieldEnumSchema>;

// File: QueueScalarFieldEnum.schema.ts

export const QueueScalarFieldEnumSchema = z.enum(['name', 'policy', 'retry_limit', 'retry_delay', 'retry_backoff', 'expire_seconds', 'retention_minutes', 'dead_letter', 'partition_name', 'created_on', 'updated_on'])

export type QueueScalarFieldEnumEnum = z.infer<typeof QueueScalarFieldEnumSchema>;

// File: ScheduleScalarFieldEnum.schema.ts

export const ScheduleScalarFieldEnumSchema = z.enum(['name', 'cron', 'timezone', 'data', 'options', 'created_on', 'updated_on'])

export type ScheduleScalarFieldEnumEnum = z.infer<typeof ScheduleScalarFieldEnumSchema>;

// File: SubscriptionScalarFieldEnum.schema.ts

export const SubscriptionScalarFieldEnumSchema = z.enum(['event', 'name', 'created_on', 'updated_on'])

export type SubscriptionScalarFieldEnumEnum = z.infer<typeof SubscriptionScalarFieldEnumSchema>;

// File: VersionScalarFieldEnum.schema.ts

export const VersionScalarFieldEnumSchema = z.enum(['version', 'maintained_on', 'cron_on', 'monitored_on'])

export type VersionScalarFieldEnumEnum = z.infer<typeof VersionScalarFieldEnumSchema>;

// File: SortOrder.schema.ts

export const SortOrderSchema = z.enum(['asc', 'desc'])

export type SortOrderEnum = z.infer<typeof SortOrderSchema>;

// File: JsonNullValueInput.schema.ts

export const JsonNullValueInputSchema = z.enum(['JsonNull'])

export type JsonNullValueInputEnum = z.infer<typeof JsonNullValueInputSchema>;

// File: NullableJsonNullValueInput.schema.ts

export const NullableJsonNullValueInputSchema = z.enum(['DbNull', 'JsonNull'])

export type NullableJsonNullValueInputEnum = z.infer<typeof NullableJsonNullValueInputSchema>;

// File: QueryMode.schema.ts

export const QueryModeSchema = z.enum(['default', 'insensitive'])

export type QueryModeEnum = z.infer<typeof QueryModeSchema>;

// File: NullsOrder.schema.ts

export const NullsOrderSchema = z.enum(['first', 'last'])

export type NullsOrderEnum = z.infer<typeof NullsOrderSchema>;

// File: JsonNullValueFilter.schema.ts

export const JsonNullValueFilterSchema = z.enum(['DbNull', 'JsonNull', 'AnyNull'])

export type JsonNullValueFilterEnum = z.infer<typeof JsonNullValueFilterSchema>;

// File: PurchaseType.schema.ts

export const PurchaseTypeSchema = z.enum(['SUBSCRIPTION', 'ONE_TIME'])

export type PurchaseTypeEnum = z.infer<typeof PurchaseTypeSchema>;

// File: ToolJobStatus.schema.ts

export const ToolJobStatusSchema = z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'])

export type ToolJobStatusEnum = z.infer<typeof ToolJobStatusSchema>;

// File: CreditTransactionType.schema.ts

export const CreditTransactionTypeSchema = z.enum(['GRANT', 'USAGE', 'OVERAGE', 'REFUND', 'PURCHASE', 'ADJUSTMENT'])

export type CreditTransactionTypeEnum = z.infer<typeof CreditTransactionTypeSchema>;

// File: AuditAction.schema.ts

export const AuditActionSchema = z.enum(['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'MFA_SETUP', 'MFA_DISABLE', 'IMPERSONATE', 'INVITE', 'EXPORT', 'SUBSCRIPTION_CHANGE', 'PAYMENT'])

export type AuditActionEnum = z.infer<typeof AuditActionSchema>;

// File: job_state.schema.ts

export const job_stateSchema = z.enum(['created', 'retry', 'active', 'completed', 'cancelled', 'failed'])

export type job_stateEnum = z.infer<typeof job_stateSchema>;

// File: User.schema.ts

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
  username: z.string().nullish(),
  role: z.string().nullish(),
  banned: z.boolean().nullish(),
  banReason: z.string().nullish(),
  banExpires: z.date().nullish(),
  onboardingComplete: z.boolean(),
  paymentsCustomerId: z.string().nullish(),
  locale: z.string().nullish(),
  twoFactorEnabled: z.boolean().nullish(),
});

export type UserType = z.infer<typeof UserSchema>;


// File: Session.schema.ts

export const SessionSchema = z.object({
  id: z.string(),
  expiresAt: z.date(),
  ipAddress: z.string().nullish(),
  userAgent: z.string().nullish(),
  userId: z.string(),
  impersonatedBy: z.string().nullish(),
  activeOrganizationId: z.string().nullish(),
  token: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SessionType = z.infer<typeof SessionSchema>;


// File: Account.schema.ts

export const AccountSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  providerId: z.string(),
  userId: z.string(),
  accessToken: z.string().nullish(),
  refreshToken: z.string().nullish(),
  idToken: z.string().nullish(),
  expiresAt: z.date().nullish(),
  password: z.string().nullish(),
  accessTokenExpiresAt: z.date().nullish(),
  refreshTokenExpiresAt: z.date().nullish(),
  scope: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AccountType = z.infer<typeof AccountSchema>;


// File: Verification.schema.ts

export const VerificationSchema = z.object({
  id: z.string(),
  identifier: z.string(),
  value: z.string(),
  expiresAt: z.date(),
  createdAt: z.date().nullish(),
  updatedAt: z.date().nullish(),
});

export type VerificationType = z.infer<typeof VerificationSchema>;


// File: Passkey.schema.ts

export const PasskeySchema = z.object({
  id: z.string(),
  name: z.string().nullish(),
  publicKey: z.string(),
  userId: z.string(),
  credentialID: z.string(),
  counter: z.number().int(),
  deviceType: z.string(),
  backedUp: z.boolean(),
  transports: z.string().nullish(),
  createdAt: z.date().nullish(),
  aaguid: z.string().nullish(),
});

export type PasskeyType = z.infer<typeof PasskeySchema>;


// File: TwoFactor.schema.ts

export const TwoFactorSchema = z.object({
  id: z.string(),
  secret: z.string(),
  backupCodes: z.string(),
  userId: z.string(),
});

export type TwoFactorType = z.infer<typeof TwoFactorSchema>;


// File: Organization.schema.ts

export const OrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().nullish(),
  logo: z.string().nullish(),
  createdAt: z.date(),
  metadata: z.string().nullish(),
  paymentsCustomerId: z.string().nullish(),
});

export type OrganizationType = z.infer<typeof OrganizationSchema>;


// File: Member.schema.ts

export const MemberSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  userId: z.string(),
  role: z.string(),
  createdAt: z.date(),
});

export type MemberType = z.infer<typeof MemberSchema>;


// File: Invitation.schema.ts

export const InvitationSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  email: z.string(),
  role: z.string().nullish(),
  status: z.string(),
  expiresAt: z.date(),
  inviterId: z.string(),
});

export type InvitationType = z.infer<typeof InvitationSchema>;


// File: Purchase.schema.ts

export const PurchaseSchema = z.object({
  id: z.string(),
  organizationId: z.string().nullish(),
  userId: z.string().nullish(),
  type: PurchaseTypeSchema,
  customerId: z.string(),
  subscriptionId: z.string().nullish(),
  productId: z.string(),
  status: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PurchaseType = z.infer<typeof PurchaseSchema>;


// File: AiChat.schema.ts

export const AiChatSchema = z.object({
  id: z.string(),
  organizationId: z.string().nullish(),
  userId: z.string().nullish(),
  title: z.string().nullish(),
  messages: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").default("[]"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AiChatType = z.infer<typeof AiChatSchema>;


// File: AgentSession.schema.ts

export const AgentSessionSchema = z.object({
  id: z.string(),
  sessionType: z.string(),
  userId: z.string(),
  organizationId: z.string().nullish(),
  toolSlug: z.string().nullish(),
  toolId: z.string().nullish(),
  jobId: z.string().nullish(),
  isComplete: z.boolean(),
  messages: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").default("[]"),
  context: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").default("{}"),
  extractedData: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  totalInputTokens: z.number().int(),
  totalOutputTokens: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AgentSessionType = z.infer<typeof AgentSessionSchema>;


// File: Tool.schema.ts

export const ToolSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  icon: z.string().nullish(),
  creditCost: z.number().int().default(1),
  creditUnit: z.string().default("request"),
  enabled: z.boolean().default(true),
  public: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ToolType = z.infer<typeof ToolSchema>;


// File: ToolJob.schema.ts

export const ToolJobSchema = z.object({
  id: z.string(),
  toolSlug: z.string(),
  toolId: z.string().nullish(),
  status: ToolJobStatusSchema.default("PENDING"),
  priority: z.number().int(),
  input: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10"),
  output: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  error: z.string().nullish(),
  userId: z.string().nullish(),
  sessionId: z.string().nullish(),
  attempts: z.number().int(),
  maxAttempts: z.number().int().default(3),
  startedAt: z.date().nullish(),
  completedAt: z.date().nullish(),
  expiresAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
  pgBossJobId: z.string().nullish(),
  newsAnalysisId: z.string().nullish(),
});

export type ToolJobType = z.infer<typeof ToolJobSchema>;


// File: NewsAnalysis.schema.ts

export const NewsAnalysisSchema = z.object({
  id: z.string(),
  organizationId: z.string().nullish(),
  userId: z.string().nullish(),
  sourceUrl: z.string().nullish(),
  sourceText: z.string().nullish(),
  title: z.string().nullish(),
  analysis: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type NewsAnalysisType = z.infer<typeof NewsAnalysisSchema>;


// File: RateLimitEntry.schema.ts

export const RateLimitEntrySchema = z.object({
  id: z.string(),
  identifier: z.string(),
  toolSlug: z.string(),
  toolId: z.string().nullish(),
  windowStart: z.date(),
  windowEnd: z.date(),
  count: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type RateLimitEntryType = z.infer<typeof RateLimitEntrySchema>;


// File: CreditBalance.schema.ts

export const CreditBalanceSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  periodStart: z.date(),
  periodEnd: z.date(),
  included: z.number().int(),
  used: z.number().int(),
  overage: z.number().int(),
  purchasedCredits: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CreditBalanceType = z.infer<typeof CreditBalanceSchema>;


// File: CreditTransaction.schema.ts

export const CreditTransactionSchema = z.object({
  id: z.string(),
  balanceId: z.string(),
  amount: z.number().int(),
  type: CreditTransactionTypeSchema,
  toolSlug: z.string().nullish(),
  toolId: z.string().nullish(),
  jobId: z.string().nullish(),
  description: z.string().nullish(),
  createdAt: z.date(),
});

export type CreditTransactionType = z.infer<typeof CreditTransactionSchema>;


// File: AuditLog.schema.ts

export const AuditLogSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  userId: z.string().nullish(),
  organizationId: z.string().nullish(),
  action: AuditActionSchema,
  resource: z.string(),
  resourceId: z.string().nullish(),
  ipAddress: z.string().nullish(),
  userAgent: z.string().nullish(),
  sessionId: z.string().nullish(),
  success: z.boolean().default(true),
  metadata: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  expiresAt: z.date().nullish(),
});

export type AuditLogType = z.infer<typeof AuditLogSchema>;


// File: Notification.schema.ts

export const NotificationSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  userId: z.string(),
  type: z.string(),
  category: z.string(),
  title: z.string(),
  body: z.string(),
  actionUrl: z.string().nullish(),
  read: z.boolean(),
  readAt: z.date().nullish(),
});

export type NotificationType = z.infer<typeof NotificationSchema>;


// File: NotificationPreference.schema.ts

export const NotificationPreferenceSchema = z.object({
  id: z.string(),
  userId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  billing: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").default("{\"inApp\": true, \"email\": true}"),
  security: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").default("{\"inApp\": true, \"email\": true}"),
  team: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").default("{\"inApp\": true, \"email\": true}"),
  system: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").default("{\"inApp\": true, \"email\": false}"),
});

export type NotificationPreferenceType = z.infer<typeof NotificationPreferenceSchema>;


// File: File.schema.ts

export const FileSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  userId: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  size: z.number().int(),
  storagePath: z.string(),
  bucket: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type FileType = z.infer<typeof FileSchema>;


// File: FileTag.schema.ts

export const FileTagSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  createdAt: z.date(),
});

export type FileTagType = z.infer<typeof FileTagSchema>;


// File: FileToTag.schema.ts

export const FileToTagSchema = z.object({
  fileId: z.string(),
  tagId: z.string(),
  createdAt: z.date(),
});

export type FileToTagType = z.infer<typeof FileToTagSchema>;


// File: archive.schema.ts

export const archiveSchema = z.object({
  id: z.string(),
  name: z.string(),
  priority: z.number().int(),
  data: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  state: job_stateSchema,
  retry_limit: z.number().int(),
  retry_count: z.number().int(),
  retry_delay: z.number().int(),
  retry_backoff: z.boolean(),
  start_after: z.date(),
  started_on: z.date().nullish(),
  singleton_key: z.string().nullish(),
  singleton_on: z.date().nullish(),
  created_on: z.date(),
  completed_on: z.date().nullish(),
  keep_until: z.date(),
  output: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  dead_letter: z.string().nullish(),
  policy: z.string().nullish(),
  archived_on: z.date(),
});

export type archiveType = z.infer<typeof archiveSchema>;


// File: job.schema.ts

export const jobSchema = z.object({
  id: z.string(),
  name: z.string(),
  priority: z.number().int(),
  data: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  state: job_stateSchema.default("created"),
  retry_limit: z.number().int().default(2),
  retry_count: z.number().int(),
  retry_delay: z.number().int(),
  retry_backoff: z.boolean(),
  start_after: z.date(),
  started_on: z.date().nullish(),
  singleton_key: z.string().nullish(),
  singleton_on: z.date().nullish(),
  created_on: z.date(),
  completed_on: z.date().nullish(),
  keep_until: z.date(),
  output: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  dead_letter: z.string().nullish(),
  policy: z.string().nullish(),
});

export type jobType = z.infer<typeof jobSchema>;


// File: queue.schema.ts

export const queueSchema = z.object({
  name: z.string(),
  policy: z.string().nullish(),
  retry_limit: z.number().int().nullish(),
  retry_delay: z.number().int().nullish(),
  retry_backoff: z.boolean().nullish(),
  expire_seconds: z.number().int().nullish(),
  retention_minutes: z.number().int().nullish(),
  dead_letter: z.string().nullish(),
  partition_name: z.string().nullish(),
  created_on: z.date(),
  updated_on: z.date(),
});

export type queueType = z.infer<typeof queueSchema>;


// File: schedule.schema.ts

export const scheduleSchema = z.object({
  name: z.string(),
  cron: z.string(),
  timezone: z.string().nullish(),
  data: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  options: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  created_on: z.date(),
  updated_on: z.date(),
});

export type scheduleType = z.infer<typeof scheduleSchema>;


// File: subscription.schema.ts

export const subscriptionSchema = z.object({
  event: z.string(),
  name: z.string(),
  created_on: z.date(),
  updated_on: z.date(),
});

export type subscriptionType = z.infer<typeof subscriptionSchema>;


// File: version.schema.ts

export const versionSchema = z.object({
  version: z.number().int(),
  maintained_on: z.date().nullish(),
  cron_on: z.date().nullish(),
  monitored_on: z.date().nullish(),
});

export type versionType = z.infer<typeof versionSchema>;

