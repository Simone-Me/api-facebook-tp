# Facebook-like Events API

A REST API for managing social events, groups, photo albums, surveys, and ticketing.

## Features

- **Users**: Registration and profile management
- **Groups**: Create public/private/secret groups with members and organizers
- **Events**: Organize events with date, location, and member invitations
- **Albums & Photos**: Share event photos with comments
- **Messages**: Post messages in groups and events with reply threads
- **Surveys**: Create polls for events with multiple-choice questions
- **Ticketing**: Sell tickets for public events with inventory management

## Requirements

- Node.js 18+
- MongoDB Atlas (or local MongoDB)

## Installation

add your own config.mjs to connect the BDD following this ex :

```
export default {
  development: {
    type: 'development',
    port: 3000,
    mongodb: 'mongodb+srv://<NAME>:<PASSWORD>@cluster0.8z5nqjn.mongodb.net/<SPACE>'
  },
  production: {
    type: 'production',
    port: 3000,
    mongodb: 'mongodb+srv://<NAME>:<PASSWORD>@cluster0.8z5nqjn.mongodb.net/<SPACE>'
  }
};
```

```bash
npm install
```

## Configuration

Edit `src/config.mjs` with your MongoDB connection string:

```javascript
mongodb: 'mongodb+srv://username:password@cluster.mongodb.net/database'
```

## Usage

Development mode:
```bash
npm run dev
```

API runs on `http://localhost:3000`

## Authentication

Some endpoints require a `user-id` header for authorization:
```
user-id: <USER_OBJECT_ID>
```

## Quick Start

1. Create a user: `POST /user/`
2. Get all users: `GET /users/`
3. Use a user ID in headers for protected endpoints
4. Create groups, events, surveys, and tickets!

## API Documentation

Creted with Postman : https://documenter.getpostman.com/view/41575768/2sB3Wny2ka#17bab6af-ea82-4b90-b472-a82b4846bd90

