import { verifyJWT, logActivity } from '../../../../lib/auth'
import clientPromise from '../../../../lib/mongodb'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const payload = verifyJWT(token)
    const { keyId } = req.query
    
    const client = await clientPromise
    const db = client.db('keyauth_hub')

    const key = await db.collection('keys').findOne({ id: keyId })
    if (!key) {
      return res.status(404).json({ message: 'Key not found' })
    }

    if (!payload.isAdmin && key.owner_email !== payload.email) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    await db.collection('keys').updateOne(
      { id: keyId },
      {
        $unset: { hwid: "" },
        $inc: { reset_count: 1 }
      }
    )

    await logActivity('HWID Reset', payload.email, key.service_id, keyId, { reset_count: key.reset_count + 1 })

    res.json({ message: 'HWID reset successfully' })
  } catch (error) {
    console.error('Reset HWID error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
