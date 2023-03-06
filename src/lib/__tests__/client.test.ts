import { graphql } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest'
import { getClient } from '../client'

vi.mock('../util.js', () => {
  return {
    getConfig: () => ({}),
  }
})

const branchName = 'my_branch'
const graphqlUrl = 'https://api.takeshape.io/project/12345-abcdef/development/my_branch/graphql'

export const handlers = [
  graphql.query('GetSchemaBranchQuery', (req, res, ctx) => {
    return res(ctx.data({ result: { branchName, graphqlUrl } }))
  }),
  graphql.mutation('TagBranchMutation', (req, res, ctx) => {
    return res(ctx.data({ result: { branchVersion: { branchName, graphqlUrl } } }))
  }),

  graphql.mutation('CreateBranchMutation', (req, res, ctx) => {
    return res(ctx.data({ result: { branch: { branchName, graphqlUrl } } }))
  }),
]

const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

afterAll(() => server.close())

beforeEach(() => {
  vi.resetModules()
})

afterEach(() => {
  vi.clearAllMocks()
  server.resetHandlers()
})

test('getBranch', async () => {
  const client = getClient()
  const branch = await client.getBranch({})
  expect(branch).toEqual({ branchName, graphqlUrl })
})

test('tagBranch', async () => {
  const client = getClient()
  const branch = await client.tagBranch({})
  expect(branch).toEqual({ branchVersion: { branchName, graphqlUrl } })
})

test('createBranch', async () => {
  const client = getClient()
  const branch = await client.createBranch({})
  expect(branch).toEqual({ branch: { branchName, graphqlUrl } })
})
