/** The current environment based on the `SNACK_ENVIRONMENT` environment variable */
export const environment = process.env.SNACK_ENVIRONMENT === 'staging' ? 'staging' : 'production';

/** Select a value based on the current environment, similar to `Platform.select({})` */
export function selectEnvironment<T>(values: Record<typeof environment, T>): T {
  return values[environment];
}
