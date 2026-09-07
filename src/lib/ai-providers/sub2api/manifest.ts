import { defineAiProviderManifest } from '@/lib/ai-providers/manifest'
import { sub2ApiAdapter } from './adapter'
import { sub2ApiAsyncTaskProvider } from './async-task'
import { SUB2API_DEFAULT_BASE_URL } from './config'
import {
  SUB2API_API_CONFIG_CATALOG_MODELS,
  SUB2API_CAPABILITY_CATALOG_ENTRIES,
  SUB2API_PLATFORM_MODEL_PRESETS,
  SUB2API_PRICING_CATALOG_ENTRIES,
} from './models'

const BOTH_TRANSPORTS = ['public-https', 'inline-data-url'] as const

export const sub2ApiProviderManifest = defineAiProviderManifest({
  providerKey: 'sub2api',
  adapter: sub2ApiAdapter,
  apiConfig: {
    visibility: 'visible',
    name: 'Sub2API / AIMasker',
    baseUrl: SUB2API_DEFAULT_BASE_URL,
  },
  platformCredentials: {
    envPrefix: 'PLATFORM_SUB2API',
    requiresBaseUrl: true,
  },
  asyncTasks: [sub2ApiAsyncTaskProvider],
  catalogs: {
    capabilities: SUB2API_CAPABILITY_CATALOG_ENTRIES,
    pricing: SUB2API_PRICING_CATALOG_ENTRIES,
    apiConfigModels: SUB2API_API_CONFIG_CATALOG_MODELS,
    platformModels: SUB2API_PLATFORM_MODEL_PRESETS,
  },
  mediaInputs: [
    { modality: 'vision', transports: { image: BOTH_TRANSPORTS } },
    { modality: 'image', transports: { image: BOTH_TRANSPORTS } },
    { modality: 'video', transports: { image: BOTH_TRANSPORTS, audio: BOTH_TRANSPORTS, video: BOTH_TRANSPORTS } },
  ],
})
