[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/xIbq4TFL)

| Name                | Registration No | Batch            |
|---------------------|-----------------|------------------|
| Dharmasiri I.D.N.D  | IT22254320      | Y3S1.SE.WD.01    |
---
> [!NOTE]
> This repository is a **mirrored version** of the main repository located at: [github.com/nmdra/Finance-Tracker-API](https://github.com/nmdra/Finance-Tracker-API).
> 
> Some features, such as **GitHub Actions** and **packaged builds**, are not available in this mirrored repo.For details on those features, please refer to the main repository.

--- 

# Finance Tracker API

- [Finance Tracker API](#finance-tracker-api)
  - [Features](#features)
  - [Libraries and Frameworks](#libraries-and-frameworks)
    - [🛡 Security Features](#-security-features)
  - [🌐 API](#-api)
  - [🏗 Development Setup](#-development-setup)
      - [Prerequisites](#prerequisites)
      - [Clone the repository](#clone-the-repository)
      - [Environment variables](#environment-variables)
      - [Running the application](#running-the-application)
    - [Testing](#testing)
  - [🚀 Production Deployment](#-production-deployment)
    - [Running with Docker Compose](#running-with-docker-compose)
      - [Start the Production Environment](#start-the-production-environment)
      - [Stop the Containers](#stop-the-containers)
    - [Health Check](#health-check)
    - [Logs \& Monitoring](#logs--monitoring)


*A comprehensive API designed to manage and track personal finances. This API includes features for user authentication, transaction management, budget tracking, goal setting, and real-time notifications. It is built with **Node.js, Express, MongoDB, and Redis**.*

> [!IMPORTANT]
> The **Docker Production Image** is available for use at: [GitHub Container Registry](https://github.com/nmdra/Finance-Tracker-API/pkgs/container/finapi).
>
> For detailed deployment instructions, please refer to the [Production Deployment](#-production-deployment) section.

## Features

- **User Management**: Register, authenticate, and manage user data.
- **Transaction Tracking**: Log and track financial transactions.
- **Budget Management**: Create and manage financial budgets.
- **Goal Tracking**: Set and monitor progress toward financial goals.
- **Notifications**: Notifications about spending patterns, deadlines, and goals.
- **Automate Jobs**
- **Data Caching (Redis)**
- **Email Handling**

## Libraries and Frameworks

1. **[Express](https://expressjs.com/)** - Minimalist web framework for Node.js.
2. **[Mongoose](https://mongoosejs.com/)** - ODM for MongoDB.
3. **[Bcryptjs](https://www.npmjs.com/package/bcryptjs)** - Library to hash passwords.
4. **[Axios](https://axios-http.com/)**,**[Axios-Retry](https://www.npmjs.com/package/axios-retry)** - Promise-based HTTP client.
5. **[JWT](https://jwt.io/)** - Library for generating JSON Web Tokens.
6. **[Pino, Pino-Http, Pino-Pretty](https://getpino.io/)** - JSON logger.
7. **[Http-Status-Codes](https://www.npmjs.com/package/http-status-codes)** - HTTP status code constants.
8. **[Ioredis](https://github.com/luin/ioredis)** - Redis client for Node.js.
9. **[Nodemailer + MailTrap](https://mailtrap.io/blog/sending-emails-with-nodemailer/#Send-HTML-email)** - Email Handling.
10. **[Croner](https://croner.56k.guru/)** - Job Scheduling.

### 🛡 Security Features  

>[!NOTE]
> The production Docker image uses **[Chainguard Images](https://images.chainguard.dev/directory/image/node/overview)**, a secure, minimal container image for **better security** and a **lower attack surface**.  
>
> **[Trivy Vulnerability Scanning](https://trivy.dev/latest/)** is integrated into the GitHub Actions to **scan for vulnerabilities** in the Docker image before deployment.  

- **Authentication & Authorization** → Uses **[JWT](https://github.com/auth0/node-jsonwebtoken)** for secure authentication and **[bcryptjs](https://github.com/dcodeIO/bcrypt.js/)** for password hashing.  
- **Input Validation & Sanitization** → Implements **[express-mongo-sanitize](https://github.com/fiznool/express-mongo-sanitize)** to prevent NoSQL injections and **[helmet](https://helmetjs.github.io/)** for security headers.  
- **Rate Limiting & Logging** → Uses **[express-rate-limit](https://github.com/nfriedly/express-rate-limit)** to prevent abuse and **[Pino](https://github.com/pinojs/pino)** for high-performance logging.  
- **Testing & Mocking** → Includes **[Chai](https://www.chaijs.com/)**, **[Mocha](https://mochajs.org/)**, and **[Nock](https://github.com/nock/nock)** for API testing.  

## 🌐 API

>[!TIP]
> The full API documentation can be found here 👉 **[documenter.getpostman.com/view/33227780/2sAYdoF7xS](https://documenter.getpostman.com/view/33227780/2sAYdoF7xS)**

- **Health Check**: `/api/{API_VERSION}/health` - Check server status
- **User Routes**: `/api/{API_VERSION}/user` - User registration and authentication
- **Transaction Routes**: `/api/{API_VERSION}/transaction` - Manage transactions
- **Budget Routes**: `/api/{API_VERSION}/budget` - Budget management
- **Goal Routes**: `/api/{API_VERSION}/goal` - Set and track financial goals
- **Notification Routes**: `/api/{API_VERSION}/notification` - Real-time notifications
- **Analytics & Reports routes**: `/api/{API_VERSION}/analytics` - Reports

## 🏗 Development Setup

#### Prerequisites

- Node.js
- Docker

#### Clone the repository

```bash
git clone https://github.com/nmdra/Finance-Tracker-API.git
cd Finance-Tracker-API
```

#### Environment variables

Create a `.env` file in the root directory based on [.env.example](./.env.example)
```bash
DB_USERNAME=yourMongoDBUsername
DB_PASSWORD=yourMongoDBPassword
API_VERSION=v1
```
**Get Exchange-API Key : https://www.exchangerate-api.com/**

#### Running the application

To start the application in development mode:
```bash
docker-compose up
```
This will start the API Service, MongoDB, Redis, and the MongoDB Dashboard.

- **app**: Node.js application container
- **db**: MongoDB database container
- **db-dashboard**: MongoDB Express dashboard for managing the database
- **redis**: Redis cache for the application

### Testing

Run following command after running `docker compose up`:

```shell
docker compose exec app npm test
```
---

## 🚀 Production Deployment  

The production-ready Docker image for **Finance Tracker API** is available on **GitHub Packages**:  

📦 **Docker Image:** [GitHub Container Registry](https://github.com/nmdra/Finance-Tracker-API/pkgs/container/finapi)  


### Running with Docker Compose
A production-ready **Docker Compose** file is available:  

📜 **File:** [`./docker-compose-prod.yml`](./docker-compose-prod.yml)

#### Start the Production Environment
```sh
docker-compose -f docker-compose-prod.yml up -d
```

#### Stop the Containers
```sh
docker-compose -f docker-compose-prod.yml down
```

### Health Check

Verify that the API is running by checking the **health check endpoint**:  
```sh
curl http://localhost:5000/api/v1/health
```
Expected Response:  
```json
{
    "service": "Finance API",
    "status": "healthy",
    "timestamp": "2025-03-10T05:05:11.017Z"
}
```

### Logs & Monitoring

To check the logs of your running container:  
```sh
docker logs -f finance-api
```

For debugging a running container:  
```sh
docker exec -it finance-api sh
```
---

<div align="center">
  <a href="https://blog.nimendra.xyz">🌎 Blog</a> |
  <a href="https://github.com/nmdra">👨‍💻 GitHub</a> |
  <a href="https://twitter.com/nimendra_">🐦 Twitter</a> |
  <a href="https://www.linkedin.com/in/nimendra/">💼 LinkedIn</a>
</div>
