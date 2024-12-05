export const env = <T>(
  variableName: string,
  defaultValueObj: { defaultValue: T } | null = null,
): T | string => {
  const value = process.env[variableName]

  if (value !== undefined) {
    return value
  }

  if (defaultValueObj !== null) {
    return defaultValueObj.defaultValue
  }

  throw new Error(`Environment variable ${variableName} is not set`)
}
