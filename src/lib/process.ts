import { getBranchForLocal, tagBranchForBuild } from './branches.js'
import { getClient } from './client.js'
import { getConfig } from './config.js'
import { log } from './log.js'

export async function setProcessBranchUrl(
  { envVar } = { envVar: 'NEXT_PUBLIC_BRANCH_TAKESHAPE_API_URL' },
): Promise<string | undefined> {
  const { apiKey, env } = getConfig()

  if (!apiKey) {
    log.error('No API key found')
    return
  }

  log.info('Getting branch url...')

  const client = getClient({ apiKey })

  let branch

  log.debug('Using env:', env)

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
    process.env[envVar] = branch.graphqlUrl
    return branch.graphqlUrl
  }

  log.info(`Using default 'production' API branch`)

  return
}
