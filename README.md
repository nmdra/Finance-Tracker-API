[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/xIbq4TFL)

| Name                | Registration No | Batch            |
|---------------------|-----------------|------------------|
| Dharmasiri I.D.N.D  | IT22254320      | Y3S1.SE.WD.01    |

--- 

# Finance Tracker API

- [Finance Tracker API](#finance-tracker-api)
  - [Features](#features)
  - [Libraries and Frameworks](#libraries-and-frameworks)
  - [API](#api)
  - [Installation](#installation)
    - [Prerequisites](#prerequisites)
      - [Clone the repository](#clone-the-repository)
      - [Environment variables](#environment-variables)
      - [Running the application](#running-the-application)
    - [Testing](#testing)


*A comprehensive API designed to manage and track personal finances. This API includes features for user authentication, transaction management, budget tracking, goal setting, and real-time notifications. It is built with **Node.js, Express, MongoDB, and Redis**.*

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

## API

>[!TIP]
> The full API documentation can be found here 👉 **[API Documentation](https://documenter.getpostman.com/view/33227780/2sAYdoF7xS)**

- **Health Check**: `/api/{API_VERSION}/health` - Check server status
- **User Routes**: `/api/{API_VERSION}/user` - User registration and authentication
- **Transaction Routes**: `/api/{API_VERSION}/transaction` - Manage transactions
- **Budget Routes**: `/api/{API_VERSION}/budget` - Budget management
- **Goal Routes**: `/api/{API_VERSION}/goal` - Set and track financial goals
- **Notification Routes**: `/api/{API_VERSION}/notification` - Real-time notifications
- **Analytics & Reports routes**: `/api/{API_VERSION}/analytics` - Reports

## Installation

### Prerequisites

- Node.js
- Docker (for running services)

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
Get Exchange-API Key : https://www.exchangerate-api.com/

#### Running the application

To start the application in development mode:
```bash
docker-compose up
```
This will start the API Services, MongoDB, Redis, and the MongoDB Dashboard.

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

<div align="center">
  <a href="https://blog.nimendra.xyz">🌎 Blog</a> |
  <a href="https://github.com/nmdra">👨‍💻 GitHub</a> |
  <a href="https://twitter.com/nimendra_">🐦 Twitter</a> |
  <a href="https://www.linkedin.com/in/nimendra/">💼 LinkedIn</a>
</div>
