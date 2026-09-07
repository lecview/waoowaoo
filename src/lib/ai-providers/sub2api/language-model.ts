import { createOpenAI } from '@ai-sdk/openai'
import type { AiProviderLanguageModelContext } from '@/lib/ai-providers/runtime-types'
import { fetchWithProviderProxy } from '@/lib/http/outbound-proxy'

export function createSub2ApiLanguageModel(input: AiProviderLanguageModelContext) {
  if (input.protocol !== 'openai-responses') {
    throw new Error(`LLM_PROTOCOL_PROVIDER_MISMATCH:sub2api:${input.protocol}`)
  }
  const baseURL = input.providerConfig.baseUrl?.trim().replace(/\/+$/, '')
  if (!baseURL) throw new Error('PROVIDER_BASE_URL_MISSING: sub2api (language-model)')
  const provider = createOpenAI({
    baseURL,
    apiKey: input.providerConfig.apiKey,
    name: 'sub2api',
    fetch: fetchWithProviderProxy,
  })
  return provider.responses(input.selection.modelId)
}

