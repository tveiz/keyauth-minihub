import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function hashPassword(password) {
  return await bcrypt.hash(password, 12)
}

export async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword)
}

export function createJWT(email, isAdmin = false) {
  return jwt.sign(
    { email, isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function verifyJWT(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch (error) {
    throw new Error('Invalid token')
  }
}

export function generateKey() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const length = Math.floor(Math.random() * 11) + 15 // 15-25 characters
  let result = ''
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

export async function logActivity(action, userEmail, serviceId = null, keyId = null, details = {}) {
  try {
    const webhookData = {
      content: `**${action}**`,
      embeds: [{
        title: "KeyAuthMiniHub Activity",
        color: 0x00ff00,
        fields: [
          { name: "Action", value: action, inline: true },
          { name: "User", value: userEmail, inline: true },
          { name: "Time", value: new Date().toISOString(), inline: true }
        ]
      }]
    }
    
    if (serviceId) {
      webhookData.embeds[0].fields.push({ name: "Service ID", value: serviceId, inline: true })
    }
    if (keyId) {
      webhookData.embeds[0].fields.push({ name: "Key ID", value: keyId, inline: true })
    }
    if (Object.keys(details).length > 0) {
      webhookData.embeds[0].fields.push({ name: "Details", value: JSON.stringify(details), inline: false })
    }
    
    await fetch(process.env.DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookData)
    })
  } catch (error) {
    console.error('Failed to send webhook:', error)
  }
}
