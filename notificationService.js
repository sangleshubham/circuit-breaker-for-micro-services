import Express from 'express';
import Redis from 'ioredis';
const app = Express()

env.config()

const {
  REDIS_SERVER = "localhost",
  REDIS_PORT = 6379,
  REDIS_USERNAME = "default",
  REDIS_PASSWORD = ""
} = process.env

const redis = new Redis({
  host: REDIS_SERVER,
  port: Number(REDIS_PORT),
  redisOptions: {
    ...(REDIS_USERNAME && { username: REDIS_USERNAME }),
    ...(REDIS_PASSWORD && { password: REDIS_PASSWORD })
  }
})

/**
 * Express middleware to parse incoming JSON bodies.
 */
app.use(Express.json())

/**
 * Endpoint to receive data from other services (e.g., Authetication Service).
 * Demonstrates how you might process or store received data.
 */
app.post('/receiveData', async ({ body }, res) => {
    console.log(JSON.stringify(`Reveived request is: ${body}`))
    return res.send(body)
})

/**
 * Simple health endpoint for Notification Service.
 */
app.get('/healthy', (req, res) => {
    res.send({ status: 'healthy' })
})

/**
 * Start Server2 on port 3001, and set an initial Redis key for this service's health.
 * This will help other servers to make sure that after restart the service is healthy.
 */
app.listen(3001, () => {
    redis.set('health:notificationService', 'healthy')
    console.log('notificationService is up')
})



