import * as dotenv from 'dotenv'
import { BuildEnv, Env, LogLevel } from './types.js'

function assertEnv(name: string): string {
  const value = process.env[name]

  if (value === undefined) {
    throw new Error(`${name} is not defined`)
  }

  return value
}

type Config = {
  apiKey: string | undefined
  apiUrl: string
  env: Env
  githubToken: string | undefined
  logLevel: LogLevel
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
  const apiUrl = assertEnv('NEXT_PUBLIC_TAKESHAPE_API_URL')
  const projectId = getProjectId(apiUrl)
  const logLevel = getLogLevel(process.env['TAKESHAPE_LOG_LEVEL'])
  const githubToken = process.env['GITHUB_TOKEN']

  if (!projectId) {
    throw new Error('NEXT_PUBLIC_TAKESHAPE_API_URL is invalid')
  }

  let env: Config['env'] = 'local'

  if (process.env['NETLIFY']) {
    env = 'vercel'
  }

  if (process.env['VERCEL_ENV']) {
    env = 'netlify'
  }

  if (process.env['GITHUB_ACTION']) {
    env = 'github'
  }

  config = {
    apiKey,
    apiUrl,
    env,
    githubToken,
    logLevel,
    projectId,
  }

  return config
}

export function getBuildEnv(env: Env): BuildEnv | undefined {
  if (env === 'vercel') {
    return process.env['VERCEL_ENV'] as BuildEnv
  }

  if (env === 'netlify') {
    let buildEnv: BuildEnv

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

    return buildEnv
  }

  return
}

function getProjectId(apiUrl: string) {
  return apiUrl.match(/project\/([a-z0-9-]+)/)?.[1]
}

function getLogLevel(logLevel: string | undefined): LogLevel {
  switch (logLevel) {
    case 'error':
      return 50
    case 'debug':
      return 20
    case 'info':
    default:
      return 30
  }
}
