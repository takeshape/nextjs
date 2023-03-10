import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Client, getClient } from '../../lib/client'
import { ensureCoreConfig } from '../../lib/config'
import { DEVELOPMENT } from '../../lib/constants'
import { log } from '../../lib/log'
import { getCommitInfo, isDefaultBranch } from '../../lib/repo'
import { BranchWithUrl } from '../../lib/types'
import { deleteBranch } from '../deleteBranch'

vi.mock('../../lib/process.js')
vi.mock('../../lib/config.js')
vi.mock('../../lib/repo.js')
vi.mock('../../lib/log.js')
vi.mock('../../lib/client.js')

describe('deleteBranch', () => {
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

  beforeEach(() => {
    vi.resetModules()
    vi.mocked(ensureCoreConfig).mockReturnValueOnce({
      apiKey,
      env,
      projectId,
    })
    vi.mocked(getCommitInfo).mockResolvedValue(commitInfo)
    vi.mocked(isDefaultBranch).mockReturnValue(false)
    client = getClient({ apiKey })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it.only('can create an api branch using a provided name', async () => {
    const branchName = 'my_branch'
    vi.mocked(client.deleteBranch).mockResolvedValueOnce({
      deletedBranch: { ...branch, branchName },
    })

    await deleteBranch({ name: branchName })

    expect(log.debug).toHaveBeenCalledWith('Using user-provided --name', branchName)
    expect(log.debug).toHaveBeenCalledWith('Proceeding with branchName:', branchName)
    expect(log.info).toHaveBeenCalledWith('Deleting API branch...')
    expect(isDefaultBranch).toHaveBeenCalledWith(branchName)
    expect(client.deleteBranch).toHaveBeenCalledWith({
      input: { projectId, environment: DEVELOPMENT, branchName },
    })
    expect(log.info).toHaveBeenCalledWith(`Deleted the API branch '${branchName}'`)
  })

  it('can create an api branch using info from git', async () => {
    const branchName = 'my_branch'
    vi.mocked(getCommitInfo).mockResolvedValueOnce({
      ...commitInfo,
      gitCommitRef: branchName,
    })
    vi.mocked(client.deleteBranch).mockResolvedValueOnce({
      deletedBranch: { ...branch, branchName },
    })

    await deleteBranch({})

    expect(log.debug).toHaveBeenCalledWith('Using found gitCommitRef', branchName)
    expect(log.info).toHaveBeenCalledWith(`Deleted the API branch '${branchName}'`)
  })

  it('does not create a branch sometimes', async () => {
    const branchName = 'my_branch'
    vi.mocked(getCommitInfo).mockResolvedValueOnce({
      ...commitInfo,
      gitCommitRef: branchName,
    })
    vi.mocked(client.deleteBranch).mockResolvedValueOnce(undefined)

    await deleteBranch({})

    expect(log.info).toHaveBeenCalledWith('Deleting API branch...')
    expect(log.info).toHaveBeenCalledWith(`No API branches were deleted`)
  })

  it('does not try to create a default branch', async () => {
    vi.mocked(isDefaultBranch).mockReturnValueOnce(true)
    await deleteBranch({})
    expect(log.info).toHaveBeenCalledWith(`Cannot delete the 'production' branch`)
  })

  it('errors with no branchName', async () => {
    vi.mocked(getCommitInfo).mockResolvedValueOnce({
      ...commitInfo,
      gitCommitRef: undefined,
    })
    await deleteBranch({})
    expect(log.error).toHaveBeenCalledWith('A --name arg must be provided if not used in a repo')
  })
})
