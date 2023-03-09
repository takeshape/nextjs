import { DEVELOPMENT, PRODUCTION } from './constants.js'

export type Branch = {
  branchName?: string
  environment: typeof PRODUCTION | typeof DEVELOPMENT
}

export type BranchWithUrl = Branch & {
  graphqlUrl: string
}

export type BranchWithLatestVersion = BranchWithUrl & {
  latestVersion: BranchWithUrl & {
    version: number
  }
}

export type DevelopmentBranch = Required<Branch>

export type DevelopmentBranchWithUrl = DevelopmentBranch & {
  graphqlUrl: string
}

export type BranchArgs = Branch & {
  projectId: string
}

export type Env = 'local' | 'vercel' | 'netlify' | 'github'
export type BuildEnv = 'production' | 'preview' | 'development'

export type LogLevel = 20 | 30 | 50

export type CliFlags = {
  name?: string
  lookupPr?: boolean
  tty?: boolean
  productionOnly?: boolean
}
