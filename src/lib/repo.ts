import { simpleGit } from 'simple-git'
import { DEFAULT_BRANCH_NAMES } from './constants.js'
import { Env } from './types.js'

function getDefaultBranches() {
  if (process.env['DEFAULT_BRANCH']) {
    // If using a different default branch name
    return [process.env['DEFAULT_BRANCH']]
  }

  return DEFAULT_BRANCH_NAMES
}

export function isDefaultBranch(branchName: string) {
  return getDefaultBranches().includes(branchName)
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

export async function getMergedBranchName() {
  const git = simpleGit()
  const isRepo = await git.checkIsRepo()

  if (!isRepo) {
    return
  }

  // e.g., 5d16682 HEAD@{0}: merge my_branch: Fast-forward
  const reflogMessage = await git.raw(['reflog', '-1'])
  // e.g., my_branch
  return reflogMessage.split(' ')[3]?.replace(/:$/, '')
}
