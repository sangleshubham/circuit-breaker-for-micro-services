import Express from 'express';
import Redis from 'ioredis';
const app = Express()

const redis = new Redis({
    host: 'localhost',
    port: 6379
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



