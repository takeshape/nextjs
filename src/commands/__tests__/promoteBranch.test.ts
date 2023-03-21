import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Client, getClient } from '../../lib/client'
import { ConfigOptions, CoreConfig, ensureCoreConfig, getBuildEnv } from '../../lib/config'
import { ADMIN_URL, DEVELOPMENT, PRODUCTION } from '../../lib/constants'
import { getHeadRefFromCommitPullsList } from '../../lib/github'
import { log } from '../../lib/log'
import { getCommitInfo, isDefaultBranch } from '../../lib/repo'
import { BranchWithUrl } from '../../lib/types'
import { handler as promoteBranch } from '../promoteBranch'

vi.mock('../../lib/process.js')
vi.mock('../../lib/config.js')
vi.mock('../../lib/repo.js')
vi.mock('../../lib/log.js')
vi.mock('../../lib/client.js')
vi.mock('../../lib/github.js')
vi.mock('../../lib/config.js', async () => {
  return {
    getConfig: vi.fn(),
    ensureCoreConfig: vi.fn(),
    getBuildEnv: vi.fn(),
  }
})

describe('promoteBranch', () => {
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
        githubToken: 'token',
        noTtyShouldPromoteBranch: true,
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

  it('exits when productionOnly is set and the buildEnv is preview', async () => {
    vi.mocked(getBuildEnv).mockReturnValueOnce('preview')

    await promoteBranch({ name: branchName, productionOnly: true, lookupPr: false })

    expect(log.info).toHaveBeenCalledWith(`Not a 'production' environment, skipping`)
  })

  it('does not exit when productionOnly is not set and the buildEnv is preview', async () => {
    vi.mocked(getBuildEnv).mockReturnValueOnce('preview')

    await promoteBranch({ name: branchName, productionOnly: false, lookupPr: false })

    expect(log.info).toHaveBeenCalledWith('Promoting API branch...')
  })

  it('does not have enough info to look up a pr', async () => {
    vi.mocked(getCommitInfo).mockResolvedValue({ ...commitInfo, gitCommitSha: undefined })

    await promoteBranch({ productionOnly: false, lookupPr: true })

    expect(log.debug).toHaveBeenCalledWith(`Using lookupPr`, {
      ...commitInfo,
      gitCommitSha: undefined,
    })
    expect(log.error).toHaveBeenCalledWith(`Insufficient info to find a pull request branch`)
  })

  it('looks up a pr but cannot find a ref', async () => {
    vi.mocked(getHeadRefFromCommitPullsList).mockResolvedValueOnce(undefined)

    await promoteBranch({ productionOnly: false, lookupPr: true })

    expect(log.debug).toHaveBeenCalledWith(`Using lookupPr`, commitInfo)
    expect(log.error).toHaveBeenCalledWith(`Could not find an associated pull request branch`)
  })

  it('looks up a pr and uses the head ref as the branchName and then promotes it', async () => {
    const version = 42

    vi.mocked(getHeadRefFromCommitPullsList).mockResolvedValueOnce(branchName)
    vi.mocked(client.getBranch).mockResolvedValueOnce({
      environment: PRODUCTION,
      branchName: undefined,
      graphqlUrl: branch.graphqlUrl,
      latestVersion: {
        environment: PRODUCTION,
        branchName: undefined,
        graphqlUrl: branch.graphqlUrl,
        version,
      },
    })

    vi.mocked(client.mergeBranch).mockResolvedValueOnce({
      deletedBranch: {
        environment: DEVELOPMENT,
        branchName,
      },
      mergedBranch: branch,
    })

    await promoteBranch({ productionOnly: false, lookupPr: true })

    expect(log.debug).toHaveBeenCalledWith(`Using lookupPr`, commitInfo)
    expect(log.debug).toHaveBeenCalledWith(`Proceeding with branchName:`, branchName)
    expect(log.info).toHaveBeenCalledWith('Promoting API branch...')

    expect(client.getBranch).toHaveBeenCalledWith({
      projectId,
      environment: PRODUCTION,
    })

    expect(client.mergeBranch).toHaveBeenCalledWith({
      input: {
        projectId,
        deleteMergedHead: true,
        head: {
          environment: DEVELOPMENT,
          branchName,
        },
        base: {
          environment: PRODUCTION,
        },
        target: {
          environment: PRODUCTION,
          version,
        },
      },
    })

    expect(log.info).toHaveBeenCalledWith(`Promoted and deleted the API branch '${branchName}'`)
  })

  it('bails if it could not get the production branch', async () => {
    vi.mocked(client.getBranch).mockResolvedValueOnce(undefined)

    await promoteBranch({ name: branchName, productionOnly: false, lookupPr: false })

    expect(log.error).toHaveBeenCalledWith(
      `Cannot promote the branch, could not get latest version`,
    )
  })

  it('does not promote for some reason', async () => {
    const version = 42
    vi.mocked(client.getBranch).mockResolvedValueOnce({
      environment: PRODUCTION,
      branchName: undefined,
      graphqlUrl: branch.graphqlUrl,
      latestVersion: {
        environment: PRODUCTION,
        branchName: undefined,
        graphqlUrl: branch.graphqlUrl,
        version,
      },
    })

    await promoteBranch({ name: branchName, productionOnly: false, lookupPr: false })

    expect(log.debug).toHaveBeenCalledWith(`Using name`, branchName)
    expect(log.debug).toHaveBeenCalledWith(`Proceeding with branchName:`, branchName)
    expect(log.info).toHaveBeenCalledWith('Promoting API branch...')
    expect(log.info).toHaveBeenCalledWith(`No API branches were promoted`)
  })

  it('can create an api branch using info from git', async () => {
    const version = 42

    vi.mocked(client.getBranch).mockResolvedValueOnce({
      environment: PRODUCTION,
      branchName: undefined,
      graphqlUrl: branch.graphqlUrl,
      latestVersion: {
        environment: PRODUCTION,
        branchName: undefined,
        graphqlUrl: branch.graphqlUrl,
        version,
      },
    })

    vi.mocked(client.mergeBranch).mockResolvedValueOnce({
      deletedBranch: {
        environment: DEVELOPMENT,
        branchName,
      },
      mergedBranch: branch,
    })

    await promoteBranch({ productionOnly: false, lookupPr: false })

    expect(log.debug).toHaveBeenCalledWith(`Using found gitCommitRef`, commitInfo.gitCommitRef)
    expect(log.info).toHaveBeenCalledWith(`Promoted and deleted the API branch '${branchName}'`)
  })

  it('does not try to promote a default branch', async () => {
    vi.mocked(isDefaultBranch).mockReturnValueOnce(true)
    await promoteBranch({ productionOnly: false, lookupPr: false })
    expect(log.info).toHaveBeenCalledWith(`Cannot promote the default branch`)
  })
})
