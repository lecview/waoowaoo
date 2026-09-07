import type { AiProviderImageExecutionContext, GenerateResult } from '@/lib/ai-providers/runtime-types'
import type { FailureRecord } from '@/lib/errors/failure'
import { createProviderAsyncTaskFailure } from '@/lib/ai-providers/shared/async-task-status'
import { normalizeToBase64ForGeneration } from '@/lib/media/outbound-image'
import { asRecord, readString, requestSub2ApiJson, requireSub2ApiBaseUrl } from './http'

export type Sub2ApiImagePollResult = {
  status: 'pending' | 'completed' | 'failed'
  imageUrl?: string
  resultUrl?: string
  failure?: FailureRecord
}

export async function executeSub2ApiImageGeneration(
  input: AiProviderImageExecutionContext,
): Promise<GenerateResult> {
  const prompt = input.prompt.trim()
  if (!prompt) throw new Error('SUB2API_IMAGE_PROMPT_REQUIRED')
  const options = input.options ?? {}
  const imageSize = asRecord(options.imageSize)
  const width = typeof imageSize?.width === 'number' ? imageSize.width : null
  const height = typeof imageSize?.height === 'number' ? imageSize.height : null
  if (!width || !height) throw new Error('SUB2API_IMAGE_SIZE_REQUIRED')

  const outputFormat = readString(options.outputFormat) ?? 'png'
  const referenceImages = await Promise.all(
    (options.referenceImages ?? []).map(normalizeToBase64ForGeneration),
  )
  const common = {
    model: input.selection.modelId,
    prompt,
    n: 1,
    size: `${String(width)}x${String(height)}`,
    quality: readString(options.quality) ?? 'high',
    output_format: outputFormat,
    response_format: 'b64_json',
  }
  const payload = await requestSub2ApiJson({
    baseUrl: requireSub2ApiBaseUrl(input.providerConfig.baseUrl),
    apiKey: input.providerConfig.apiKey,
    path: referenceImages.length > 0 ? '/images/edits/async' : '/images/generations/async',
    phase: 'submit',
    method: 'POST',
    body: referenceImages.length > 0
      ? { ...common, images: referenceImages.map((imageUrl) => ({ image_url: imageUrl })) }
      : common,
  })
  const response = asRecord(payload)
  const requestId = readString(response?.task_id) ?? readString(response?.id)
  if (!requestId) throw new Error('SUB2API_IMAGE_SUBMIT_ID_MISSING')
  return {
    success: true,
    async: true,
    requestId,
    endpoint: referenceImages.length > 0 ? 'images/edits/async' : 'images/generations/async',
    externalId: `SUB2API:IMAGE:${requestId}`,
  }
}

export async function querySub2ApiImageStatus(input: {
  baseUrl: string
  apiKey: string
  requestId: string
}): Promise<Sub2ApiImagePollResult> {
  const payload = await requestSub2ApiJson({
    baseUrl: input.baseUrl,
    apiKey: input.apiKey,
    path: `/images/tasks/${encodeURIComponent(input.requestId)}`,
    phase: 'poll',
  })
  const record = asRecord(payload)
  const status = (readString(record?.status) ?? '').toLowerCase()
  if (status === 'queued' || status === 'pending' || status === 'processing' || status === 'in_progress' || status === 'running') {
    return { status: 'pending' }
  }
  if (status === 'completed' || status === 'succeeded' || status === 'success') {
    const result = asRecord(record?.result)
    const data = Array.isArray(result?.data) ? result.data : []
    const first = asRecord(data[0])
    const imageUrl = readString(record?.image_url) ?? readString(first?.url)
    if (!imageUrl) {
      return {
        status: 'failed',
        failure: createProviderAsyncTaskFailure({
          provider: 'sub2api',
          code: 'EMPTY_RESPONSE',
          message: 'SUB2API_IMAGE_COMPLETED_WITHOUT_URL',
          cause: payload,
        }),
      }
    }
    return { status: 'completed', imageUrl, resultUrl: imageUrl }
  }
  if (status === 'failed' || status === 'cancelled' || status === 'canceled' || status === 'expired') {
    const error = asRecord(record?.error)
    return {
      status: 'failed',
      failure: createProviderAsyncTaskFailure({
        provider: 'sub2api',
        code: 'EXTERNAL_ERROR',
        message: readString(error?.message) ?? readString(record?.message) ?? `Sub2API image generation ${status}`,
        cause: payload,
      }),
    }
  }
  throw new Error(`SUB2API_IMAGE_STATUS_UNKNOWN:${status || '<missing>'}`)
}
