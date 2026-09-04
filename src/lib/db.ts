import { createClient, type Client } from '@libsql/client'

const globalForDb = globalThis as unknown as {
  libsqlClient: Client | undefined
}

function createDbClient(): Client {
  const url = process.env.DATABASE_URL || "file:./db/custom.db"

  if (url.startsWith('libsql://')) {
    const authToken = process.env.DATABASE_AUTH_TOKEN
    return createClient({ url, authToken })
  }

  return createClient({ url })
}

const libsqlClient = globalForDb.libsqlClient ?? createDbClient()

if (process.env.NODE_ENV !== 'production') globalForDb.libsqlClient = libsqlClient

// Prisma-like wrapper using raw SQL
// This provides the same API surface that our code uses

type WhereClause = Record<string, unknown>
type SelectClause = Record<string, boolean>

function buildWhere(where?: WhereClause, table?: string): { sql: string; args: unknown[] } {
  if (!where || Object.keys(where).length === 0) return { sql: '', args: [] }
  const parts: string[] = []
  const args: unknown[] = []
  for (const [key, value] of Object.entries(where)) {
    if (value === undefined || value === null) continue
    const col = table ? `"${key}"` : `"${key}"`
    parts.push(`${col} = ?`)
    args.push(value)
  }
  return { sql: parts.length > 0 ? ' WHERE ' + parts.join(' AND ') : '', args }
}

function generateId(): string {
  return 'c' + Date.now().toString(36) + Math.random().toString(36).substring(2, 10)
}

function now(): string {
  return new Date().toISOString()
}

