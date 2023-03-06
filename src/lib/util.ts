import chalk from 'chalk'
import * as dotenv from 'dotenv'

function getProjectId(apiUrl: string) {
  return apiUrl.match(/project\/([a-z0-9-]+)/)?.[1]
}

type Config = {
  apiKey: string
  apiUrl: string
  projectId: string
  vercelEnv: string | undefined
  vercelGitCommitRef: string | undefined
  vercelGitCommitSha: string | undefined
}

let config: Config

export function getConfig() {
  if (config) {
    return config
  }

  dotenv.config()
  dotenv.config({ path: '.env.local' })

  const apiUrl = process.env['NEXT_PUBLIC_TAKESHAPE_API_URL']

  if (!apiUrl) {
    throw new Error('NEXT_PUBLIC_TAKESHAPE_API_URL is not set')
  }

  const projectId = getProjectId(apiUrl)

  if (!projectId) {
    throw new Error('NEXT_PUBLIC_TAKESHAPE_API_URL is invalid')
  }

  const apiKey = process.env['TAKESHAPE_API_KEY']

  if (!apiKey) {
    throw new Error('TAKESHAPE_API_KEY is not set')
  }

  const vercelEnv = process.env['VERCEL_ENV']
  const vercelGitCommitRef = process.env['VERCEL_GIT_COMMIT_REF']
  const vercelGitCommitSha = process.env['VERCEL_GIT_COMMIT_SHA']

  config = {
    apiKey,
    apiUrl,
    projectId,
    vercelEnv,
    vercelGitCommitRef,
    vercelGitCommitSha,
  }

  return config
}

export const logPrefix = `${chalk.cyan('takeshape')} -`

export function logWithPrefix(msg: string) {
  // eslint-disable-next-line no-console
  console.log(`${logPrefix} ${msg}`)
}
