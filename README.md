# Testing Suite – Setup Guide

This project is a React + Vite frontend with an Express API server that talks directly to MySQL using stored procedures defined in `db/schema.sql`. Follow these steps on a fresh machine.

## Prerequisites
- Node.js 18+ and npm
- MySQL 8.x server with a user that can create databases and run DDL
- Ports: 4000 (API) and 5173 (Vite) available, or override via env

## Install dependencies
```bash
npm install
```

## Database setup
1) Ensure MySQL is running and you know a user/password with create privileges.
2) Apply the schema (creates `testing_platform`, tables, sample data, procedures):
```bash
mysql -u <user> -p < db/schema.sql
```

## Environment variables
Create `.env.local` in the project root:
```
VITE_DB_HOST=127.0.0.1
VITE_DB_PORT=3306
VITE_DB_USER=<mysql user>
VITE_DB_PASSWORD=<mysql password>
VITE_DB_NAME=testing_platform
```

## Start servers
In one terminal (API):
```bash
npm run server
```
In another (frontend):
```bash
npm run dev
```
Open `http://localhost:5173`.

## Sample credentials (seeded)
- Tester: user_name `Tara Tester`, password `testerpass`
- Writer: user_name `Walt Writer`, password `writerpass`

## App flow
- Login or create a user.
- Projects page: manage projects and statuses.
- Project details: manage test cases and runs.
