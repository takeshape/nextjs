import { gql, GraphQLClient } from 'graphql-request'
import { ADMIN_URL } from './constants.js'
import { formatErrorMessage } from './errors.js'
import { log } from './log.js'
import {
  Branch,
  BranchArgs,
  BranchWithLatestVersion,
  BranchWithUrl,
  DevelopmentBranch,
  DevelopmentBranchWithUrl,
} from './types.js'

type GetBranchQueryPayload = {
  result: BranchWithLatestVersion
}

export const getBranchQuery = gql`
  query GetSchemaBranchQuery(
    $environment: TSSchemaBranchEnvironment!
    $branchName: String
    $projectId: String!
  ) {
    result: tsGetSchemaBranch(
      projectId: $projectId
      environment: $environment
      branchName: $branchName
    ) {
      environment
      branchName
      graphqlUrl
      latestVersion {
        branchName
        environment
        graphqlUrl
        version
      }
    }
  }
`

export type TagBranchMutationVariables = {
  input: BranchArgs & {
    tagName: string
  }
}

type TagBranchMutationPayload = {
  result: {
    branchVersion: BranchWithUrl
  }
}

export const tagBranchMutation = gql`
  mutation TagBranchMutation($input: TSCreateSchemaBranchTagInput!) {
    result: tsCreateSchemaBranchTag(input: $input) {
      branchVersion {
        environment
        branchName
        graphqlUrl
      }
    }
  }
`

type CreateBranchMutationVariables = {
  input: BranchArgs
}

type CreateBranchMutationPayload = {
  result: {
    branch: DevelopmentBranchWithUrl
  }
}

export const createBranchMutation = gql`
  mutation CreateBranchMutation($input: TSCreateSchemaBranchInput!) {
    result: tsCreateSchemaBranch(input: $input) {
      branch {
        environment
        branchName
        graphqlUrl
      }
    }
  }
`

type DeleteBranchMutationVariables = {
  input: BranchArgs
}

type DeleteBranchMutationPayload = {
  result: {
    deletedBranch: DevelopmentBranch
  }
}

export const deleteBranchMutation = gql`
  mutation DeleteBranchMutation($input: TSDeleteSchemaBranchInput!) {
    result: tsDeleteSchemaBranch(input: $input) {
      deletedBranch {
        environment
        branchName
      }
    }
  }
`

type MergeBranchMutationVariables = {
  input: {
    deleteMergedHead: boolean
    projectId: string
    head: Branch
    base: Branch
    target: Branch & {
      version: number
    }
  }
}

type MergeBranchMutationPayload = {
  result: {
    deletedBranch: DevelopmentBranch
    mergedBranch: Branch
  }
}

export const mergeBranchMutation = gql`
  mutation MergeBranchMutation($input: TSMergeSchemaBranchInput!) {
    result: tsMergeSchemaBranch(input: $input) {
      deletedBranch {
        environment
        branchName
      }
      mergedBranch {
        environment
        branchName
      }
    }
  }
`

export type Client = ReturnType<typeof getClient>

export type ClientConfig = {
  apiKey: string
}

export function getClient({ apiKey }: ClientConfig) {
  const client = new GraphQLClient(ADMIN_URL, { headers: { Authorization: `Bearer ${apiKey}` } })

  return {
    async getBranch(variables: BranchArgs) {
      if (!apiKey) {
        return
      }

      try {
        log.debug('getBranch', { variables })

        const { result } = await client.request<GetBranchQueryPayload, BranchArgs>(
          getBranchQuery,
          variables,
        )

        log.debug('getBranch', { result })

        return result
      } catch (error) {
        log.debug(error)
        throw new Error(formatErrorMessage(error))
      }
    },
    async tagBranch(variables: TagBranchMutationVariables) {
      if (!apiKey) {
        return
      }

      try {
        log.debug('tagBranch', { variables })

        const { result } = await client.request<
          TagBranchMutationPayload,
          TagBranchMutationVariables
        >(tagBranchMutation, variables)

        log.debug('tagBranch', { result })

        return result
      } catch (error) {
        log.debug(error)

        throw new Error(formatErrorMessage(error))
      }
    },
    async createBranch(variables: CreateBranchMutationVariables) {
      if (!apiKey) {
        return
      }

      try {
        log.debug('createBranch', { variables })

        const { result } = await client.request<
          CreateBranchMutationPayload,
          CreateBranchMutationVariables
        >(createBranchMutation, variables)

        log.debug('createBranch', { result })

        return result
      } catch (error) {
        log.debug(error)
        throw new Error(formatErrorMessage(error))
      }
    },
    async deleteBranch(variables: DeleteBranchMutationVariables) {
      if (!apiKey) {
        return
      }

      try {
        log.debug('deleteBranch', { variables })

        const { result } = await client.request<
          DeleteBranchMutationPayload,
          DeleteBranchMutationVariables
        >(deleteBranchMutation, variables)

        log.debug('deleteBranch', { result })

        return result
      } catch (error) {
        log.debug(error)
        throw new Error(formatErrorMessage(error))
      }
    },
    async mergeBranch(variables: MergeBranchMutationVariables) {
      if (!apiKey) {
        return
      }

      try {
        log.debug('mergeBranch', { variables })

        const { result } = await client.request<
          MergeBranchMutationPayload,
          MergeBranchMutationVariables
        >(mergeBranchMutation, variables)

        log.debug('mergeBranch', { result })

        return result
      } catch (error) {
        log.debug(error)
        throw new Error(formatErrorMessage(error))
      }
    },
  }
}
