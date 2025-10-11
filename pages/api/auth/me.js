import { verifyJWT } from '../../../lib/auth'
import clientPromise from '../../../lib/mongodb'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const payload = verifyJWT(token)
    const client = await clientPromise
    const db = client.db('keyauth_hub')
    
    const user = await db.collection('users').findOne({ email: payload.email })
    if (!user) {
      return res.status(401).json({ message: 'User not found' })
    }

    res.json({
      email: user.email,
      is_admin: user.is_admin || false
    })
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' })
  }
}
