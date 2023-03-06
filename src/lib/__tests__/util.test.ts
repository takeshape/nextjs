import { expect, test } from 'vitest'
import { getConfig } from '../util'

test('getConfig', async () => {
  process.env['NEXT_PUBLIC_TAKESHAPE_API_URL'] =
    'https://api.takeshape.io/project/i-am-the-project-id/production/graphql'
  process.env['TAKESHAPE_API_KEY'] = 'i-am-the-api-key'
  const { apiKey, projectId } = getConfig()
  expect(projectId).toMatch('i-am-the-project-id')
  expect(apiKey).toMatch('i-am-the-api-key')
})
