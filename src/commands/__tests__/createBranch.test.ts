import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Client, getClient } from '../../lib/client'
import { ConfigOptions, CoreConfig, ensureCoreConfig } from '../../lib/config'
import { ADMIN_URL, DEVELOPMENT } from '../../lib/constants'
import { log } from '../../lib/log'
import { getCommitInfo, isDefaultBranch } from '../../lib/repo'
import { BranchWithUrl } from '../../lib/types'
import { handler as createBranch } from '../createBranch'

vi.mock('../../lib/process.js')
vi.mock('../../lib/config.js')
vi.mock('../../lib/repo.js')
vi.mock('../../lib/log.js')
vi.mock('../../lib/client.js')

describe('createBranch', () => {
  let client: Client

  const branchName = 'some_branch'

  const branch: BranchWithUrl = {
    environment: DEVELOPMENT,
    branchName,
    graphqlUrl: 'https://api.takeshape.io/graphql',
  }

  const commitInfo = {
    gitCommitRef: branchName,
    gitCommitSha: 'abc123',
    gitRepoName: 'bar',
    gitRepoOwner: 'foo',
  }

  const projectId = 'project-id'
  const env = 'local'
  const apiKey = 'api-key'
  const adminUrl = ADMIN_URL

  beforeEach(() => {
    vi.resetModules()
    vi.mocked(ensureCoreConfig).mockImplementationOnce(({ flags }: ConfigOptions = {}) => {
      return {
        adminUrl,
        apiKey,
        env,
        projectId,
        ...flags,
      } as CoreConfig
    })
    vi.mocked(getCommitInfo).mockResolvedValue(commitInfo)
    vi.mocked(isDefaultBranch).mockReturnValue(false)
    client = getClient({ adminUrl, apiKey })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('can create an api branch using a provided name', async () => {
    const branchName = 'my_branch'
    vi.mocked(client.createBranch).mockResolvedValueOnce({ branch: { ...branch, branchName } })

    await createBranch({ name: branchName })

    expect(log.debug).toHaveBeenCalledWith('Using name', branchName)
    expect(log.debug).toHaveBeenCalledWith('Proceeding with branchName:', branchName)
    expect(log.info).toHaveBeenCalledWith('Creating API branch...')
    expect(isDefaultBranch).toHaveBeenCalledWith(branchName)
    expect(client.createBranch).toHaveBeenCalledWith({
      input: { projectId, environment: DEVELOPMENT, branchName },
    })
    expect(log.info).toHaveBeenCalledWith(`Created a new API branch '${branchName}'`)
  })

  it('can create an api branch using info from git', async () => {
    const branchName = 'my_branch'
    vi.mocked(getCommitInfo).mockResolvedValueOnce({
      ...commitInfo,
      gitCommitRef: branchName,
    })
    vi.mocked(client.createBranch).mockResolvedValueOnce({ branch: { ...branch, branchName } })

    await createBranch({})

    expect(log.debug).toHaveBeenCalledWith('Using found gitCommitRef', branchName)
    expect(log.info).toHaveBeenCalledWith(`Created a new API branch '${branchName}'`)
  })

  it('does not create a branch sometimes', async () => {
    const branchName = 'my_branch'
    vi.mocked(getCommitInfo).mockResolvedValueOnce({
      ...commitInfo,
      gitCommitRef: branchName,
    })
    vi.mocked(client.createBranch).mockResolvedValueOnce(undefined)

    await createBranch({})

    expect(log.info).toHaveBeenCalledWith('Creating API branch...')
    expect(log.info).toHaveBeenCalledWith(`No API branches were created`)
  })

  it('does not try to create a default branch', async () => {
    vi.mocked(isDefaultBranch).mockReturnValueOnce(true)
    await createBranch({})
    expect(log.info).toHaveBeenCalledWith(`Default 'production' branch already exists`)
  })

  it('errors with no branchName', async () => {
    vi.mocked(getCommitInfo).mockResolvedValueOnce({
      ...commitInfo,
      gitCommitRef: undefined,
    })
    await createBranch({})
    expect(log.error).toHaveBeenCalledWith('A --name arg must be provided if not used in a repo')
  })
})
