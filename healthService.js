import Express from 'express'
import Redis from 'ioredis'
import env from 'dotenv'

env.config()

const {
  REDIS_SERVER = "localhost",
  REDIS_PORT = 6379,
  REDIS_USERNAME = "default",
  REDIS_PASSWORD = ""
} = process.env

// Create an Express application
const app = Express()

env.config()

/**
 * Create a Redis client for publishing messages.
 */
const redis = new Redis({
  host: REDIS_SERVER,
  port: Number(REDIS_PORT),
  redisOptions: {
    ...(REDIS_USERNAME && { username: REDIS_USERNAME }),
    ...(REDIS_PASSWORD && { password: REDIS_PASSWORD })
  }
})

/**
 * Helper class to check if a given service is up.
 * This uses a simple "fetch" against the '/healthy' endpoint of each service.
 */
class HealthCheckHelper {
  static async checkServiceIsUp(serviceName) {
    try {
      // Decide port based on service name, If we have more than 2 services, we can use a map to store the port. 
      const port = serviceName === 'authenticationService' ? 3000 : 3001
      // Simple health check endpoint
      const response = await fetch(`http://localhost:${port}/healthy`)
      const { status } = await response.json()

      // If service responds with { status: 'healthy' }, we consider it up
      return status === 'healthy'
    } catch (error) {
      // If there's any error (network, parse, etc.), assume service is down
      return false
    }
  }
}

/**
 * Checks the health of both services in parallel and publishes
 * events to Redis. This avoids sequential checks for slightly better performance.
 */
async function healthCheck() {
  try {
    // Run both health checks concurrently
    const [service2Status, service1Status] = await Promise.all([
      HealthCheckHelper.checkServiceIsUp('notificationService'),
      HealthCheckHelper.checkServiceIsUp('authenticationService'),
    ])

    // Publish to Redis based on notificationService health status
    if (service2Status) {
      redis.publish('serviceup', 'notificationService')
    } else {
      redis.publish('servicedown', 'notificationService')
    }

    // Publish to Redis based on authenticationService health status
    if (service1Status) redis.publish('serviceup', 'authenticationService')
    else redis.publish('servicedown', 'authenticationService')

  } catch (error) {
    // In case something goes wrong entirely, log the error
    console.error('Health check error:', error)
  }
}

/**
 * On-demand endpoint to trigger health checks manually.
 */
app.get('/updateHealth', async (req, res) => {
  await healthCheck()
  res.send({ status: 'updated health status' })
})

/**
 * Automated, scheduled health checks.
 * Adjust the interval as needed to reduce overhead if checks are too frequent.
 */
setInterval(() => {
  healthCheck()
  console.log('Health check completed')
}, 5000) // 5000 ms = 5 second

// Start the HealthChecker service on port 3002
app.listen(3002, async () => {
  await healthCheck()
  console.log('Health Service is up on port 3002')
})
