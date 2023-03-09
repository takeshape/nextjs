import { BuildEnv, Env, LogLevel } from './types.js'

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

type Config = {
  apiKey: string | undefined
  apiUrl: string | undefined
  env: Env
  githubToken: string | undefined
  logLevel: LogLevel
  projectId: string | undefined
}

let config: Config

export function getConfig() {
  if (config) {
    return config
  }

  const apiKey = process.env['API_KEY'] ?? process.env['TAKESHAPE_API_KEY']
  const apiUrl = process.env['API_URL'] ?? process.env['NEXT_PUBLIC_TAKESHAPE_API_URL']
  const projectId = apiUrl && getProjectId(apiUrl)
  const logLevel = getLogLevel(process.env['LOG_LEVEL'])
  const githubToken = process.env['GITHUB_TOKEN']

  if (apiUrl && !projectId) {
    throw new Error('API url is invalid')
  }

  let env: Config['env'] = 'local'

  if (process.env['VERCEL_ENV']) {
    env = 'vercel'
  }

  if (process.env['NETLIFY']) {
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
