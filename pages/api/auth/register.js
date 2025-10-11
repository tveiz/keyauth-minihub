import clientPromise from '../../../lib/mongodb'
import { hashPassword, logActivity } from '../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { email, password, confirm_password } = req.body

  if (!email || !password || !confirm_password) {
    return res.status(400).json({ message: 'Missing required fields' })
  }

  if (password !== confirm_password) {
    return res.status(400).json({ message: 'Passwords do not match' })
  }

  try {
    const client = await clientPromise
    const db = client.db('keyauth_hub')
    
    // Check if user exists
    const existingUser = await db.collection('users').findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' })
    }

    // Create user
    const hashedPassword = await hashPassword(password)
    const user = {
      id: crypto.randomUUID(),
      email,
      password_hash: hashedPassword,
      is_admin: false,
      created_at: new Date().toISOString()
    }

    await db.collection('users').insertOne(user)
    await logActivity('Account Created', email, null, null, { registration_time: new Date().toISOString() })

    res.status(201).json({ message: 'User created successfully' })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
