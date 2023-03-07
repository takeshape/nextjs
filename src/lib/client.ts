import { gql, GraphQLClient } from 'graphql-request'
import { ADMIN_URL } from './constants.js'

type GetBranchQueryPayload = {
  result: {
    branchName: string
    graphqlUrl: string
  }
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
      branchName
      graphqlUrl
    }
  }
`

type TagBranchMutationPayload = {
  result: {
    branchVersion: {
      branchName: string
      graphqlUrl: string
    }
  }
}

export const tagBranchMutation = gql`
  mutation TagBranchMutation($input: TSCreateSchemaBranchTagInput!) {
    result: tsCreateSchemaBranchTag(input: $input) {
      branchVersion {
        branchName
        graphqlUrl
      }
    }
  }
`

type CreateBranchMutationPayload = {
  result: {
    branch: {
      branchName: string
      graphqlUrl: string
    }
  }
}

export const createBranchMutation = gql`
  mutation CreateBranchMutation($input: TSCreateSchemaBranchInput!) {
    result: tsCreateSchemaBranch(input: $input) {
      branch {
        branchName
        graphqlUrl
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
    async getBranch(variables: any) {
      if (!apiKey) {
        return
      }

      const { result } = await client.request<GetBranchQueryPayload>(getBranchQuery, variables)
      return result
    },
    async tagBranch(variables: any) {
      if (!apiKey) {
        return
      }

      const { result } = await client.request<TagBranchMutationPayload>(
        tagBranchMutation,
        variables,
      )
      return result
    },
    async createBranch(variables: any) {
      if (!apiKey) {
        return
      }

      const { result } = await client.request<CreateBranchMutationPayload>(
        createBranchMutation,
        variables,
      )
      return result
    },
  }
}