export const db = {
  user: {
    async findUnique({ where, select }: { where: { id?: string; email?: string; username?: string; referralCode?: string }; select?: SelectClause }) {
      let sql = `SELECT ${select ? Object.keys(select).map(k => `"${k}"`).join(', ') : '*'} FROM "User" WHERE `
      const args: unknown[] = []
      const conds: string[] = []
      if (where.id) { conds.push('"id" = ?'); args.push(where.id) }
      if (where.email) { conds.push('"email" = ?'); args.push(where.email) }
      if (where.username) { conds.push('"username" = ?'); args.push(where.username) }
      if (where.referralCode) { conds.push('"referralCode" = ?'); args.push(where.referralCode) }
      sql += conds.join(' OR ') + ' LIMIT 1'
      const res = await libsqlClient.execute({ sql, args: args as any[] })
      return res.rows[0] || null
    },
    async findFirst({ where, select }: { where?: WhereClause; select?: SelectClause }) {
      let sql = `SELECT ${select ? Object.keys(select).map(k => `"${k}"`).join(', ') : '*'} FROM "User"`
      const w = buildWhere(where, 'User')
      sql += w.sql + ' LIMIT 1'
      const res = await libsqlClient.execute({ sql, args: w.args as any[] })
      return res.rows[0] || null
    },
    async findMany({ where, select, orderBy, take }: { where?: WhereClause; select?: SelectClause; orderBy?: Record<string, string>; take?: number } = {}) {
      let sql = `SELECT ${select ? Object.keys(select).map(k => `"${k}"`).join(', ') : '*'} FROM "User"`
      const w = buildWhere(where, 'User')
      sql += w.sql
      if (orderBy) {
        const orderParts = Object.entries(orderBy).map(([k, v]) => `"${k}" ${v}`)
        sql += ' ORDER BY ' + orderParts.join(', ')
      } else {
        sql += ' ORDER BY "createdAt" DESC'
      }
      if (take) sql += ` LIMIT ${take}`
      const res = await libsqlClient.execute({ sql, args: w.args as any[] })
      return res.rows
    },
    async count({ where }: { where?: WhereClause } = {}) {
      let sql = 'SELECT COUNT(*) as count FROM "User"'
      const w = buildWhere(where, 'User')
      sql += w.sql
      const res = await libsqlClient.execute({ sql, args: w.args as any[] })
      return Number(res.rows[0].count)
    },
    async create({ data }: { data: Record<string, unknown> }) {
      const keys = Object.keys(data)
      const values = Object.values(data)
      const sql = `INSERT INTO "User" (${keys.map(k => `"${k}"`).join(', ')}) VALUES (${keys.map(() => '?').join(', ')}) RETURNING *`
      const res = await libsqlClient.execute({ sql, args: values as any[] })
      return res.rows[0]
    },
    async update({ where, data }: { where: { id?: string; username?: string }; data: Record<string, unknown> }) {
      const setParts = Object.keys(data).map(k => `"${k}" = ?`)
      const args = [...Object.values(data)]
      let sql = `UPDATE "User" SET ${setParts.join(', ')}`
      if (where.id) { sql += ' WHERE "id" = ?'; args.push(where.id) }
      else if (where.username) { sql += ' WHERE "username" = ?'; args.push(where.username) }
      await libsqlClient.execute({ sql, args: args as any[] })
      // Return updated
      let selectSql = 'SELECT * FROM "User" WHERE '
      const selectArgs: unknown[] = []
      if (where.id) { selectSql += '"id" = ?'; selectArgs.push(where.id) }
      else { selectSql += '"username" = ?'; selectArgs.push(where.username) }
      const res = await libsqlClient.execute({ sql: selectSql, args: selectArgs as any[] })
      return res.rows[0]
    },
    async upsert({ where, create: createData, update: updateData }: { where: WhereClause; create: Record<string, unknown>; update: Record<string, unknown> }) {
      // Check exists
      const w = buildWhere(where, 'User')
      const checkSql = `SELECT * FROM "User"${w.sql} LIMIT 1`
      const existing = await libsqlClient.execute({ sql: checkSql, args: w.args as any[] })
      if (existing.rows.length > 0) {
        if (Object.keys(updateData).length > 0) {
          const setParts = Object.keys(updateData).map(k => `"${k}" = ?`)
          const args = [...Object.values(updateData), ...w.args]
          const updateSql = `UPDATE "User" SET ${setParts.join(', ')}${w.sql}`
          await libsqlClient.execute({ sql: updateSql, args: args as any[] })
          const res = await libsqlClient.execute({ sql: `SELECT * FROM "User"${w.sql} LIMIT 1`, args: w.args as any[] })
          return res.rows[0]
        }
        return existing.rows[0]
      }
      // Create
      const keys = Object.keys(createData)
      const values = Object.values(createData)
      const sql = `INSERT INTO "User" (${keys.map(k => `"${k}"`).join(', ')}) VALUES (${keys.map(() => '?').join(', ')}) RETURNING *`
      const res = await libsqlClient.execute({ sql, args: values as any[] })
      return res.rows[0]
    },
  },
  wallet: {
    async findUnique({ where }: { where: { userId?: string; id?: string } }) {
      let sql = 'SELECT * FROM "Wallet" WHERE '
      const args: unknown[] = []
      if (where.userId) { sql += '"userId" = ?'; args.push(where.userId) }
      else if (where.id) { sql += '"id" = ?'; args.push(where.id) }
      sql += ' LIMIT 1'
      const res = await libsqlClient.execute({ sql, args: args as any[] })
      return res.rows[0] || null
    },
    async update({ where, data }: { where: { userId?: string; id?: string }; data: Record<string, unknown> }) {
      const setParts = Object.keys(data).map(k => `"${k}" = ?`)
      const args = [...Object.values(data)]
      let sql = `UPDATE "Wallet" SET ${setParts.join(', ')}`
      if (where.userId) { sql += ' WHERE "userId" = ?'; args.push(where.userId) }
      else if (where.id) { sql += ' WHERE "id" = ?'; args.push(where.id) }
      await libsqlClient.execute({ sql, args: args as any[] })
      let selectSql = 'SELECT * FROM "Wallet" WHERE '
      const selectArgs: unknown[] = []
      if (where.userId) { selectSql += '"userId" = ?'; selectArgs.push(where.userId) }
      else { selectSql += '"id" = ?'; selectArgs.push(where.id) }
      const res = await libsqlClient.execute({ sql: selectSql, args: selectArgs as any[] })
      return res.rows[0]
    },
  },
  job: {
    async findUnique({ where, include }: { where: { id: string }; include?: Record<string, unknown> }) {
      const res = await libsqlClient.execute({ sql: 'SELECT * FROM "Job" WHERE "id" = ? LIMIT 1', args: [where.id] })
      return res.rows[0] || null
    },
    async findMany({ where, include, orderBy, take }: { where?: WhereClause; include?: Record<string, unknown>; orderBy?: Record<string, string>; take?: number } = {}) {
      let sql = 'SELECT * FROM "Job"'
      const w = buildWhere(where, 'Job')
      sql += w.sql
      if (orderBy) {
        sql += ' ORDER BY ' + Object.entries(orderBy).map(([k, v]) => `"${k}" ${v}`).join(', ')
      } else {
        sql += ' ORDER BY "createdAt" DESC'
      }
      if (take) sql += ` LIMIT ${take}`
      const res = await libsqlClient.execute({ sql, args: w.args as any[] })
      return res.rows
    },
    async count({ where }: { where?: WhereClause } = {}) {
      let sql = 'SELECT COUNT(*) as count FROM "Job"'
      const w = buildWhere(where, 'Job')
      sql += w.sql
      const res = await libsqlClient.execute({ sql, args: w.args as any[] })
      return Number(res.rows[0].count)
    },
    async create({ data }: { data: Record<string, unknown> }) {
      const keys = Object.keys(data)
      const values = Object.values(data)
      const sql = `INSERT INTO "Job" (${keys.map(k => `"${k}"`).join(', ')}) VALUES (${keys.map(() => '?').join(', ')}) RETURNING *`
      const res = await libsqlClient.execute({ sql, args: values as any[] })
      return res.rows[0]
    },
    async update({ where, data }: { where: { id: string }; data: Record<string, unknown> }) {
      const setParts = Object.keys(data).map(k => `"${k}" = ?`)
      const args = [...Object.values(data), where.id]
      const sql = `UPDATE "Job" SET ${setParts.join(', ')} WHERE "id" = ?`
      await libsqlClient.execute({ sql, args: args as any[] })
      const res = await libsqlClient.execute({ sql: 'SELECT * FROM "Job" WHERE "id" = ?', args: [where.id] })
      return res.rows[0]
    },
    async delete({ where }: { where: { id: string } }) {
      await libsqlClient.execute({ sql: 'DELETE FROM "Job" WHERE "id" = ?', args: [where.id] })
    },
  },
  category: {
    async findMany({ include, orderBy }: { include?: Record<string, unknown>; orderBy?: Record<string, string> } = {}) {
      let sql = 'SELECT * FROM "Category"'
      sql += ' ORDER BY "name" ASC'
      const res = await libsqlClient.execute({ sql })
      return res.rows
    },
    async upsert({ where, create, update }: { where: { slug?: string }; create: Record<string, unknown>; update: Record<string, unknown> }) {
      let checkSql = 'SELECT * FROM "Category" WHERE '
      const args: unknown[] = []
      if (where.slug) { checkSql += '"slug" = ?'; args.push(where.slug) }
      const existing = await libsqlClient.execute({ sql: checkSql, args: args as any[] })
      if (existing.rows.length > 0) {
        if (Object.keys(update).length > 0) {
          const setParts = Object.keys(update).map(k => `"${k}" = ?`)
          const updateArgs = [...Object.values(update), ...args]
          await libsqlClient.execute({ sql: `UPDATE "Category" SET ${setParts.join(', ')} WHERE ${where.slug ? '"slug" = ?' : ''}`, args: updateArgs as any[] })
        }
        const res = await libsqlClient.execute({ sql: checkSql, args: args as any[] })
        return res.rows[0]
      }
      const keys = Object.keys(create)
      const values = Object.values(create)
      const sql = `INSERT INTO "Category" (${keys.map(k => `"${k}"`).join(', ')}) VALUES (${keys.map(() => '?').join(', ')}) RETURNING *`
      const res = await libsqlClient.execute({ sql, args: values as any[] })
      return res.rows[0]
    },
  },
  jobSubmission: {
    async findUnique({ where }: { where: { jobId_userId: { jobId: string; userId: string } } }) {
      const res = await libsqlClient.execute({
        sql: 'SELECT * FROM "JobSubmission" WHERE "jobId" = ? AND "userId" = ? LIMIT 1',
        args: [where.jobId_userId.jobId, where.jobId_userId.userId]
      })
      return res.rows[0] || null
    },
    async findMany({ where, include, orderBy, take }: { where?: WhereClause; include?: Record<string, unknown>; orderBy?: Record<string, string>; take?: number } = {}) {
      let sql = 'SELECT * FROM "JobSubmission"'
      const w = buildWhere(where, 'JobSubmission')
      sql += w.sql
      sql += ' ORDER BY "createdAt" DESC'
      if (take) sql += ` LIMIT ${take}`
      const res = await libsqlClient.execute({ sql, args: w.args as any[] })
      return res.rows
    },
    async count({ where }: { where?: WhereClause } = {}) {
      let sql = 'SELECT COUNT(*) as count FROM "JobSubmission"'
      const w = buildWhere(where, 'JobSubmission')
      sql += w.sql
      const res = await libsqlClient.execute({ sql, args: w.args as any[] })
      return Number(res.rows[0].count)
    },
    async create({ data }: { data: Record<string, unknown> }) {
      const keys = Object.keys(data)
      const values = Object.values(data)
      const sql = `INSERT INTO "JobSubmission" (${keys.map(k => `"${k}"`).join(', ')}) VALUES (${keys.map(() => '?').join(', ')}) RETURNING *`
      const res = await libsqlClient.execute({ sql, args: values as any[] })
      return res.rows[0]
    },
    async update({ where, data }: { where: { id: string }; data: Record<string, unknown> }) {
      const setParts = Object.keys(data).map(k => `"${k}" = ?`)
      const args = [...Object.values(data), where.id]
      const sql = `UPDATE "JobSubmission" SET ${setParts.join(', ')} WHERE "id" = ?`
      await libsqlClient.execute({ sql, args: args as any[] })
      const res = await libsqlClient.execute({ sql: 'SELECT * FROM "JobSubmission" WHERE "id" = ?', args: [where.id] })
      return res.rows[0]
    },
  },
  transaction: {
    async findMany({ where, orderBy, take, select }: { where?: WhereClause; orderBy?: Record<string, string>; take?: number; select?: SelectClause } = {}) {
      let sql = `SELECT ${select ? Object.keys(select).map(k => `"${k}"`).join(', ') : '*'} FROM "Transaction"`
      const w = buildWhere(where, 'Transaction')
      sql += w.sql
      sql += ' ORDER BY "createdAt" DESC'
      if (take) sql += ` LIMIT ${take}`
      const res = await libsqlClient.execute({ sql, args: w.args as any[] })
      return res.rows
    },
    async create({ data }: { data: Record<string, unknown> }) {
      const keys = Object.keys(data)
      const values = Object.values(data)
      const sql = `INSERT INTO "Transaction" (${keys.map(k => `"${k}"`).join(', ')}) VALUES (${keys.map(() => '?').join(', ')}) RETURNING *`
      const res = await libsqlClient.execute({ sql, args: values as any[] })
      return res.rows[0]
    },
    async createMany({ data }: { data: Record<string, unknown>[] }) {
      for (const item of data) {
        const keys = Object.keys(item)
        const values = Object.values(item)
        const sql = `INSERT INTO "Transaction" (${keys.map(k => `"${k}"`).join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`
        await libsqlClient.execute({ sql, args: values as any[] })
      }
    },
  },
  withdrawal: {
    async findMany({ where, include, orderBy, take }: { where?: WhereClause; include?: Record<string, unknown>; orderBy?: Record<string, string>; take?: number } = {}) {
      let sql = 'SELECT * FROM "Withdrawal"'
      const w = buildWhere(where, 'Withdrawal')
      sql += w.sql
      sql += ' ORDER BY "createdAt" DESC'
      if (take) sql += ` LIMIT ${take}`
      const res = await libsqlClient.execute({ sql, args: w.args as any[] })
      return res.rows
    },
    async create({ data }: { data: Record<string, unknown> }) {
      const keys = Object.keys(data)
      const values = Object.values(data)
      const sql = `INSERT INTO "Withdrawal" (${keys.map(k => `"${k}"`).join(', ')}) VALUES (${keys.map(() => '?').join(', ')}) RETURNING *`
      const res = await libsqlClient.execute({ sql, args: values as any[] })
      return res.rows[0]
    },
    async update({ where, data }: { where: { id: string }; data: Record<string, unknown> }) {
      const setParts = Object.keys(data).map(k => `"${k}" = ?`)
      const args = [...Object.values(data), where.id]
      const sql = `UPDATE "Withdrawal" SET ${setParts.join(', ')} WHERE "id" = ?`
      await libsqlClient.execute({ sql, args: args as any[] })
      const res = await libsqlClient.execute({ sql: 'SELECT * FROM "Withdrawal" WHERE "id" = ?', args: [where.id] })
      return res.rows[0]
    },
    async findUnique({ where }: { where: { id: string } }) {
      const res = await libsqlClient.execute({ sql: 'SELECT * FROM "Withdrawal" WHERE "id" = ? LIMIT 1', args: [where.id] })
      return res.rows[0] || null
    },
    async count({ where }: { where?: WhereClause } = {}) {
      let sql = 'SELECT COUNT(*) as count FROM "Withdrawal"'
      const w = buildWhere(where, 'Withdrawal')
      sql += w.sql
      const res = await libsqlClient.execute({ sql, args: w.args as any[] })
      return Number(res.rows[0].count)
    },
  },
  deposit: {
    async findMany({ where, include, orderBy, take }: { where?: WhereClause; include?: Record<string, unknown>; orderBy?: Record<string, string>; take?: number } = {}) {
      let sql = 'SELECT * FROM "Deposit"'
      const w = buildWhere(where, 'Deposit')
      sql += w.sql
      sql += ' ORDER BY "createdAt" DESC'
      if (take) sql += ` LIMIT ${take}`
      const res = await libsqlClient.execute({ sql, args: w.args as any[] })
      return res.rows
    },
    async create({ data }: { data: Record<string, unknown> }) {
      const keys = Object.keys(data)
      const values = Object.values(data)
      const sql = `INSERT INTO "Deposit" (${keys.map(k => `"${k}"`).join(', ')}) VALUES (${keys.map(() => '?').join(', ')}) RETURNING *`
      const res = await libsqlClient.execute({ sql, args: values as any[] })
      return res.rows[0]
    },
    async update({ where, data }: { where: { id: string }; data: Record<string, unknown> }) {
      const setParts = Object.keys(data).map(k => `"${k}" = ?`)
      const args = [...Object.values(data), where.id]
      const sql = `UPDATE "Deposit" SET ${setParts.join(', ')} WHERE "id" = ?`
      await libsqlClient.execute({ sql, args: args as any[] })
      const res = await libsqlClient.execute({ sql: 'SELECT * FROM "Deposit" WHERE "id" = ?', args: [where.id] })
      return res.rows[0]
    },
    async findUnique({ where }: { where: { id: string } }) {
      const res = await libsqlClient.execute({ sql: 'SELECT * FROM "Deposit" WHERE "id" = ? LIMIT 1', args: [where.id] })
      return res.rows[0] || null
    },
  },
  notification: {
    async findMany({ where, orderBy, take }: { where?: WhereClause; orderBy?: Record<string, string>; take?: number } = {}) {
      let sql = 'SELECT * FROM "Notification"'
      const w = buildWhere(where, 'Notification')
      sql += w.sql
      sql += ' ORDER BY "createdAt" DESC'
      if (take) sql += ` LIMIT ${take}`
      const res = await libsqlClient.execute({ sql, args: w.args as any[] })
      return res.rows
    },
    async count({ where }: { where?: WhereClause } = {}) {
      let sql = 'SELECT COUNT(*) as count FROM "Notification"'
      const w = buildWhere(where, 'Notification')
      sql += w.sql
      const res = await libsqlClient.execute({ sql, args: w.args as any[] })
      return Number(res.rows[0].count)
    },
    async create({ data }: { data: Record<string, unknown> }) {
      const keys = Object.keys(data)
      const values = Object.values(data)
      const sql = `INSERT INTO "Notification" (${keys.map(k => `"${k}"`).join(', ')}) VALUES (${keys.map(() => '?').join(', ')}) RETURNING *`
      const res = await libsqlClient.execute({ sql, args: values as any[] })
      return res.rows[0]
    },
    async createMany({ data }: { data: Record<string, unknown>[] }) {
      for (const item of data) {
        const keys = Object.keys(item)
        const values = Object.values(item)
        const sql = `INSERT INTO "Notification" (${keys.map(k => `"${k}"`).join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`
        await libsqlClient.execute({ sql, args: values as any[] })
      }
    },
    async updateMany({ where, data }: { where: WhereClause; data: Record<string, unknown> }) {
      const setParts = Object.keys(data).map(k => `"${k}" = ?`)
      const w = buildWhere(where, 'Notification')
      const args = [...Object.values(data), ...w.args]
      const sql = `UPDATE "Notification" SET ${setParts.join(', ')}${w.sql}`
      await libsqlClient.execute({ sql, args: args as any[] })
    },
  },
  setting: {
    async findMany() {
      const res = await libsqlClient.execute({ sql: 'SELECT * FROM "Setting"' })
      return res.rows
    },
    async findUnique({ where }: { where: { key: string } }) {
      const res = await libsqlClient.execute({ sql: 'SELECT * FROM "Setting" WHERE "key" = ? LIMIT 1', args: [where.key] })
      return res.rows[0] || null
    },
    async upsert({ where, create, update }: { where: { key: string }; create: Record<string, unknown>; update: Record<string, unknown> }) {
      const existing = await libsqlClient.execute({ sql: 'SELECT * FROM "Setting" WHERE "key" = ?', args: [where.key] })
      if (existing.rows.length > 0) {
        const setParts = Object.keys(update).map(k => `"${k}" = ?`)
        const args = [...Object.values(update), where.key]
        await libsqlClient.execute({ sql: `UPDATE "Setting" SET ${setParts.join(', ')} WHERE "key" = ?`, args: args as any[] })
        const res = await libsqlClient.execute({ sql: 'SELECT * FROM "Setting" WHERE "key" = ?', args: [where.key] })
        return res.rows[0]
      }
      const keys = Object.keys(create)
      const values = Object.values(create)
      const sql = `INSERT INTO "Setting" (${keys.map(k => `"${k}"`).join(', ')}) VALUES (${keys.map(() => '?').join(', ')}) RETURNING *`
      const res = await libsqlClient.execute({ sql, args: values as any[] })
      return res.rows[0]
    },
  },
  bookmark: {
    async findUnique({ where }: { where: { userId_jobId: { userId: string; jobId: string } } }) {
      const res = await libsqlClient.execute({
        sql: 'SELECT * FROM "Bookmark" WHERE "userId" = ? AND "jobId" = ? LIMIT 1',
        args: [where.userId_jobId.userId, where.userId_jobId.jobId]
      })
      return res.rows[0] || null
    },
    async findMany({ where }: { where?: WhereClause }) {
      let sql = 'SELECT * FROM "Bookmark"'
      const w = buildWhere(where, 'Bookmark')
      sql += w.sql
      sql += ' ORDER BY "createdAt" DESC'
      const res = await libsqlClient.execute({ sql, args: w.args as any[] })
      return res.rows
    },
    async create({ data }: { data: Record<string, unknown> }) {
      const keys = Object.keys(data)
      const values = Object.values(data)
      const sql = `INSERT INTO "Bookmark" (${keys.map(k => `"${k}"`).join(', ')}) VALUES (${keys.map(() => '?').join(', ')}) RETURNING *`
      const res = await libsqlClient.execute({ sql, args: values as any[] })
      return res.rows[0]
    },
    async delete({ where }: { where: { id: string } }) {
      await libsqlClient.execute({ sql: 'DELETE FROM "Bookmark" WHERE "id" = ?', args: [where.id] })
    },
  },
  jobType: {
    async findMany({ where, orderBy }: { where?: WhereClause; orderBy?: Record<string, string> } = {}) {
      let sql = 'SELECT * FROM "JobType"'
      const w = buildWhere(where, 'JobType')
      sql += w.sql
      if (orderBy) {
        sql += ' ORDER BY ' + Object.entries(orderBy).map(([k, v]) => `"${k}" ${v}`).join(', ')
      } else {
        sql += ' ORDER BY "reward" ASC'
      }
      const res = await libsqlClient.execute({ sql, args: w.args as any[] })
      return res.rows
    },
    async findFirst({ where }: { where?: WhereClause }) {
      let sql = 'SELECT * FROM "JobType"'
      const w = buildWhere(where, 'JobType')
      sql += w.sql + ' LIMIT 1'
      const res = await libsqlClient.execute({ sql, args: w.args as any[] })
      return res.rows[0] || null
    },
    async create({ data }: { data: Record<string, unknown> }) {
      const keys = Object.keys(data)
      const values = Object.values(data)
      const sql = `INSERT INTO "JobType" (${keys.map(k => `"${k}"`).join(', ')}) VALUES (${keys.map(() => '?').join(', ')}) RETURNING *`
      const res = await libsqlClient.execute({ sql, args: values as any[] })
      return res.rows[0]
    },
    async update({ where, data }: { where: { id: string }; data: Record<string, unknown> }) {
      const setParts = Object.keys(data).map(k => `"${k}" = ?`)
      const args = [...Object.values(data), where.id]
      const sql = `UPDATE "JobType" SET ${setParts.join(', ')} WHERE "id" = ?`
      await libsqlClient.execute({ sql, args: args as any[] })
      const res = await libsqlClient.execute({ sql: 'SELECT * FROM "JobType" WHERE "id" = ?', args: [where.id] })
      return res.rows[0]
    },
  },
  jobReport: {
    async findUnique({ where }: { where: { jobId_reporterId: { jobId: string; reporterId: string } } }) {
      const res = await libsqlClient.execute({
        sql: 'SELECT * FROM "JobReport" WHERE "jobId" = ? AND "reporterId" = ? LIMIT 1',
        args: [where.jobId_reporterId.jobId, where.jobId_reporterId.reporterId]
      })
      return res.rows[0] || null
    },
    async findMany({ where, orderBy, take }: { where?: WhereClause; orderBy?: Record<string, string>; take?: number } = {}) {
      let sql = 'SELECT * FROM "JobReport"'
      const w = buildWhere(where, 'JobReport')
      sql += w.sql
      sql += ' ORDER BY "createdAt" DESC'
      if (take) sql += ` LIMIT ${take}`
      const res = await libsqlClient.execute({ sql, args: w.args as any[] })
      return res.rows
    },
    async create({ data }: { data: Record<string, unknown> }) {
      const keys = Object.keys(data)
      const values = Object.values(data)
      const sql = `INSERT INTO "JobReport" (${keys.map(k => `"${k}"`).join(', ')}) VALUES (${keys.map(() => '?').join(', ')}) RETURNING *`
      const res = await libsqlClient.execute({ sql, args: values as any[] })
      return res.rows[0]
    },
    async update({ where, data }: { where: { id: string }; data: Record<string, unknown> }) {
      const setParts = Object.keys(data).map(k => `"${k}" = ?`)
      const args = [...Object.values(data), where.id]
      const sql = `UPDATE "JobReport" SET ${setParts.join(', ')} WHERE "id" = ?`
      await libsqlClient.execute({ sql, args: args as any[] })
    },
  },
  jobRating: {
    async findUnique({ where }: { where: { jobId_userId: { jobId: string; userId: string } } }) {
      const res = await libsqlClient.execute({
        sql: 'SELECT * FROM "JobRating" WHERE "jobId" = ? AND "userId" = ? LIMIT 1',
        args: [where.jobId_userId.jobId, where.jobId_userId.userId]
      })
      return res.rows[0] || null
    },
    async findMany({ where }: { where?: WhereClause }) {
      let sql = 'SELECT * FROM "JobRating"'
      const w = buildWhere(where, 'JobRating')
      sql += w.sql
      const res = await libsqlClient.execute({ sql, args: w.args as any[] })
      return res.rows
    },
    async create({ data }: { data: Record<string, unknown> }) {
      const keys = Object.keys(data)
      const values = Object.values(data)
      const sql = `INSERT INTO "JobRating" (${keys.map(k => `"${k}"`).join(', ')}) VALUES (${keys.map(() => '?').join(', ')}) RETURNING *`
      const res = await libsqlClient.execute({ sql, args: values as any[] })
      return res.rows[0]
    },
    async update({ where, data }: { where: { id: string }; data: Record<string, unknown> }) {
      const setParts = Object.keys(data).map(k => `"${k}" = ?`)
      const args = [...Object.values(data), where.id]
      const sql = `UPDATE "JobRating" SET ${setParts.join(', ')} WHERE "id" = ?`
      await libsqlClient.execute({ sql, args: args as any[] })
    },
  },
  adminLog: {
    async create({ data }: { data: Record<string, unknown> }) {
      const keys = Object.keys(data)
      const values = Object.values(data)
      const sql = `INSERT INTO "AdminLog" (${keys.map(k => `"${k}"`).join(', ')}) VALUES (${keys.map(() => '?').join(', ')}) RETURNING *`
      const res = await libsqlClient.execute({ sql, args: values as any[] })
      return res.rows[0]
    },
  },
  // Transaction support
  async $transaction(fn: (tx: any) => Promise<any>): Promise<any> {
    return fn({
      execute: async (sql: string, args: any[] = []) => {
        const res = await libsqlClient.execute({ sql, args })
        return res.rows
      },
      jobSubmission: {
        update: async (args: any) => { return db.jobSubmission.update(args) },
        create: async (args: any) => { return db.jobSubmission.create(args) },
      },
      wallet: {
        findUnique: async (args: any) => { return db.wallet.findUnique(args) },
        update: async (args: any) => { return db.wallet.update(args) },
      },
      transaction: {
        create: async (args: any) => { return db.transaction.create(args) },
      },
      notification: {
        create: async (args: any) => { return db.notification.create(args) },
      },
      job: {
        update: async (args: any) => { return db.job.update(args) },
      },
      deposit: {
        update: async (args: any) => { return db.deposit.update(args) },
      },
      withdrawal: {
        update: async (args: any) => { return db.withdrawal.update(args) },
      },
    })
  },
}

export { generateId, now }
