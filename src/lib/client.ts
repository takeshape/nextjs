import { gql, GraphQLClient } from 'graphql-request'
import { ADMIN_URL } from './constants.js'
import { getConfig } from './util.js'

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
  mutation ($input: TSCreateSchemaBranchTagInput!) {
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

export function getClient() {
  const { apiKey } = getConfig()
  const client = new GraphQLClient(ADMIN_URL, { headers: { Authorization: `Bearer ${apiKey}` } })

  return {
    async getBranch(variables: any) {
      const { result } = await client.request<GetBranchQueryPayload>(getBranchQuery, variables)
      return result
    },
    async tagBranch(variables: any) {
      const { result } = await client.request<TagBranchMutationPayload>(
        tagBranchMutation,
        variables,
      )
      return result
    },
    async createBranch(variables: any) {
      const { result } = await client.request<CreateBranchMutationPayload>(
        createBranchMutation,
        variables,
      )
      return result
    },
  }
}
