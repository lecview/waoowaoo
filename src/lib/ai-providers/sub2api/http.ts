import { ProviderHttpError, readProviderJsonResponse } from '@/lib/ai-providers/failure'
import { fetchWithProviderProxy } from '@/lib/http/outbound-proxy'

export function requireSub2ApiBaseUrl(baseUrl: string | undefined): string {
  const normalized = baseUrl?.trim().replace(/\/+$/, '') ?? ''
  if (!normalized) throw new Error('PROVIDER_BASE_URL_MISSING: sub2api')
  return normalized
}

export async function requestSub2ApiJson(input: {
  baseUrl: string
  apiKey: string
  path: string
  phase: 'submit' | 'poll'
  method?: 'GET' | 'POST'
  body?: Record<string, unknown>
}): Promise<unknown> {
  const response = await fetchWithProviderProxy(`${input.baseUrl}${input.path}`, {
    method: input.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      Accept: 'application/json',
      ...(input.body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(input.body ? { body: JSON.stringify(input.body) } : {}),
    cache: 'no-store',
  })
  const payload = await readProviderJsonResponse({ response, provider: 'sub2api', phase: input.phase })
  if (!response.ok) {
    throw new ProviderHttpError({
      provider: 'sub2api',
      phase: input.phase,
      statusCode: response.status,
      requestId: response.headers.get('x-request-id'),
      contentType: response.headers.get('content-type'),
      errorEnvelope: payload,
    })
  }
  return payload
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

export function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

