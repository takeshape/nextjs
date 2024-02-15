import { graphql, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest'
import { getClient } from '../client'
import { ADMIN_URL, DEVELOPMENT } from '../constants'

const adminUrl = ADMIN_URL
const projectId = 'project-id'
const apiKey = 'api-key'
const branchName = 'my_branch'
const graphqlUrl = 'https://api.takeshape.io/project/12345-abcdef/development/my_branch/graphql'

export const handlers = [
  graphql.query('GetSchemaBranchQuery', () => {
    return HttpResponse.json({
      data: {
        result: {
          branchName,
          graphqlUrl,
        },
      },
    })
  }),
  graphql.mutation('TagBranchMutation', () => {
    return HttpResponse.json({
      data: {
        result: {
          branchVersion: {
            branchName,
            graphqlUrl,
          },
        },
      },
    })
  }),

  graphql.mutation('CreateBranchMutation', ({ variables }) => {
    if (variables['input'].branchName === 'duplicate') {
      return HttpResponse.json({
        errors: [
          {
            message: 'Branch already exists',
            locations: [{ line: 3, column: 5 }],
            path: ['result'],
            type: 'GraphQLError',
          },
        ],
      })
    }

    return HttpResponse.json({ data: { result: { branch: { branchName, graphqlUrl } } } })
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
  const client = getClient({ adminUrl, apiKey })
  const branch = await client.getBranch({ projectId, environment: DEVELOPMENT, branchName })
  expect(branch).toEqual({ branchName, graphqlUrl })
})

test('tagBranch', async () => {
  const client = getClient({ adminUrl, apiKey })
  const branch = await client.tagBranch({
    input: { projectId, environment: DEVELOPMENT, branchName, tagName: 'abc123' },
  })
  expect(branch).toEqual({ branchVersion: { branchName, graphqlUrl } })
})

test('createBranch', async () => {
  const client = getClient({ adminUrl, apiKey })
  const branch = await client.createBranch({
    input: { projectId, branchName: 'foo', environment: DEVELOPMENT },
  })
  expect(branch).toEqual({ branch: { branchName, graphqlUrl } })
})

test('createBranch - throws', async () => {
  const client = getClient({ adminUrl, apiKey })
  await expect(() =>
    client.createBranch({
      input: { projectId, environment: DEVELOPMENT, branchName: 'duplicate' },
    }),
  ).rejects.toThrowError('Branch already exists')
})
