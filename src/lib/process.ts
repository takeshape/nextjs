import { getBranchForLocal, getBranchName, tagBranchForBuild } from './branches.js'
import { getClient } from './client.js'
import { ensureCoreConfig, getConfig } from './config.js'
import { log } from './log.js'
import { BranchWithUrl } from './types.js'

export async function setProcessBranchUrl(
  { envVar } = { envVar: 'NEXT_PUBLIC_BRANCH_TAKESHAPE_API_URL' },
): Promise<string | undefined> {
  const { adminUrl, apiKey, env } = ensureCoreConfig()
  const { apiUrl } = getConfig()

  log.info('Getting branch url...')

  const client = getClient({ adminUrl, apiKey })

  let branch: BranchWithUrl | undefined

  log.debug('Using env:', env)

  if (env === 'local') {
    branch = await getBranchForLocal(client)
  } else {
    branch = await tagBranchForBuild(client)
    if (!branch) {
      log.info('Branch was not tagged. Review your config if this is unexpected.')
    }
  }

  let branchUrl: string | undefined

  if (branch) {
    log.info(`Setting API URL for branch '${getBranchName(branch)}'`)
    branchUrl = branch.graphqlUrl
  } else {
    log.info(`Using default API URL`)
    branchUrl = apiUrl
  }

  log.debug('Branch URL', branchUrl)

  if (branchUrl) {
    process.env[envVar] = branchUrl
  }

  return branchUrl
}

export function fatal(code = 1) {
  process.exit(code)
}
