import clientPromise from '../../lib/mongodb'
import { logActivity } from '../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { Key, HWID, ServiceId } = req.body

  try {
    const client = await clientPromise
    const db = client.db('keyauth_hub')

    const key = await db.collection('keys').findOne({ key_value: Key })
    if (!key) {
      return res.json({ success: false, error: 'Invalid Key' })
    }

    if (key.service_id !== ServiceId) {
      return res.json({ success: false, error: 'Invalid Service' })
    }

    // If first use, bind HWID and set expiration
    if (!key.is_used) {
      const firstUsedAt = new Date()
      let expiresAt = null

      if (key.duration_type === 'weekly') {
        expiresAt = new Date(firstUsedAt.getTime() + 7 * 24 * 60 * 60 * 1000)
      } else if (key.duration_type === 'monthly') {
        expiresAt = new Date(firstUsedAt.getTime() + 30 * 24 * 60 * 60 * 1000)
      } else if (key.duration_type === 'custom' && key.custom_duration) {
        const { days, hours, minutes } = key.custom_duration
        const totalMs = (days * 24 * 60 + hours * 60 + minutes) * 60 * 1000
        expiresAt = new Date(firstUsedAt.getTime() + totalMs)
      }

      await db.collection('keys').updateOne(
        { id: key.id },
        {
          $set: {
            hwid: HWID,
            is_used: true,
            first_used_at: firstUsedAt.toISOString(),
            expires_at: expiresAt ? expiresAt.toISOString() : null
          }
        }
      )

      await logActivity('Key First Use', 'system', key.service_id, key.id, { hwid: HWID, duration_type: key.duration_type })
    } else {
      // Check HWID match
      if (key.hwid !== HWID) {
        return res.json({ success: false, error: 'HWID Mismatch' })
      }
    }

    // Check expiration
    if (key.expires_at && new Date(key.expires_at) < new Date()) {
      return res.json({ success: false, error: 'Key Expired' })
    }

    await logActivity('Key Used', 'system', key.service_id, key.id, { hwid: HWID })

    res.json({ success: true, message: 'Valid Key' })
  } catch (error) {
    console.error('Verify key error:', error)
    res.json({ success: false, error: 'Internal server error' })
  }
}
