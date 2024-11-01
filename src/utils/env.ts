export const env = (name: string, defaultValue?: string): string => {
  const enviromentValue = process.env[name];
  if (!enviromentValue) {
    if (defaultValue == null) {
      throw new Error(`Environment variable ${name} is not set`);
    }
    return defaultValue;
  }

  return enviromentValue;
};
