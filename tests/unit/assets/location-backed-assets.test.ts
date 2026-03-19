import { beforeEach, describe, expect, it, vi } from 'vitest'

const prismaMock = vi.hoisted(() => ({
  $queryRaw: vi.fn(),
  $executeRaw: vi.fn(),
  $transaction: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

describe('location-backed assets service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$queryRaw
      .mockResolvedValueOnce([
        {
          id: 'location-1',
          novelPromotionProjectId: 'novel-project-1',
          name: 'Bronze Dagger',
          summary: 'Old bronze dagger',
          selectedImageId: null,
          sourceGlobalLocationId: null,
          assetKind: 'prop',
        },
      ])
      .mockResolvedValueOnce([])
  })

  it('queries project location-backed assets with real schema column names', async () => {
    const mod = await import('@/lib/assets/services/location-backed-assets')

    await mod.listProjectLocationBackedAssets('novel-project-1', 'prop')

    const assetQuery = prismaMock.$queryRaw.mock.calls[0]?.[0] as { strings?: ReadonlyArray<string>; sql?: string }
    const imageQuery = prismaMock.$queryRaw.mock.calls[1]?.[0] as { strings?: ReadonlyArray<string>; sql?: string }
    const assetSql = assetQuery.strings?.join(' ') ?? assetQuery.sql ?? ''
    const imageSql = imageQuery.strings?.join(' ') ?? imageQuery.sql ?? ''

    expect(assetSql).toContain('FROM novel_promotion_locations')
    expect(assetSql).toContain('novelPromotionProjectId')
    expect(assetSql).not.toContain('projectId')
    expect(imageSql).toContain('FROM location_images')
    expect(imageSql).toContain('NULL AS previousImageMediaId')
  })
})
