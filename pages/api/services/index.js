import { verifyJWT, logActivity } from '../../../lib/auth'
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
      const { name } = req.body
      if (!name) {
        return res.status(400).json({ message: 'Service name is required' })
      }

      const service = {
        id: crypto.randomUUID(),
        name,
        owner_email: payload.email,
        created_at: new Date().toISOString()
      }

      await db.collection('services').insertOne(service)
      await logActivity('Service Created', payload.email, service.id, null, { service_name: name })

      res.status(201).json(service)
    } else if (req.method === 'GET') {
      const query = payload.isAdmin ? {} : { owner_email: payload.email }
      const services = await db.collection('services').find(query, { projection: { _id: 0 } }).toArray()
      
      res.json(services)
    } else {
      res.status(405).json({ message: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Services API error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
