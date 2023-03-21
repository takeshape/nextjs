import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getBranchForLocal, tagBranchForBuild } from '../../lib/branches'
import { Config, ConfigOptions, getConfig } from '../../lib/config'
import { ADMIN_URL, DEVELOPMENT } from '../../lib/constants'
import { BranchWithUrl } from '../../lib/types'
import { handler as getBranchUrl } from '../getBranchUrl'

vi.mock('../../lib/branches.js')
vi.mock('../../lib/log.js')
vi.mock('../../lib/config.js')

describe('getBranchUrl', () => {
  const branchName = 'some_branch'

  const branch: BranchWithUrl = {
    environment: DEVELOPMENT,
    branchName,
    graphqlUrl: 'https://api.takeshape.io/graphql',
  }

  const adminUrl = ADMIN_URL
  const projectId = 'project-id'
  const env = 'local'
  const apiKey = 'api-key'
  const apiUrl = 'https://takeshape'

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  function mockConfig(config: Partial<Config>) {
    vi.mocked(getConfig).mockImplementationOnce(({ flags }: ConfigOptions = {}) => {
      return {
        adminUrl,
        apiKey,
        env,
        apiUrl,
        projectId,
        ...flags,
        ...config,
      } as Config
    })
  }

  it('gets a branch in the local env', async () => {
    mockConfig({})
    vi.mocked(getBranchForLocal).mockResolvedValueOnce(branch)

    const branchUrl = await getBranchUrl({})

    expect(branchUrl).toEqual(branch.graphqlUrl)
    expect(getBranchForLocal).toHaveBeenCalled()
  })

  it('gets a branch in a vercel env', async () => {
    mockConfig({ env: 'vercel' })
    vi.mocked(tagBranchForBuild).mockResolvedValueOnce(branch)

    const branchUrl = await getBranchUrl({})

    expect(branchUrl).toEqual(branch.graphqlUrl)
    expect(tagBranchForBuild).toHaveBeenCalled()
  })

  it('returns the apiUrl when no branch is found', async () => {
    mockConfig({})
    vi.mocked(getBranchForLocal).mockResolvedValueOnce(undefined)

    const branchUrl = await getBranchUrl({})

    expect(branchUrl).toEqual(apiUrl)
    expect(getBranchForLocal).toHaveBeenCalled()
  })

  it('returns the apiUrl when there is no apiKey', async () => {
    mockConfig({ apiKey: undefined })

    const branchUrl = await getBranchUrl({})

    expect(branchUrl).toEqual(apiUrl)
  })

  it('returns the apiUrl when there is an error', async () => {
    mockConfig({})

    vi.mocked(getBranchForLocal).mockRejectedValueOnce('error')

    const branchUrl = await getBranchUrl({})

    expect(branchUrl).toEqual(apiUrl)
  })
})
