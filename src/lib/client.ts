import { gql, GraphQLClient } from 'graphql-request'
import { ADMIN_URL } from './constants.js'
import { formatErrorMessage } from './errors.js'
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
        const { result } = await client.request<GetBranchQueryPayload, BranchArgs>(
          getBranchQuery,
          variables,
        )
        return result
      } catch (error) {
        throw new Error(formatErrorMessage(error))
      }
    },
    async tagBranch(variables: TagBranchMutationVariables) {
      if (!apiKey) {
        return
      }

      try {
        const { result } = await client.request<
          TagBranchMutationPayload,
          TagBranchMutationVariables
        >(tagBranchMutation, variables)
        return result
      } catch (error) {
        throw new Error(formatErrorMessage(error))
      }
    },
    async createBranch(variables: CreateBranchMutationVariables) {
      if (!apiKey) {
        return
      }

      try {
        const { result } = await client.request<
          CreateBranchMutationPayload,
          CreateBranchMutationVariables
        >(createBranchMutation, variables)
        return result
      } catch (error) {
        throw new Error(formatErrorMessage(error))
      }
    },
    async deleteBranch(variables: DeleteBranchMutationVariables) {
      if (!apiKey) {
        return
      }

      try {
        const { result } = await client.request<
          DeleteBranchMutationPayload,
          DeleteBranchMutationVariables
        >(deleteBranchMutation, variables)
        return result
      } catch (error) {
        throw new Error(formatErrorMessage(error))
      }
    },
    async mergeBranch(variables: MergeBranchMutationVariables) {
      if (!apiKey) {
        return
      }

      try {
        const { result } = await client.request<
          MergeBranchMutationPayload,
          MergeBranchMutationVariables
        >(mergeBranchMutation, variables)
        return result
      } catch (error) {
        throw new Error(formatErrorMessage(error))
      }
    },
  }
}
