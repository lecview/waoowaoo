import { describe, expect, it } from 'vitest'
import { supportsCodexResponsesWireApi } from '@/lib/codex-model-gateway/selection'

describe('Codex model gateway provider selection', () => {
  it('accepts any registered LLM provider that exposes the Responses wire API', () => {
    expect(supportsCodexResponsesWireApi('sub2api', 'gpt-5.6-sol')).toBe(true)
    expect(supportsCodexResponsesWireApi('openrouter', 'openai/gpt-5.6-sol')).toBe(true)
  })

  it('rejects models without a registered Responses capability', () => {
    expect(supportsCodexResponsesWireApi('sub2api', 'gpt-image-2')).toBe(false)
    expect(supportsCodexResponsesWireApi('unknown-provider', 'unknown-model')).toBe(false)
  })
})
