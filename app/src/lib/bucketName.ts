import type { ProviderType } from '../api/types';

/** Strip URI schemes and normalize to lowercase. */
export function sanitizeBucketName(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^(gs|s3|azure|az|https?):\/\//, '')
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface BucketNameRules {
  minLength: number;
  maxLength: number;
  pattern: RegExp;
  hint: string;
}

const RULES: Record<ProviderType, BucketNameRules> = {
  gcs: {
    minLength: 3,
    maxLength: 63,
    pattern: /^[a-z0-9][a-z0-9._-]{1,61}[a-z0-9]$/,
    hint: '3–63 characters; lowercase letters, numbers, dashes, dots, or underscores; must start and end with a letter or number.',
  },
  s3: {
    minLength: 3,
    maxLength: 63,
    pattern: /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/,
    hint: '3–63 characters; lowercase letters, numbers, dashes, or dots only (no underscores); must start and end with a letter or number.',
  },
  azure: {
    minLength: 3,
    maxLength: 63,
    pattern: /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/,
    hint: '3–63 characters; lowercase letters, numbers, and dashes only; must start and end with a letter or number.',
  },
};

export function getBucketNameRules(provider: ProviderType): BucketNameRules {
  return RULES[provider];
}

/** Returns an error message, or null when valid. */
export function validateBucketName(name: string, provider: ProviderType): string | null {
  const rules = getBucketNameRules(provider);
  if (name.length < rules.minLength) {
    return `Bucket name must be at least ${rules.minLength} characters.`;
  }
  if (name.length > rules.maxLength) {
    return `Bucket name must be at most ${rules.maxLength} characters.`;
  }
  if (!rules.pattern.test(name)) {
    return rules.hint;
  }
  if (/^\d+\.\d+\.\d+\.\d+$/.test(name)) {
    return 'Bucket name cannot look like an IP address.';
  }
  return null;
}

/** Sanitize then validate; throws with a clear message if still invalid. */
export function prepareBucketName(raw: string, provider: ProviderType): string {
  const name = sanitizeBucketName(raw);
  const err = validateBucketName(name, provider);
  if (err) throw new Error(err);
  return name;
}
