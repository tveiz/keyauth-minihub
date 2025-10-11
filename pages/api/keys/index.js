import { verifyJWT, generateKey, logActivity } from '../../../lib/auth'
import clientPromise from '../../../lib/mongodb'

export default async function handler(req, res) {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const payload = verifyJWT(token)
    const client = await clientPromise
    const db = client.db('keyauth_hub')

    if (req.method === 'POST') {
      const { service_id, duration_type, custom_duration } = req.body
      
      const service = await db.collection('services').findOne({ id: service_id })
      if (!service) {
        return res.status(404).json({ message: 'Service not found' })
      }

      if (!payload.isAdmin && service.owner_email !== payload.email) {
        return res.status(403).json({ message: 'Not authorized' })
      }

      // Generate unique key
      let keyValue
      do {
        keyValue = generateKey()
      } while (await db.collection('keys').findOne({ key_value: keyValue }))

      const key = {
        id: crypto.randomUUID(),
        key_value: keyValue,
        service_id,
        service_name: service.name,
        duration_type,
        custom_duration: duration_type === 'custom' ? custom_duration : null,
        hwid: null,
        is_used: false,
        first_used_at: null,
        expires_at: null,
        created_at: new Date().toISOString(),
        reset_count: 0,
        owner_email: payload.email
      }

      await db.collection('keys').insertOne(key)
      await logActivity('Key Created', payload.email, service_id, key.id, { duration_type })

      res.status(201).json(key)
    } else if (req.method === 'GET') {
      const query = payload.isAdmin ? {} : { owner_email: payload.email }
      const keys = await db.collection('keys').find(query, { projection: { _id: 0 } }).toArray()
      
      res.json(keys)
    } else {
      res.status(405).json({ message: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Keys API error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
