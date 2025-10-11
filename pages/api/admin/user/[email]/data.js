import { verifyJWT } from '../../../../../lib/auth'
import clientPromise from '../../../../../lib/mongodb'

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
    if (!payload.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' })
    }

    const { email } = req.query
    const client = await clientPromise
    const db = client.db('keyauth_hub')
    
    const services = await db.collection('services').find(
      { owner_email: email },
      { projection: { _id: 0 } }
    ).toArray()

    const keys = await db.collection('keys').find(
      { owner_email: email },
      { projection: { _id: 0 } }
    ).toArray()

    res.json({ services, keys })
  } catch (error) {
    console.error('Admin user data API error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
