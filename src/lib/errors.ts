import { ClientError } from 'graphql-request'

export function formatErrorMessage(error: unknown) {
  if (error instanceof ClientError) {
    return error.response.errors?.[0]?.message ?? error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Unknown error'
}
