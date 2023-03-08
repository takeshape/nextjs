import { simpleGit } from 'simple-git'
import { DEFAULT_BRANCH_NAMES } from './constants.js'

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
