import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type {
  AiProviderImageExecutionContext,
  AiProviderVideoExecutionContext,
} from '@/lib/ai-providers/runtime-types'
import {
  executeSub2ApiImageGeneration,
  querySub2ApiImageStatus,
} from '@/lib/ai-providers/sub2api/image'
import {
  executeSub2ApiVideoGeneration,
  querySub2ApiVideoStatus,
} from '@/lib/ai-providers/sub2api/video'
import { startScenarioServer } from '../../helpers/fakes/scenario-server'

describe('provider contract - Sub2API', () => {
  let server: Awaited<ReturnType<typeof startScenarioServer>> | null = null

  beforeEach(async () => {
    server = await startScenarioServer()
  })

  afterEach(async () => {
    await server?.close()
    server = null
  })

  it('submits and polls a native asynchronous image request', async () => {
    server!.defineScenario({
      method: 'POST',
      path: '/v1/images/generations/async',
      mode: 'success',
      submitResponse: { status: 202, body: { task_id: 'image-task-1', status: 'processing' } },
    })
    server!.defineScenario({
      method: 'GET',
      path: '/v1/images/tasks/image-task-1',
      mode: 'success',
      submitResponse: {
        status: 200,
        body: {
          task_id: 'image-task-1',
          status: 'completed',
          image_url: 'https://cdn.example.test/image.png',
          result: { data: [{ url: 'https://cdn.example.test/image.png' }] },
        },
      },
    })

    const result = await executeSub2ApiImageGeneration({
      userId: 'test-user',
      providerConfig: {
        id: 'sub2api',
        name: 'Sub2API',
        apiKey: 'sub2api-test-key',
        baseUrl: `${server!.baseUrl}/v1`,
      },
      selection: {
        provider: 'sub2api',
        modelId: 'gpt-image-2',
        modelKey: 'sub2api::gpt-image-2',
        type: 'image',
      },
      prompt: 'draw a test icon',
      options: {
        imageSize: { width: 2048, height: 2048 },
        quality: 'high',
        outputFormat: 'png',
      },
    } as unknown as AiProviderImageExecutionContext)

    expect(result).toEqual({
      success: true,
      async: true,
      requestId: 'image-task-1',
      endpoint: 'images/generations/async',
      externalId: 'SUB2API:IMAGE:image-task-1',
    })
    const requests = server!.getRequests('POST', '/v1/images/generations/async')
    expect(requests).toHaveLength(1)
    expect(requests[0]?.headers.authorization).toBe('Bearer sub2api-test-key')
    expect(JSON.parse(requests[0]?.bodyText || '{}')).toEqual({
      model: 'gpt-image-2',
      prompt: 'draw a test icon',
      n: 1,
      size: '2048x2048',
      quality: 'high',
      output_format: 'png',
      response_format: 'b64_json',
    })

    await expect(querySub2ApiImageStatus({
      baseUrl: `${server!.baseUrl}/v1`,
      apiKey: 'sub2api-test-key',
      requestId: 'image-task-1',
    })).resolves.toEqual({
      status: 'completed',
      imageUrl: 'https://cdn.example.test/image.png',
      resultUrl: 'https://cdn.example.test/image.png',
    })
  })

  it('submits and polls a native video request without exposing credentials in the result', async () => {
    server!.defineScenario({
      method: 'POST',
      path: '/v1/videos',
      mode: 'success',
      submitResponse: { status: 202, body: { id: 'video-request-1', status: 'queued' } },
    })
    server!.defineScenario({
      method: 'GET',
      path: '/v1/videos/video-request-1',
      mode: 'success',
      submitResponse: {
        status: 200,
        body: { status: 'completed', video_url: 'https://cdn.example.test/result.mp4' },
      },
    })

    const submitted = await executeSub2ApiVideoGeneration({
      userId: 'test-user',
      providerConfig: {
        id: 'sub2api',
        name: 'Sub2API',
        apiKey: 'sub2api-test-key',
        baseUrl: `${server!.baseUrl}/v1`,
      },
      selection: {
        provider: 'sub2api',
        modelId: 'seedance20',
        modelKey: 'sub2api::seedance20',
        type: 'video',
      },
      imageUrl: '',
      options: {
        prompt: 'camera pushes through clouds',
        duration: 5,
        resolution: '720p',
        aspectRatio: '16:9',
        generateAudio: true,
      },
    } as unknown as AiProviderVideoExecutionContext)

    expect(submitted).toEqual({
      success: true,
      async: true,
      requestId: 'video-request-1',
      endpoint: 'videos',
      externalId: 'SUB2API:VIDEO:video-request-1',
    })
    expect(JSON.parse(server!.getRequests('POST', '/v1/videos')[0]?.bodyText || '{}')).toEqual({
      model: 'seedance20',
      prompt: 'camera pushes through clouds',
      duration: 5,
      resolution: '720p',
      aspect_ratio: '16:9',
      generate_audio: true,
    })

    await expect(querySub2ApiVideoStatus({
      baseUrl: `${server!.baseUrl}/v1`,
      apiKey: 'sub2api-test-key',
      requestId: 'video-request-1',
    })).resolves.toEqual({
      status: 'completed',
      videoUrl: 'https://cdn.example.test/result.mp4',
      resultUrl: 'https://cdn.example.test/result.mp4',
      downloadHeaders: undefined,
    })
  })
})
