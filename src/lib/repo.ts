import { simpleGit } from 'simple-git'

export async function getBranchInfo() {
  const git = simpleGit()

  const isRepo = await git.checkIsRepo()

  if (!isRepo) {
    return
  }

  const headBranchName = await git.revparse(['--abbrev-ref', 'HEAD'])
  const remoteOrigin = await git.remote(['show', 'origin'])

  let defaultBranchNames = ['main', 'master']

  if (remoteOrigin) {
    const remoteHeadBranchName = remoteOrigin.match(/HEAD branch: (.*)/)?.[1]
    if (remoteHeadBranchName) {
      defaultBranchNames = [remoteHeadBranchName]
    }
  }

  const isDefaultBranch = defaultBranchNames.includes(headBranchName)

  return {
    headBranchName,
    remoteOrigin,
    isDefaultBranch,
  }
}
