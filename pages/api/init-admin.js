import clientPromise from '../../lib/mongodb'
import { hashPassword } from '../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const client = await clientPromise
    const db = client.db('keyauth_hub')

    const adminEmail = 'tm9034156@gmail.com'
    const adminPassword = 'admin1234@HA'

    const existingAdmin = await db.collection('users').findOne({ email: adminEmail })
    if (existingAdmin) {
      return res.json({ message: 'Admin user already exists' })
    }

    const hashedPassword = await hashPassword(adminPassword)
    const adminUser = {
      id: crypto.randomUUID(),
      email: adminEmail,
      password_hash: hashedPassword,
      is_admin: true,
      created_at: new Date().toISOString()
    }

    await db.collection('users').insertOne(adminUser)

    res.json({ message: 'Admin user created successfully' })
  } catch (error) {
    console.error('Init admin error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
