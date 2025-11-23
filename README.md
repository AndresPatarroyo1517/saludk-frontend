# SaludK Frontend

El servicio frontend realizado con Nextjs 16

## 📋 Table of Contents

- [About](#about)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🎯 About

Esta es la parte frontend, de nuestro sistema de salud llamado Salud K que se conecta con nuestra API Express

## 🛠️ Technology Stack

- **Runtime Environment**: Node.js
- **Framework**: NextJS

## 📦 Prerequisites

Deberas tener como minimo

- **Node.js** (v14.x or higher recommended)
- **npm** (v6.x or higher) or **yarn**
- **Git**

Revisa con:

```bash
node --version
npm --version
```

## 🚀 Installation

1. **Clona el repo**

```bash
git clone https://github.com/AndresPatarroyo1517/saludk-frontend.git
cd saludk-frontend
```

2. **Instala las dependencias**

```bash
npm install
# or
yarn install
```

## ⚙️ Configuration

1. **Crea las varianbles de entorno adecuadas**

Este es un ejemplo de uso:

```bash
cp .env.example .env
```

2. **Configura las variables de entorno**

Edita el `.env.local` en tu configuración:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
STRIPE_SECRET_KEY=...
NEXTAUTH_URL=...
NEXT_PUBLIC_API_URL=...
```

## 🏃 Corre el servidor de NextJS

### Modo desarrollador

```bash
npm run dev
# or
yarn dev
```

El servidor por defecto iniciara en el puerto 4000, el link: `http://localhost:4000/`

### Modo producción

```bash
npm start
# or
yarn start
```

## 📁 Project Structure

```
saludk-backend/
│
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers (business logic)
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── middlewares/     # Custom middleware functions
│   ├── utils/           # Utility functions and helpers
│   ├── services/        # Business logic services
│   └── app.js           # Express app setup
│
├── tests/               # Test files
├── docs/                # Documentation
├── .env.example         # Example environment variables
├── .gitignore          # Git ignore file
├── package.json        # Project dependencies and scripts
└── README.md           # Project documentation
```

La aplicacion se puede desplegar en :

- **Heroku**
- **AWS**
- **Google Cloud Platform**
- **Azure**
- **Vercel**


## 📝 License

Este proyecto tiene licencia MIT - see the [LICENSE](LICENSE)

## 👥 Authors

- **Andres Patarroyo** - [AndresPatarroyo1517](https://github.com/AndresPatarroyo1517)
- **Sergio Peinado**
- **Santiago Gonzalez**
- **Michael Castillo**
