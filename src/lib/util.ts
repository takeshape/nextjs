import chalk from 'chalk'
import * as dotenv from 'dotenv'

function getProjectId(apiUrl: string) {
  return apiUrl.match(/project\/([a-z0-9-]+)/)?.[1]
}

type Config = {
  apiKey: string
  apiUrl: string
  projectId: string
  buildEnv: string | undefined
  buildGitCommitRef: string | undefined
  buildGitCommitSha: string | undefined
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

  let buildEnv
  let buildGitCommitRef
  let buildGitCommitSha

  if (process.env['VERCEL_ENV']) {
    buildEnv = process.env['VERCEL_ENV']
    buildGitCommitRef = process.env['VERCEL_GIT_COMMIT_REF']
    buildGitCommitSha = process.env['VERCEL_GIT_COMMIT_SHA']
  }

  if (process.env['NETLIFY']) {
    switch (process.env['CONTEXT']) {
      case 'deploy-preview':
        buildEnv = 'preview'
        break
      case 'dev':
        buildEnv = 'development'
        break
      default:
        // production
        // branch-deploy
        buildEnv = 'production'
    }

    buildGitCommitRef = process.env['HEAD']
    buildGitCommitSha = process.env['COMMIT_REF']
  }

  config = {
    apiKey,
    apiUrl,
    projectId,
    buildEnv,
    buildGitCommitRef,
    buildGitCommitSha,
  }

  return config
}

export const logPrefix = `${chalk.cyan('takeshape')} -`

export function logWithPrefix(msg: string) {
  // eslint-disable-next-line no-console
  console.log(`${logPrefix} ${msg}`)
}
