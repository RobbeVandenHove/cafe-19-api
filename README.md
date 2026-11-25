# TypeScript REST API Starter

A ready-to-use base project for building REST APIs with **TypeScript**, **Express.js**, and **MikroORM**.

The purpose of this repository is to provide a basic project setup so you do not have to configure a new REST API project from scratch every time.

The repository contains the required configuration, database connection, utilities, error handling, routing setup, testing setup, and other common functionality needed to get started.

## Technologies

* **TypeScript** - Programming language
* **Express.js** - REST API framework
* **MikroORM** - ORM for database interaction
* **PostgreSQL** - Database
* **Jest** - Testing framework
* **Supertest** - API testing
* **Nodemailer** - Email functionality
* **Winston** - Logging
* **JWT** - Authentication
* **bcrypt** - Password hashing

## Using This Repository

This repository is intended to be **downloaded and used as the starting point for a new project**.

Download the repository and place it in the directory where you want to create your project. You can then modify the existing code and add your own modules and functionality.

After downloading the project, install the dependencies:

```bash
npm install
```

You can then start developing your API.

> This repository is intended as a downloadable starting point. Do not clone or fork this repository for your own project.

## Running the Project

During development, start the API using:

```bash
npm run dev
```

This starts the application using Nodemon and automatically restarts the server when changes are detected.

To build the project:

```bash
npm run build
```

The compiled application can then be started using:

```bash
npm start
```

## Database

The project uses **PostgreSQL** together with **MikroORM**.

The database connection is managed through the database utility in:

```text
src/utils/database.ts
```

The MikroORM configuration can be found in:

```text
mikro-orm.config.ts
```

### Migrations

Create a new migration with:

```bash
npm run m:g:c
```

Apply pending migrations with:

```bash
npm run m:g:u
```

### Seed Data

Initial database data can be added using the database seeder.

The seeder is located at:

```text
seeder/DatabaseSeeder.ts
```

Run the seeder with:

```bash
npm run seed
```

## Project Structure

The project uses a modular structure. Application-specific functionality should be placed inside the `modules` directory.

```text
.
├── src/
│   ├── modules/
│   │   └── ...
│   │
│   ├── utils/
│   │   ├── routing.ts
│   │   ├── logger.ts
│   │   ├── dto.validator.ts
│   │   ├── database.ts
│   │   ├── custom-base-entity.ts
│   │   ├── api.error.ts
│   │   └── abstract-router.ts
│   │
│   ├── server.ts
│   └── index.ts
│
├── seeder/
│   └── DatabaseSeeder.ts
│
├── .gitignore
├── mikro-orm.config.ts
├── package.json
└── tsconfig.json
```

### `src/modules`

This directory contains the functionality of your application.

Each module should contain functionality that belongs together. For example:

```text
modules/
├── users/
├── authentication/
└── products/
```

Modules can contain their own controllers, services, entities, DTOs, and other functionality required by that module.

This keeps related functionality together and makes the application easier to maintain as it grows.

### `src/utils`

The `utils` directory contains functionality that can be used throughout the application.

#### `routing.ts`

Initialises and registers the routes provided by the module controllers.

#### `logger.ts`

Provides logging functionality for development and application information.

#### `dto.validator.ts`

Provides validation for incoming requests using DTOs and `class-validator`.

#### `database.ts`

Provides a singleton database connection using MikroORM.

#### `custom-base-entity.ts`

Provides a base entity that other entities can inherit from.

The base entity contains common fields such as:

* `id`
* `createdAt`
* `updatedAt`

Example:

```typescript
export class User extends CustomBaseEntity {
    // ...
}
```

#### `api.error.ts`

Contains custom exceptions that can be thrown by the API.

These can be used to return consistent error responses to API clients.

#### `abstract-router.ts`

Provides the base structure for controllers and ensures that controllers register their routes consistently.

### `src/server.ts`

Responsible for starting the Express server and initialising the database connection.

### `src/index.ts`

The entry point of the application.

## Environment Variables

Environment-specific configuration should be stored in a `.env` file.

Do not commit sensitive information such as database passwords, API keys, or authentication secrets to the repository.

Create your own `.env` file when setting up a new project.

## Available Scripts

| Command         | Description                               |
| --------------- | ----------------------------------------- |
| `npm run dev`   | Start the development server with Nodemon |
| `npm run build` | Compile the TypeScript project            |
| `npm start`     | Start the compiled application            |
| `npm run m:g:c` | Create a MikroORM migration               |
| `npm run m:g:u` | Apply pending MikroORM migrations         |
| `npm run seed`  | Run the database seeder                   |

## Purpose

The goal of this repository is to remove repetitive setup work when starting a new REST API.

Instead of configuring TypeScript, Express.js, MikroORM, database connectivity, routing, validation, error handling, logging, and testing from scratch, you can download this repository and immediately start building your application.

The starter provides the foundation. The application-specific functionality is then built inside the `modules` directory.
