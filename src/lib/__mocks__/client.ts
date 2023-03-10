import { vi } from 'vitest'

export const getClient = vi.fn().mockReturnValue({
  getBranch: vi.fn(),
  createBranch: vi.fn(),
  tagBranch: vi.fn(),
  deleteBranch: vi.fn(),
  mergeBranch: vi.fn(),
})
