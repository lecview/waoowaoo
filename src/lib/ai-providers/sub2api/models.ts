import type { PlatformModelPreset } from '@/lib/platform-models/types'
import { usdToCredits } from '@/lib/ai-registry/pricing-currency'

export const SUB2API_LLM_MODEL_IDS = [
  'gpt-5.6-luna',
  'gpt-5.6-sol',
  'gpt-5.6-terra',
  'gpt-6-astra',
] as const
export const SUB2API_IMAGE_MODEL_ID = 'gpt-image-2'
export const SUB2API_VIDEO_MODEL_ID = 'seedance20'

const LLM_NAMES: Readonly<Record<(typeof SUB2API_LLM_MODEL_IDS)[number], string>> = {
  'gpt-5.6-luna': 'GPT-5.6 Luna',
  'gpt-5.6-sol': 'GPT-5.6 Sol',
  'gpt-5.6-terra': 'GPT-5.6 Terra',
  'gpt-6-astra': 'GPT-6 Astra',
}

const LLM_REASONING_EFFORTS = ['none', 'low', 'medium', 'high', 'xhigh', 'max'] as const
const IMAGE_RESOLUTIONS = ['1K', '2K', '4K'] as const
const VIDEO_RESOLUTIONS = ['480p', '720p', '1080p'] as const

export const SUB2API_CAPABILITY_CATALOG_ENTRIES = [
  ...SUB2API_LLM_MODEL_IDS.map((modelId) => ({
    modelType: 'llm' as const,
    provider: 'sub2api',
    modelId,
    capabilities: {
      llm: {
        protocol: 'openai-responses' as const,
        codexRuntimeWireApi: 'responses' as const,
        publicReasoningMode: 'summary_auto' as const,
        reasoningEffortOptions: [...LLM_REASONING_EFFORTS],
        defaultReasoningEffort: 'medium' as const,
        contextWindow: 1_050_000,
      },
    },
  })),
  {
    modelType: 'image' as const,
    provider: 'sub2api',
    modelId: SUB2API_IMAGE_MODEL_ID,
    capabilities: {
      image: {
        resolutionOptions: [...IMAGE_RESOLUTIONS],
        qualityOptions: ['low', 'medium', 'high'],
        maxReferenceImages: 16,
      },
    },
  },
  {
    modelType: 'video' as const,
    provider: 'sub2api',
    modelId: SUB2API_VIDEO_MODEL_ID,
    capabilities: {
      video: {
        supportedInputModes: ['text_to_video', 'first_frame', 'first_last_frame', 'reference'],
        supportsTextToVideo: true,
        generationModeOptions: ['normal', 'firstlastframe'],
        generateAudioOptions: [true, false],
        durationOptions: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        resolutionOptions: [...VIDEO_RESOLUTIONS],
        firstlastframe: true,
        supportGenerateAudio: true,
        assetReferenceMultiReference: true,
        maxReferenceImages: 9,
        maxReferenceAudios: 3,
        maxReferenceVideos: 3,
        maxReferenceFiles: 12,
      },
    },
  },
] as const

const zeroTokenPricing = {
  mode: 'capability' as const,
  tiers: [
    { when: { tokenType: 'input' }, amount: usdToCredits(0) },
    { when: { tokenType: 'output' }, amount: usdToCredits(0) },
  ],
}

export const SUB2API_PRICING_CATALOG_ENTRIES = [
  ...SUB2API_LLM_MODEL_IDS.map((modelId) => ({
    apiType: 'text' as const,
    provider: 'sub2api',
    modelId,
    cost: zeroTokenPricing,
  })),
  {
    apiType: 'image' as const,
    provider: 'sub2api',
    modelId: SUB2API_IMAGE_MODEL_ID,
    cost: {
      mode: 'capability' as const,
      tiers: IMAGE_RESOLUTIONS.map((resolution) => ({ when: { resolution }, amount: usdToCredits(0) })),
    },
  },
  {
    apiType: 'video' as const,
    provider: 'sub2api',
    modelId: SUB2API_VIDEO_MODEL_ID,
    cost: {
      mode: 'capability' as const,
      unit: 'per_second' as const,
      tiers: VIDEO_RESOLUTIONS.map((resolution) => ({ when: { resolution }, amount: usdToCredits(0) })),
    },
  },
] as const

export const SUB2API_API_CONFIG_CATALOG_MODELS = [
  ...SUB2API_LLM_MODEL_IDS.map((modelId) => ({
    modelId,
    name: LLM_NAMES[modelId],
    type: 'llm' as const,
    provider: 'sub2api',
  })),
  { modelId: SUB2API_IMAGE_MODEL_ID, name: 'GPT Image 2', type: 'image' as const, provider: 'sub2api' },
  { modelId: SUB2API_VIDEO_MODEL_ID, name: 'Seedance 2.0', type: 'video' as const, provider: 'sub2api' },
] as const

export const SUB2API_PLATFORM_MODEL_PRESETS = SUB2API_API_CONFIG_CATALOG_MODELS
  .map((model) => ({ ...model })) satisfies ReadonlyArray<PlatformModelPreset>

export const SUB2API_IMAGE_RESOLUTION_OPTIONS = IMAGE_RESOLUTIONS
export const SUB2API_VIDEO_RESOLUTION_OPTIONS = VIDEO_RESOLUTIONS

