# Circuit Breaker for Microservices

This repository demonstrates a **circuit breaker** pattern using Node.js and Redis. It contains multiple services that communicate with each other and keep track of their respective health statuses in real time.

## Table of Contents
- [Overview](#overview)
- [What is a Circuit Breaker?](#what-is-a-circuit-breaker)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Project](#running-the-project)
- [How It Works](#how-it-works)
- [Mermaid Diagram](#mermaid-diagram)

---

## Overview
This project consists of:
1. **Health Service**: Periodically checks the health of other services and publishes “up” or “down” statuses to Redis.  
2. **Notification Service**: A placeholder for another service (subscriber or data receiver).  
3. **Authentication Service**: Another microservice that interacts with or relies on the circuit breaker.

Each microservice communicates its own health status. If a service is marked **“down,”** other services will stop sending requests until it recovers, thus avoiding repetitive failures.

---

## What is a Circuit Breaker?
A **circuit breaker** in microservice architecture is a pattern that **prevents** a client from making requests to an unhealthy or non-responsive service. It does this by “opening” the circuit when failures are detected, thereby avoiding **wasteful calls** and additional load, until the service is marked healthy again.

---

## Project Structure
```
.
├── healthService.js           # Checks and publishes health statuses to Redis
├── notificationService.js     # Placeholder for a second service (Subscriber)
├── authenticationService.js   # Placeholder for a third service
├── package.json               # NPM scripts and dependencies
├── install_redis.sh		   # (Optional) Installs Redis on Linux or macOS
└── README.md                  # Project documentation
```

---

## Prerequisites
1. **Node.js** (v14+ recommended)
2. **Redis** (v6.0+ recommended)
   - Make sure Redis is running on the default port `6379` or adjust the environment variables accordingly.
3. **npm** or **yarn** (to install dependencies)

To install Redis automatically, you can run the `install_redis.sh` script. Otherwise, install Redis manually as per your operating system’s instructions.

---

## Installation

1. **Clone this repository**:
   ```bash
   git clone https://github.com/sangleshubham/circuit-breaker-for-micro-services.git
   cd circuit-breaker-for-micro-services
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```
   or
   ```bash
   yarn install
   ```

3. **(Optional) Configure environment variables**:
   Create a `.env` file at the root if you want to override defaults:
   ```
   REDIS_SERVER=localhost
   REDIS_PORT=6379
   REDIS_USERNAME=default
   REDIS_PASSWORD=
   ```
   Adjust values as needed.

---

## Running the Project

1. **Ensure Redis is running**  
   - Use `npm run prestart` to install redis-tools.

2. **Start all services**:
   ```bash
   npm run healthService
   npm run authenticationService
   npm run notificationService
   ```
   This will start (adjust code if you need a custom port):
   - `healthService.js` on port 3002
   - `notificationService.js` on port 3000
   - `authenticationService.js` on port 3001

3. **Verify services are running**  
   - Check the console logs for messages like “Health Service is up.”  
   - Test endpoints via a browser or [curl](https://curl.se/). For example, `curl http://localhost:3000/sendDataToNotificationService` triggers a api call to notification service.
   - If response is correct then the notification service is up. If the service is down the API call will be skipped. 

---

## How It Works
1. **Health Service** periodically sends requests to each microservice’s `GET /healthy` endpoint.
2. Based on the response, it publishes messages to Redis (`serviceup` or `servicedown`).
3. Other services subscribe to those channels. When they see a `servicedown` message, they update an in-memory map to mark that service as “down.”
4. Before making any external request, a service checks this map (the circuit breaker). If the target is “down,” it short-circuits and avoids that call.
5. Once the Health Service detects a service is back up, it publishes a `serviceup` message, allowing requests again.

---

## Diagram
Below is a simplified overview of how the services interact, with the circuit breaker mechanism:

![github-shubham-sangle-circuite-breaker](https://github.com/user-attachments/assets/dafa5279-35dd-4da9-8642-ccf6087ce6d7)

-   **Step 1**: The **Health Service (HS)** pings each microservice’s `/healthy` endpoint.
-   **Step 2**: It publishes the health status (up/down) to **Redis (R)**.
-   **Step 3**: Other services (like **Service 1** and **Service 2**) subscribe to Redis channels for these updates.
-   **Step 4**: Each service uses a circuit-breaker check (up or down). If **down**, it immediately **short-circuits** further calls; if **up**, it proceeds.

---

**Feel free to submit issues or pull requests if you find any bugs or want to propose improvements!**
