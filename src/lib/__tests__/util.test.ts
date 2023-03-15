import { expect, test } from 'vitest'
import { ADMIN_URL } from '../constants'
import { isValidUrl } from '../util'

test('isValidUrl', async () => {
  expect(isValidUrl(ADMIN_URL)).toBe(true)
  expect(isValidUrl('https://localhost:6000')).toBe(true)
  expect(isValidUrl('===')).toBe(false)
  expect(isValidUrl('')).toBe(false)
})
