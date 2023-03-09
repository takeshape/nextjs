import { Client, getClient, TagBranchMutationVariables } from './client.js'
import { getBuildEnv, getConfig } from './config.js'
import { DEVELOPMENT, PRODUCTION } from './constants.js'
import { log } from './log.js'
import { getCommitInfo, isDefaultBranch } from './repo.js'
import { BranchWithUrl } from './types.js'

const { apiKey, projectId, env } = getConfig()

export async function getBranchForLocal(client: Client): Promise<BranchWithUrl | undefined> {
  const { gitCommitRef } = await getCommitInfo(env)

  if (!gitCommitRef) {
    return
  }

  if (await isDefaultBranch(gitCommitRef)) {
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

  const result = await client.tagBranch(variables)

  return result?.branchVersion
}

export async function setProcessBranchUrl(): Promise<string | undefined> {
  if (!apiKey) {
    log.error('TAKESHAPE_API_KEY not set')
    return
  }

  log.info('Getting branch url...')

  const client = getClient({ apiKey })

  let branch

  if (env === 'local') {
    branch = await getBranchForLocal(client)
  } else {
    branch = await tagBranchForBuild(client)
    if (!branch) {
      log.info('Branch was not tagged. Review your config if this is unexpected.')
    }
  }

  if (branch) {
    log.info(`Found API branch '${branch.branchName}'`)
    process.env['NEXT_PUBLIC_BRANCH_TAKESHAPE_API_URL'] = branch.graphqlUrl
    return branch.graphqlUrl
  }

  log.info(`Using default 'production' API branch`)

  return
}
