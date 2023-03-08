import { Client, getClient } from './client.js'
import { DEVELOPMENT, PRODUCTION } from './constants.js'
import { getDefaultBranches, getHeadBranchName } from './repo.js'
import { ApiBranch } from './types.js'
import { getConfig, logWithPrefix as log } from './util.js'

const { apiKey, projectId, buildEnv, buildGitCommitRef, buildGitCommitSha } = getConfig()

export async function isDefaultBranch(branchName: string) {
  const defaultBranchNames = await getDefaultBranches()
  return defaultBranchNames.includes(branchName)
}

export async function getBranchForDevelopment(client: Client): Promise<ApiBranch | undefined> {
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

export async function tagBranchForDeployment(client: Client): Promise<ApiBranch | undefined> {
  let variables

  if (buildEnv === 'production') {
    variables = {
      input: {
        projectId,
        environment: PRODUCTION,
        tagName: buildGitCommitSha,
      },
    }
  } else {
    variables = {
      input: {
        projectId,
        environment: DEVELOPMENT,
        branchName: buildGitCommitRef,
        tagName: buildGitCommitSha,
      },
    }
  }

  const result = await client.tagBranch(variables)

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

  if (buildEnv) {
    branch = await tagBranchForDeployment(client)
    if (!branch) {
      log('Branch was not tagged. Review your config if this is unexpected.')
    }
  } else {
    branch = await getBranchForDevelopment(client)
  }

  if (branch) {
    log(`Found API branch '${branch.branchName}'`)
    process.env['NEXT_PUBLIC_BRANCH_TAKESHAPE_API_URL'] = branch.graphqlUrl
    return branch.graphqlUrl
  }

  log('Using default production API branch')

  return
}
