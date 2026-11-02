# HopeHarbor — Server API

Express.js & TypeScript REST API for the HopeHarbor Social Development Platform.

## 🛠️ Endpoints Overview

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/health` | Public | Server health status |
| **GET** | `/api/events/recent` | Public | Returns 6 nearest upcoming events via MongoDB `.limit(6)` |
| **GET** | `/api/events/upcoming` | Public | All future events with search and category filtering |
| **GET** | `/api/events/:id` | Public | Event details by ID |
| **POST** | `/api/events` | Protected | Create a new community event (Future dates only) |
| **GET** | `/api/events/user/my-events` | Protected | Fetch events created by logged-in organizer |
| **PUT** | `/api/events/:id` | Protected | Update event (Creator only) |
| **DELETE** | `/api/events/:id` | Protected | Delete event and cleanup RSVPs (Creator only) |
| **POST** | `/api/events/:id/join` | Protected | Join event & increment attendee counter |
| **GET** | `/api/events/:id/join-status` | Protected | Check if current user has joined |
| **GET** | `/api/events/joined/me` | Protected | Fetch joined drives sorted by event date |
| **GET** | `/api/users/profile` | Protected | User profile details and impact counters |
| **PATCH** | `/api/users/profile` | Protected | Update user name and avatar image |

## 🚀 Running Locally
```bash
cd server
npm install
npm run dev