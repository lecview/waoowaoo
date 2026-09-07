import type { FailureRecord } from '@/lib/errors/failure'
import { createProviderAsyncTaskFailure } from '@/lib/ai-providers/shared/async-task-status'
import type { AiProviderVideoExecutionContext, GenerateResult } from '@/lib/ai-providers/runtime-types'
import { asRecord, readString, requestSub2ApiJson, requireSub2ApiBaseUrl } from './http'

export type Sub2ApiVideoPollResult = {
  status: 'pending' | 'completed' | 'failed'
  videoUrl?: string
  resultUrl?: string
  downloadHeaders?: Record<string, string>
  failure?: FailureRecord
}

function readRequestId(payload: unknown): string | null {
  const record = asRecord(payload)
  return readString(record?.id) ?? readString(record?.request_id) ?? readString(record?.task_id)
}

function readVideoUrl(payload: unknown): string | null {
  const record = asRecord(payload)
  const output = asRecord(record?.output)
  const metadata = asRecord(record?.metadata)
  const data = Array.isArray(record?.data) ? record.data : []
  const first = asRecord(data[0])
  return readString(record?.video_url)
    ?? readString(record?.url)
    ?? readString(output?.video_url)
    ?? readString(output?.url)
    ?? readString(metadata?.video_url)
    ?? readString(metadata?.url)
    ?? readString(first?.video_url)
    ?? readString(first?.url)
}

function downloadHeaders(resultUrl: string, baseUrl: string, apiKey: string): Record<string, string> | undefined {
  const result = new URL(resultUrl, baseUrl)
  if (result.origin !== new URL(baseUrl).origin) return undefined
  return { Authorization: `Bearer ${apiKey}` }
}

export async function executeSub2ApiVideoGeneration(
  input: AiProviderVideoExecutionContext,
): Promise<GenerateResult> {
  const baseUrl = requireSub2ApiBaseUrl(input.providerConfig.baseUrl)
  const options = input.options ?? {}
  const prompt = readString(options.prompt)
  if (!prompt) throw new Error('SUB2API_VIDEO_PROMPT_REQUIRED')
  const firstFrame = input.imageUrl.trim()
  const body: Record<string, unknown> = {
    model: input.selection.modelId,
    prompt,
    ...(typeof options.duration === 'number' ? { duration: options.duration } : {}),
    ...(readString(options.resolution) ? { resolution: options.resolution } : {}),
    ...(readString(options.aspectRatio) ? { aspect_ratio: options.aspectRatio } : {}),
    ...(typeof options.generateAudio === 'boolean' ? { generate_audio: options.generateAudio } : {}),
    ...(firstFrame ? { image: { image_url: firstFrame } } : {}),
    ...(readString(options.lastFrameImageUrl)
      ? { images: [
          { image_url: firstFrame, role: 'first_frame' },
          { image_url: options.lastFrameImageUrl, role: 'last_frame' },
        ] }
      : {}),
    ...(options.referenceImages?.length
      ? { reference_images: options.referenceImages.map((imageUrl) => ({ image_url: imageUrl })) }
      : {}),
  }
  const payload = await requestSub2ApiJson({
    baseUrl,
    apiKey: input.providerConfig.apiKey,
    path: '/videos',
    phase: 'submit',
    method: 'POST',
    body,
  })
  const requestId = readRequestId(payload)
  if (!requestId) throw new Error('SUB2API_VIDEO_SUBMIT_ID_MISSING')
  return {
    success: true,
    async: true,
    requestId,
    endpoint: 'videos',
    externalId: `SUB2API:VIDEO:${requestId}`,
  }
}

export async function querySub2ApiVideoStatus(input: {
  baseUrl: string
  apiKey: string
  requestId: string
}): Promise<Sub2ApiVideoPollResult> {
  const payload = await requestSub2ApiJson({
    baseUrl: input.baseUrl,
    apiKey: input.apiKey,
    path: `/videos/${encodeURIComponent(input.requestId)}`,
    phase: 'poll',
  })
  const record = asRecord(payload)
  const status = (readString(record?.status) ?? '').toLowerCase()
  if (status === 'queued' || status === 'pending' || status === 'processing' || status === 'in_progress' || status === 'running') {
    return { status: 'pending' }
  }
  if (status === 'completed' || status === 'succeeded' || status === 'success') {
    const videoUrl = readVideoUrl(payload)
    if (!videoUrl) {
      return {
        status: 'failed',
        failure: createProviderAsyncTaskFailure({
          provider: 'sub2api',
          code: 'EMPTY_RESPONSE',
          message: 'SUB2API_VIDEO_COMPLETED_WITHOUT_URL',
          cause: payload,
        }),
      }
    }
    return {
      status: 'completed',
      videoUrl,
      resultUrl: videoUrl,
      downloadHeaders: downloadHeaders(videoUrl, input.baseUrl, input.apiKey),
    }
  }
  if (status === 'failed' || status === 'cancelled' || status === 'canceled' || status === 'expired') {
    const error = asRecord(record?.error)
    return {
      status: 'failed',
      failure: createProviderAsyncTaskFailure({
        provider: 'sub2api',
        code: 'EXTERNAL_ERROR',
        message: readString(error?.message) ?? readString(record?.message) ?? `Sub2API video generation ${status}`,
        cause: payload,
      }),
    }
  }
  throw new Error(`SUB2API_VIDEO_STATUS_UNKNOWN:${status || '<missing>'}`)
}

