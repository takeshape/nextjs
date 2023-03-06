import { getClient } from './client.js'
import { DEVELOPMENT_ENUM, PRODUCTION_ENUM } from './constants.js'
import { getBranchInfo } from './repo.js'
import { getConfig, logWithPrefix as log } from './util.js'

const { projectId, vercelEnv, vercelGitCommitRef, vercelGitCommitSha } = getConfig()

export async function getBranchForLocal() {
  const branchInfo = await getBranchInfo()

  if (!branchInfo) {
    return
  }

  const takeshape = getClient()

  const { headBranchName, isDefaultBranch } = branchInfo

  if (isDefaultBranch) {
    // Default branch, do not need a branch URL
    return
  }

  return takeshape.getBranch({
    projectId,
    environment: DEVELOPMENT_ENUM,
    branchName: headBranchName,
  })
}

export async function tagBranchForVercel() {
  const takeshape = getClient()

  if (vercelEnv === 'production') {
    const result = await takeshape.tagBranch({
      input: {
        projectId,
        environment: PRODUCTION_ENUM,
        tagName: vercelGitCommitSha,
      },
    })

    return result?.branchVersion
  }

  try {
    const result = await takeshape.tagBranch({
      input: {
        projectId,
        environment: DEVELOPMENT_ENUM,
        branchName: vercelGitCommitRef,
        tagName: vercelGitCommitSha,
      },
    })

    return result?.branchVersion
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Could not create tag — branch not found') {
        // Eat these
        return
      }
    }

    throw error
  }
}

export async function setProcessBranchUrl() {
  log('Getting branch url...')

  let branch

  if (vercelEnv) {
    branch = await tagBranchForVercel()
  } else {
    branch = await getBranchForLocal()
  }

  if (branch) {
    log(`Found API branch '${branch.branchName}'`)
    process.env['NEXT_PUBLIC_BRANCH_TAKESHAPE_API_URL'] = branch.graphqlUrl
    return branch.graphqlUrl
  }

  log('Using default production API branch')

  return
}
