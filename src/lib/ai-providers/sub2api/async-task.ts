import type { AsyncTaskProviderRegistration, ParsedAsyncExternalId } from '@/lib/ai-providers/async-task-types'
import { normalizeAsyncPollResult } from '@/lib/ai-providers/async-task-types'
import { querySub2ApiImageStatus } from './image'
import { querySub2ApiVideoStatus } from './video'

function parseExternalId(externalId: string): ParsedAsyncExternalId {
  const parts = externalId.split(':')
  const type = parts[1]
  const requestId = parts.slice(2).join(':')
  if ((type !== 'VIDEO' && type !== 'IMAGE') || !requestId) {
    throw new Error(`SUB2API_EXTERNAL_ID_INVALID:${externalId}`)
  }
  return { provider: 'SUB2API', type: 'VIDEO', requestId }
}

export const sub2ApiAsyncTaskProvider: AsyncTaskProviderRegistration = {
  providerCode: 'SUB2API',
  providerKey: 'sub2api',
  canParseExternalId: (externalId) => externalId.startsWith('SUB2API:'),
  parseExternalId,
  formatExternalId: (input) => `SUB2API:${input.type}:${input.requestId}`,
  poll: async ({ parsed, context }) => {
    const { apiKey, baseUrl } = await context.getProviderConfig(context.userId, 'sub2api')
    if (!baseUrl) throw new Error('PROVIDER_BASE_URL_MISSING: sub2api (async-task)')
    const result = parsed.type === 'IMAGE'
      ? await querySub2ApiImageStatus({ baseUrl, apiKey, requestId: parsed.requestId })
      : await querySub2ApiVideoStatus({ baseUrl, apiKey, requestId: parsed.requestId })
    return normalizeAsyncPollResult({
      status: result.status,
      ...(result.status === 'failed' ? { failure: result.failure } : {}),
      ...('imageUrl' in result ? { imageUrl: result.imageUrl } : {}),
      ...('videoUrl' in result ? { videoUrl: result.videoUrl } : {}),
      resultUrl: result.resultUrl,
      ...('downloadHeaders' in result ? { downloadHeaders: result.downloadHeaders } : {}),
    })
  },
}
