import Express from 'express'
import Redis from 'ioredis'

const app = Express()
app.use(Express.json())
/**
 * This Redis client will be used for normal queries (like setting values).
 */
const redis = new Redis({
  host: 'localhost',
  port: 6379,
})

/**
 * A separate Redis client for subscribing to channels.
 * It is generally recommended to have a separate connection for subscriptions.
 */
const redisSubscriber = new Redis({
  host: 'localhost',
  port: 6379,
})

/**
 * Maintain an in-memory map of known service statuses.
 * True means 'up', false means 'down'.
 * Using an object allows us to easily add more services if needed.
 */
const serviceHealthStatus = {
  notificationService: true
}

/**
 * Subscribe to 'serviceup' and 'servicedown' channels to dynamically update serviceHealthStatus.
 */
redisSubscriber.subscribe('serviceup', (err) => {
  if (err) console.error('Error subscribing to serviceup:', err)
  console.log('Subscribed to Service Up channel')
})

redisSubscriber.subscribe('servicedown', (err) => {
  if (err) console.error('Error subscribing to servicedown:', err)
  console.log('Subscribed to Service Down channel')
})

/**
 * Listen for messages on the subscribed channels and update the status map accordingly.
 */
redisSubscriber.on('message', (channel, message) => {
  if (channel === 'serviceup') {
    serviceHealthStatus[message] = true
  } else if (channel === 'servicedown') {
    serviceHealthStatus[message] = false
  }
})

/**
 * Checks if the specified service is up using the in-memory status map.
 * eg. You can get the status from Redis itself on server restart and use it to update the in-memory map.
 */
async function checkServiceUp(serviceName) {
  return serviceHealthStatus[serviceName]
}

/**
 * Helper class to interact with NotificationService.
 */
class NotificationServiceHelper {
  static async sendDataToNotificationService(payload) {
    try {
      // Check if notificationService is marked as 'up' in our map
      const notificationServiceStatus = await checkServiceUp('notificationService')
      if (notificationServiceStatus) {
        // If notificationService is up, attempt to send data
        const response = await fetch('http://localhost:3001/receiveData', {
          method: 'post',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        })
        return response?.json() || { error: 'Failed to send data to NotificationService' }
      }
      // If notificationService is down, return an error
      return { error: 'NotificationService is down (according to Redis status)' }
    } catch (error) {
      // Catch any network errors or fetch issues
      return { error: 'Failed to reach NotificationService' }
    }
  }
}

/**
 * A sample endpoint that sends data to NotificationService, relying on the circuit-breaker-like logic above.
 */
app.get('/sendDataToNotificationService', async (req, res) => {
  const { error, ...data } = await NotificationServiceHelper.sendDataToNotificationService({ hello: 'world' })
  if (error) return res.status(500).send({ error, data })
  return res.send(data)
})

/**
 * Simple health endpoint for Service1 itself.
 */
app.get('/healthy', (req, res) => {
  res.send({ status: 'healthy' })
})

/**
 * Start Server1 on port 3000, and set an initial Redis key for this service's health.
 */
app.listen(3000, () => {
  redis.set('health:authenticationService', 'healthy')
  console.log('authenticationService is up on port 3000')
})
