import clientPromise from '../../../lib/mongodb'
import { verifyPassword, createJWT, logActivity } from '../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'Missing email or password' })
  }

  try {
    const client = await clientPromise
    const db = client.db('keyauth_hub')
    
    const user = await db.collection('users').findOne({ email })
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    const token = createJWT(user.email, user.is_admin || false)
    await logActivity('User Login', email, null, null, { login_time: new Date().toISOString() })

    res.json({
      access_token: token,
      token_type: 'bearer',
      is_admin: user.is_admin || false
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
