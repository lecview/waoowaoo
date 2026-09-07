import type { AiProviderAdapter } from '@/lib/ai-providers/runtime-types'
import { createAiProviderFailureAdapter } from '@/lib/ai-providers/failure'
import { describeMediaVariantBase } from '@/lib/ai-providers/shared/media-adapter'
import { buildGptImage2OptionSchema } from '@/lib/ai-providers/shared/gpt-image-2'
import { buildVideoOptionSchema } from '@/lib/ai-providers/shared/option-schema'
import { executeSub2ApiImageGeneration } from './image'
import { createSub2ApiLanguageModel } from './language-model'
import {
  SUB2API_IMAGE_RESOLUTION_OPTIONS,
  SUB2API_VIDEO_RESOLUTION_OPTIONS,
} from './models'
import { executeSub2ApiVideoGeneration } from './video'

const IMAGE_ASPECT_RATIOS = ['1:1', '5:4', '4:3', '3:2', '16:9', '21:9', '4:5', '3:4', '2:3', '9:16'] as const
const VIDEO_ASPECT_RATIOS = ['1:1', '4:3', '3:4', '16:9', '9:16', '21:9'] as const
const VIDEO_CAPABILITIES = {
  durationOptions: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  resolutionOptions: [...SUB2API_VIDEO_RESOLUTION_OPTIONS],
  generateAudioOptions: [true, false],
  firstlastframe: true,
  maxReferenceImages: 9,
  maxReferenceAudios: 3,
  maxReferenceVideos: 3,
} as const

const imageOptionSchema = buildGptImage2OptionSchema({
  resolutionOptions: SUB2API_IMAGE_RESOLUTION_OPTIONS,
  aspectRatioOptions: IMAGE_ASPECT_RATIOS,
  qualityOptions: ['low', 'medium', 'high'],
  defaultResolution: '2K',
  defaultQuality: 'high',
  defaultOutputFormat: 'png',
  maxReferenceImages: 16,
})

const videoOptionSchema = buildVideoOptionSchema({
  capabilities: VIDEO_CAPABILITIES,
  aspectRatios: VIDEO_ASPECT_RATIOS,
})

export const sub2ApiAdapter: AiProviderAdapter = {
  providerKey: 'sub2api',
  failure: createAiProviderFailureAdapter('sub2api'),
  languageModel: { create: createSub2ApiLanguageModel },
  image: {
    describe: (selection) => describeMediaVariantBase({
      modality: 'image', selection, executionMode: 'async', optionSchema: imageOptionSchema,
    }),
    execute: executeSub2ApiImageGeneration,
  },
  video: {
    describe: (selection) => describeMediaVariantBase({
      modality: 'video', selection, executionMode: 'async', optionSchema: videoOptionSchema,
    }),
    execute: executeSub2ApiVideoGeneration,
  },
}
