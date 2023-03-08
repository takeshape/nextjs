import * as dotenv from 'dotenv'
import { BuildEnv, LogLevel } from './types.js'

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
  env: 'local' | 'build' | 'ci'
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

  if (!projectId) {
    throw new Error('NEXT_PUBLIC_TAKESHAPE_API_URL is invalid')
  }

  let env: Config['env'] = 'local'

  if (process.env['VERCEL_ENV'] || process.env['NETLIFY']) {
    env = 'build'
  }

  if (process.env['GITHUB_ACTION']) {
    env = 'ci'
  }

  config = {
    apiKey,
    apiUrl,
    env,
    logLevel,
    projectId,
  }

  return config
}

type BuildConfig = {
  service: 'vercel' | 'netlify'
  buildEnv: BuildEnv
  gitCommitRef: string
  gitCommitSha: string
}

export function getBuildConfig(): BuildConfig {
  if (process.env['VERCEL_ENV']) {
    return {
      service: 'vercel',
      buildEnv: process.env['VERCEL_ENV'] as BuildEnv,
      gitCommitRef: assertEnv('VERCEL_GIT_COMMIT_REF'),
      gitCommitSha: assertEnv('VERCEL_GIT_COMMIT_SHA'),
    }
  }

  if (process.env['NETLIFY']) {
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

    return {
      service: 'netlify',
      buildEnv,
      gitCommitRef: assertEnv('HEAD'),
      gitCommitSha: assertEnv('COMMIT_REF'),
    }
  }

  throw new Error(`Can only be called in 'build' environments`)
}

type CiConfig = {
  service: 'github'
  gitCommitRef: string
  gitCommitSha: string
}

export function getCiConfig(): CiConfig {
  if (process.env['GITHUB_ACTION']) {
    return {
      service: 'github',
      gitCommitRef: assertEnv('GITHUB_REF_NAME'),
      gitCommitSha: assertEnv('GITHUB_SHA'),
    }
  }

  throw new Error(`Can only be called in 'ci' environments`)
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
