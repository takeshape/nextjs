import { Client, getClient, TagBranchMutationVariables } from './client.js'
import { DEVELOPMENT, PRODUCTION } from './constants.js'
import { getDefaultBranches, getHeadBranchName } from './repo.js'
import { BranchWithUrl } from './types.js'
import { getBuildConfig, getCiConfig, getConfig, logWithPrefix as log } from './util.js'

const { apiKey, projectId, env } = getConfig()

export async function isDefaultBranch(branchName: string) {
  const defaultBranchNames = await getDefaultBranches()
  return defaultBranchNames.includes(branchName)
}

export async function getBranchForLocal(client: Client): Promise<BranchWithUrl | undefined> {
  const headBranchName = await getHeadBranchName()

  if (!headBranchName) {
    return
  }

  if (await isDefaultBranch(headBranchName)) {
    // Default branch, do not need a branch URL
    return
  }

  return client.getBranch({
    projectId,
    environment: DEVELOPMENT,
    branchName: headBranchName,
  })
}

export async function tagBranchForBuild(client: Client): Promise<BranchWithUrl | undefined> {
  const { buildEnv, gitCommitRef, gitCommitSha } = getBuildConfig()

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

export async function tagBranchForCi(client: Client): Promise<BranchWithUrl | undefined> {
  const { gitCommitRef, gitCommitSha } = getCiConfig()

  const result = await client.tagBranch({
    input: {
      projectId,
      environment: DEVELOPMENT,
      branchName: gitCommitRef,
      tagName: gitCommitSha,
    },
  })

  return result?.branchVersion
}

export async function setProcessBranchUrl(): Promise<string | undefined> {
  if (!apiKey) {
    log('TAKESHAPE_API_KEY not set')
    return
  }

  log('Getting branch url...')

  const client = getClient({ apiKey })

  let branch

  if (env === 'build') {
    branch = await tagBranchForBuild(client)
    if (!branch) {
      log('Branch was not tagged. Review your config if this is unexpected.')
    }
  }

  if (env === 'ci') {
    branch = await tagBranchForCi(client)
    if (!branch) {
      log('Branch was not tagged. Review your config if this is unexpected.')
    }
  }

  if (env === 'local') {
    branch = await getBranchForLocal(client)
  }

  if (branch) {
    log(`Found API branch '${branch.branchName}'`)
    process.env['NEXT_PUBLIC_BRANCH_TAKESHAPE_API_URL'] = branch.graphqlUrl
    return branch.graphqlUrl
  }

  log(`Using default 'production' API branch`)

  return
}
