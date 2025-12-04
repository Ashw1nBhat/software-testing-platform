export type DbConfig = {
  host: string
  user: string
  password: string
  database: string
  port?: number
}

export function getDefaultDbConfig(): DbConfig {
  return {
    host: import.meta.env.VITE_DB_HOST || '',
    user: import.meta.env.VITE_DB_USER || '',
    password: import.meta.env.VITE_DB_PASSWORD || '',
    database: import.meta.env.VITE_DB_NAME || 'testing_platform',
    port: import.meta.env.VITE_DB_PORT ? Number(import.meta.env.VITE_DB_PORT) : 3306,
  }
}
