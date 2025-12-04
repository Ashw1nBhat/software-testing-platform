import mysql from 'mysql2/promise'

const numberFrom = (value, fallback) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const envValue = (key) => process.env[key]

const resolveConfig = (overrides = {}) => {
  const host = overrides.host ?? envValue('VITE_DB_HOST') ?? envValue('DB_HOST') ?? ''
  const user = overrides.user ?? envValue('VITE_DB_USER') ?? envValue('DB_USER') ?? ''
  const password =
    overrides.password ?? envValue('VITE_DB_PASSWORD') ?? envValue('DB_PASSWORD') ?? ''
  const database =
    overrides.database ?? envValue('VITE_DB_NAME') ?? envValue('DB_NAME') ?? 'testing_platform'
  const port = numberFrom(
    overrides.port ?? envValue('VITE_DB_PORT') ?? envValue('DB_PORT'),
    3306,
  )

  if (!host || !user || !password) {
    throw new Error('Database credentials missing')
  }

  return {
    host,
    user,
    password,
    database,
    port,
    namedPlaceholders: true,
  }
}

export const testConnection = async (overrides) => {
  const connection = await mysql.createConnection(resolveConfig(overrides))
  try {
    await connection.execute('SELECT 1')
    return true
  } finally {
    await connection.end()
  }
}

export const callProcedure = async (name, params = [], overrides) => {
  const connection = await mysql.createConnection(resolveConfig(overrides))
  const placeholders = params.map(() => '?').join(', ')
  const statement = placeholders ? `CALL ${name}(${placeholders})` : `CALL ${name}()`

  try {
    const [rows] = await connection.execute(statement, params)
    return rows
  } finally {
    await connection.end()
  }
}
