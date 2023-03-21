import { ADMIN_URL } from './constants.js'
import { BuildEnv, Env, LogLevel } from './types.js'
import { isInteractive, isValidUrl } from './util.js'

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

function toBoolean(envVar: string) {
  return envVar === 'true' || envVar === '1'
}

export type Config = {
  adminUrl: string
  apiKey?: string
  apiUrl?: string
  env: Env
  githubToken?: string
  logLevel: LogLevel
  noTtyShouldCreateBranch: boolean
  noTtyShouldPromoteBranch: boolean
  promptCreateBranch: boolean
  promptPromoteBranch: boolean
  projectId?: string
  tty: boolean
}

export type ConfigOptions = {
  flags?: {
    debug?: boolean
    tty?: boolean
  }
}

let config: Config

export function getConfig(options: ConfigOptions = {}) {
  if (config) {
    return config
  }

  const { flags } = options

  const adminUrl = process.env['SHAPE_ADMIN_URL'] ?? ADMIN_URL
  const apiKey = process.env['SHAPE_API_KEY'] ?? process.env['TAKESHAPE_API_KEY']
  const apiUrl = process.env['SHAPE_API_URL'] ?? process.env['NEXT_PUBLIC_TAKESHAPE_API_URL']
  const projectId = apiUrl && getProjectId(apiUrl)
  const logLevel = flags?.debug ? getLogLevel('debug') : getLogLevel(process.env['SHAPE_LOG_LEVEL'])
  const githubToken = process.env['SHAPE_GITHUB_TOKEN'] ?? process.env['GITHUB_TOKEN']

  const rawNoTtyShouldCreateBranch = process.env['NO_TTY_SHOULD_CREATE_BRANCH']
  const noTtyShouldCreateBranch =
    rawNoTtyShouldCreateBranch === undefined ? true : toBoolean(rawNoTtyShouldCreateBranch)

  const rawNoTtyShouldPromoteBranch = process.env['NO_TTY_SHOULD_PROMOTE_BRANCH']
  const noTtyShouldPromoteBranch =
    rawNoTtyShouldPromoteBranch === undefined ? true : toBoolean(rawNoTtyShouldPromoteBranch)

  const rawNoPromptCreateBranch = process.env['NO_PROMPT_CREATE_BRANCH']
  const promptCreateBranch =
    rawNoPromptCreateBranch === undefined ? true : !toBoolean(rawNoPromptCreateBranch)

  const rawNoPromptPromoteBranch = process.env['NO_PROMPT_PROMOTE_BRANCH']
  const promptPromoteBranch =
    rawNoPromptPromoteBranch === undefined ? true : !toBoolean(rawNoPromptPromoteBranch)

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
    adminUrl,
    apiKey,
    apiUrl,
    env,
    githubToken,
    logLevel,
    noTtyShouldCreateBranch,
    noTtyShouldPromoteBranch,
    projectId,
    promptCreateBranch,
    promptPromoteBranch,
    tty: flags?.tty ?? isInteractive(),
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

export type CoreConfig = Config &
  Required<Pick<Config, 'adminUrl' | 'apiKey' | 'env' | 'projectId'>>

export function ensureCoreConfig(options: ConfigOptions = {}): CoreConfig {
  const { adminUrl, apiKey, env, projectId, ...config } = getConfig(options)

  if (!isValidUrl(adminUrl)) {
    throw new Error('Invalid adminUrl')
  }

  if (!projectId) {
    throw new Error('No projectId found, check your API url')
  }

  if (!apiKey) {
    throw new Error('No API key found')
  }

  return { ...config, adminUrl, apiKey, env, projectId }
}
