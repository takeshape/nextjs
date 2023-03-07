import { getClient } from './client.js'
import { DEVELOPMENT_ENUM, PRODUCTION_ENUM } from './constants.js'
import { getBranchInfo } from './repo.js'
import { ApiBranch } from './types.js'
import { getConfig, logWithPrefix as log } from './util.js'

const { projectId, buildEnv, buildGitCommitRef, buildGitCommitSha } = getConfig()

export async function getBranchForDevelopment(): Promise<ApiBranch | undefined> {
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

export async function tagBranchForDeployment(): Promise<ApiBranch | undefined> {
  const takeshape = getClient()

  if (buildEnv === 'production') {
    const result = await takeshape.tagBranch({
      input: {
        projectId,
        environment: PRODUCTION_ENUM,
        tagName: buildGitCommitSha,
      },
    })

    return result?.branchVersion
  }

  try {
    const result = await takeshape.tagBranch({
      input: {
        projectId,
        environment: DEVELOPMENT_ENUM,
        branchName: buildGitCommitRef,
        tagName: buildGitCommitSha,
      },
    })

    return result?.branchVersion
  } catch {
    // Just eat the error
    return
  }
}

export async function setProcessBranchUrl(): Promise<string | undefined> {
  log('Getting branch url...')

  let branch

  if (buildEnv) {
    branch = await tagBranchForDeployment()
    if (!branch) {
      log('Branch was not tagged. Review your config if this is unexpected.')
    }
  } else {
    branch = await getBranchForDevelopment()
  }

  if (branch) {
    log(`Found API branch '${branch.branchName}'`)
    process.env['NEXT_PUBLIC_BRANCH_TAKESHAPE_API_URL'] = branch.graphqlUrl
    return branch.graphqlUrl
  }

  log('Using default production API branch')

  return
}
