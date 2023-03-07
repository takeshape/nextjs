import chalk from 'chalk'
import * as dotenv from 'dotenv'

function getProjectId(apiUrl: string) {
  return apiUrl.match(/project\/([a-z0-9-]+)/)?.[1]
}

type Config = {
  apiKey: string | undefined
  apiUrl: string
  buildEnv: string | undefined
  buildGitCommitRef: string | undefined
  buildGitCommitSha: string | undefined
  buildService: 'netlify' | 'vercel' | 'github' | undefined
  projectId: string
}

let config: Config

export function getConfig() {
  if (config) {
    return config
  }

  dotenv.config()
  dotenv.config({ path: '.env.local' })

  const apiKey = process.env['TAKESHAPE_API_KEY']

  const apiUrl = process.env['NEXT_PUBLIC_TAKESHAPE_API_URL']

  if (!apiUrl) {
    throw new Error('NEXT_PUBLIC_TAKESHAPE_API_URL is not set')
  }

  const projectId = getProjectId(apiUrl)

  if (!projectId) {
    throw new Error('NEXT_PUBLIC_TAKESHAPE_API_URL is invalid')
  }

  let buildService: Config['buildService']
  let buildEnv
  let buildGitCommitRef
  let buildGitCommitSha

  if (process.env['VERCEL_ENV']) {
    buildService = 'vercel'
    buildEnv = process.env['VERCEL_ENV']
    buildGitCommitRef = process.env['VERCEL_GIT_COMMIT_REF']
    buildGitCommitSha = process.env['VERCEL_GIT_COMMIT_SHA']
  }

  if (process.env['NETLIFY']) {
    buildService = 'netlify'
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

  if (process.env['GITHUB_ACTION']) {
    buildService = 'github'
    buildGitCommitRef = process.env['GITHUB_REF_NAME']
    buildGitCommitSha = process.env['GITHUB_SHA']
  }

  config = {
    apiKey,
    apiUrl,
    projectId,
    buildEnv,
    buildGitCommitRef,
    buildGitCommitSha,
    buildService,
  }

  return config
}

export const logPrefix = `${chalk.cyan('takeshape')} -`

export function logWithPrefix(msg: string) {
  // eslint-disable-next-line no-console
  console.log(`${logPrefix} ${msg}`)
}
