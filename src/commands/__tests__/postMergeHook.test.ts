import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Client, getClient } from '../../lib/client'
import { Config, CoreConfig, ensureCoreConfig, getConfig } from '../../lib/config'
import { DEVELOPMENT } from '../../lib/constants'
import { isDefaultBranch } from '../../lib/repo'
import { BranchWithLatestVersion } from '../../lib/types'
import { postMergeHook } from '../postMergeHook'
import { promoteBranch } from '../promoteBranch'

vi.mock('../promoteBranch.js')
vi.mock('../../lib/config.js')
vi.mock('../../lib/log.js')
vi.mock('../../lib/client.js')
vi.mock('../../lib/repo.js')

describe('postMergeHook', () => {
  const branchName = 'my_branch'

  const branch = {
    environment: DEVELOPMENT,
    branchName,
    graphqlUrl: 'https://api.takeshape.io/graphql',
  } as BranchWithLatestVersion

  let client: Client

  beforeEach(() => {
    vi.resetModules()

    const projectId = 'project-id'
    const env = 'local'
    const apiKey = 'api-key'

    vi.mocked(ensureCoreConfig).mockReturnValueOnce({
      apiKey,
      env,
      projectId,
    } as CoreConfig)

    vi.mocked(getConfig).mockReturnValueOnce({
      noTtyShouldPromoteBranch: true,
    } as Config)

    vi.mocked(isDefaultBranch).mockReturnValueOnce(false)

    client = getClient({ apiKey })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('can merge an api branch using a provided name', async () => {
    vi.mocked(client.getBranch).mockResolvedValueOnce(branch)

    await postMergeHook({ name: branchName, tty: false })

    expect(promoteBranch).toHaveBeenCalledWith({ name: branchName })
  })
})
