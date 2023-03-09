import { simpleGit } from 'simple-git'
import { DEFAULT_BRANCH_NAMES } from './constants.js'
import { Env } from './types.js'

export async function getDefaultBranches() {
  const git = simpleGit()

  const isRepo = await git.checkIsRepo()

  if (!isRepo) {
    return DEFAULT_BRANCH_NAMES
  }

  const remoteOrigin = await git.remote(['show', 'origin'])

  if (remoteOrigin) {
    const remoteHeadBranchName = remoteOrigin.match(/HEAD branch: (.*)/)?.[1]
    if (remoteHeadBranchName) {
      return [remoteHeadBranchName]
    }
  }

  return DEFAULT_BRANCH_NAMES
}

export async function getHeadBranchName() {
  const git = simpleGit()

  const isRepo = await git.checkIsRepo()

  if (!isRepo) {
    return
  }

  const headBranchName = await git.revparse(['--abbrev-ref', 'HEAD'])

  return headBranchName
}

export async function isDefaultBranch(branchName: string) {
  const defaultBranchNames = await getDefaultBranches()
  return defaultBranchNames.includes(branchName)
}

function getRepoInfoFromUrl(repoUrl: string) {
  const repoParts = repoUrl.split('/')
  const name = repoParts[repoParts.length - 1]?.replace(/\.git$/, '')
  const owner = repoParts[repoParts.length - 2]

  return {
    name,
    owner,
  }
}

export type CommitInfo = {
  gitCommitRef: string | undefined
  gitCommitSha: string | undefined
  gitRepoName: string | undefined
  gitRepoOwner: string | undefined
}

export async function getCommitInfo(env: Env): Promise<CommitInfo> {
  if (env === 'vercel') {
    return {
      gitCommitRef: process.env['VERCEL_GIT_COMMIT_REF'],
      gitCommitSha: process.env['VERCEL_GIT_COMMIT_SHA'],
      gitRepoName: process.env['VERCEL_GIT_REPO_SLUG'],
      gitRepoOwner: process.env['VERCEL_GIT_REPO_OWNER'],
    }
  }

  if (env === 'netlify') {
    const repoUrl = process.env['REPOSITORY_URL']

    let gitRepoName
    let gitRepoOwner

    if (repoUrl) {
      const { name, owner } = getRepoInfoFromUrl(repoUrl)
      gitRepoName = name
      gitRepoOwner = owner
    }

    return {
      gitCommitRef: process.env['HEAD'],
      gitCommitSha: process.env['COMMIT_REF'],
      gitRepoName,
      gitRepoOwner,
    }
  }

  if (env === 'github') {
    const [gitRepoOwner, gitRepoName] = process.env['GITHUB_REPOSITORY']?.split('/') ?? []

    return {
      gitCommitRef: process.env['GITHUB_REF_NAME'],
      gitCommitSha: process.env['GITHUB_SHA'],
      gitRepoName,
      gitRepoOwner,
    }
  }

  const git = simpleGit()

  const isRepo = await git.checkIsRepo()

  if (!isRepo) {
    return {
      gitCommitRef: undefined,
      gitCommitSha: undefined,
      gitRepoName: undefined,
      gitRepoOwner: undefined,
    }
  }

  const repoUrl = await git.getConfig('remote.origin.url')

  let gitRepoName
  let gitRepoOwner

  if (repoUrl.value) {
    const { name, owner } = getRepoInfoFromUrl(repoUrl.value)
    gitRepoName = name
    gitRepoOwner = owner
  }

  const gitCommitRef = await git.revparse(['--abbrev-ref', 'HEAD'])
  const gitCommitSha = await git.revparse(['HEAD'])

  return {
    gitCommitRef,
    gitCommitSha,
    gitRepoName,
    gitRepoOwner,
  }
}
