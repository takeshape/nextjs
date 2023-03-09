import { Client, TagBranchMutationVariables } from './client.js'
import { getBuildEnv, getConfig } from './config.js'
import { DEVELOPMENT, PRODUCTION } from './constants.js'
import { getCommitInfo, isDefaultBranch } from './repo.js'
import { BranchWithUrl } from './types.js'

export async function getBranchForLocal(client: Client): Promise<BranchWithUrl | undefined> {
  const { projectId, env } = getConfig()

  if (!projectId) {
    return
  }

  const { gitCommitRef } = await getCommitInfo(env)

  if (!gitCommitRef) {
    return
  }

  if (isDefaultBranch(gitCommitRef)) {
    // Default branch, do not need a branch URL
    return
  }

  return client.getBranch({
    projectId,
    environment: DEVELOPMENT,
    branchName: gitCommitRef,
  })
}

export async function tagBranchForBuild(client: Client): Promise<BranchWithUrl | undefined> {
  const { projectId, env } = getConfig()

  if (!projectId) {
    return
  }

  const buildEnv = getBuildEnv(env)
  const { gitCommitRef, gitCommitSha } = await getCommitInfo(env)

  if (!gitCommitSha) {
    return
  }

  let variables: TagBranchMutationVariables

  if (buildEnv === 'production') {
    variables = {
      input: {
        projectId,
        environment: PRODUCTION,
        branchName: undefined,
        tagName: gitCommitSha,
      },
    }
  } else {
    variables = {
      input: {
        projectId,
        environment: DEVELOPMENT,
        branchName: gitCommitRef,
        tagName: gitCommitSha,
      },
    }
  }

  try {
    const result = await client.tagBranch(variables)
    return result?.branchVersion
  } catch (error) {
    if (error instanceof Error && error.message === 'Could not create tag — branch not found') {
      // Swallow these, there won't always be branches and this is a noop
      return
    }

    throw error
  }
}
