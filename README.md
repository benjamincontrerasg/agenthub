# AgentHub — Plataforma SaaS Multi-Agente & Orquestador MCP

![CI](https://github.com/benjamincontrerasg/agenthub/actions/workflows/ci.yml/badge.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-violet.svg)
![Node](https://img.shields.io/badge/Node-%3E%3D20-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)

AgentHub es una plataforma SaaS completa diseñada para conectar múltiples proveedores de inteligencia artificial, diseñar agentes autónomos especializados, administrar servidores MCP (Model Context Protocol) bajo arquitectura Zero-Trust y crear flujos de trabajo colaborativos con editor visual de grafos.

<p align="center">
  <strong>Claude · GPT · Gemini · Ollama</strong> — Un solo panel, múltiples cerebros.
</p>

---

## ✨ Características Principales

- 🤖 **Multi-Agente**: Orquesta agentes autónomos con roles especializados (Investigador, Analista, Redactor, Auditor)
- 🔌 **Multi-Proveedor**: Conecta Claude (Anthropic), GPT (OpenAI), Gemini (Google) y modelos locales via Ollama
- 🧩 **MCP Hub**: Registra, valida y gestiona servidores Model Context Protocol (STDIO y HTTP)
- 🔄 **Workflow Visual**: Editor de grafos drag-and-drop con React Flow para diseñar pipelines multi-agente
- 💬 **Chat Multi-Agente**: Conversaciones donde múltiples agentes colaboran con delegación automática
- 🔐 **Seguridad**: Cifrado AES-256-GCM de API keys, validación Zero-Trust de servidores MCP, aprobación humana para operaciones sensibles
- 📊 **Analytics**: Dashboard con métricas de consumo de tokens, costos por proveedor y tasas de éxito
- 🏷️ **Branding Visual**: Logos oficiales SVG de cada proveedor de IA integrados en toda la interfaz

---

## 🏛️ Arquitectura del Sistema

```
agenthub/
├── backend/                       # Fastify 5 + TypeScript + SQLite + Drizzle ORM + WebSocket
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.ts          # Esquema relacional Drizzle (18 tablas)
│   │   │   ├── connection.ts      # Conexión SQLite con WAL mode y foreign keys
│   │   │   └── seed.ts            # Seed idempotente con datos de prueba
│   │   ├── lib/
│   │   │   ├── crypto.ts          # AES-256-GCM para cifrado de API Keys en reposo
│   │   │   ├── errors.ts          # Clases normalizadas de errores HTTP
│   │   │   └── validators.ts      # Esquemas de validación Zod
│   │   ├── services/              # Lógica de negocio (providers, agents, mcp, workflows, chat...)
│   │   ├── routes/                # Controladores REST (/v1 y raíz)
│   │   └── index.ts               # Servidor HTTP y Gateway WebSocket
│   ├── drizzle.config.ts
│   └── package.json
│
├── frontend/                      # React 19 + TypeScript + Vite + Tailwind CSS v4 + React Flow
│   ├── src/
│   │   ├── features/              # 9 módulos funcionales (Dashboard, Providers, Agents, etc.)
│   │   ├── components/            # Primitivas UI + Layouts + Modales + ProviderLogo + AgentAvatar
│   │   ├── services/              # Cliente HTTP + WebSocket + Service layer
│   │   ├── stores/                # Zustand stores con persistencia
│   │   └── types/                 # Interfaces TypeScript del dominio
│   └── package.json
│
├── bridge/                        # Local Agent CLI Bridge (Ejecución segura de MCP STDIO)
│   ├── src/
│   │   ├── cli.ts                 # CLI ejecutable con argumentos y banner ASCII
│   │   ├── server.ts              # API HTTP local en puerto 8765
│   │   ├── sandbox.ts             # Validación Zero-Trust de binarios y rutas autorizadas
│   │   └── process-manager.ts     # Gestión de procesos hijos STDIO y canal JSON-RPC
│   └── package.json
│
├── .github/workflows/ci.yml      # CI/CD: lint, build, test, audit, CodeQL, Docker build
├── docker-compose.yml             # Despliegue containerizado
└── package.json                   # Scripts unificados de ejecución
```

---

## 🚀 Puesta en Marcha Rápida

### Prerrequisitos
- Node.js >= 20.x
- npm >= 10.x

### 1. Clonar y configurar variables de entorno

```bash
git clone https://github.com/benjamincontrerasg/agenthub.git
cd agenthub

# Configurar variables de entorno del backend
cp backend/.env.example backend/.env
# ⚠️ Edita backend/.env y cambia ENCRYPTION_KEY (ver sección Variables de Entorno)
```

### 2. Iniciar el Backend
```bash
cd backend
npm install
npm run seed       # Inicializa la base de datos SQLite con los datos base
npm run dev        # Inicia Fastify en http://localhost:3001 (WS en ws://localhost:3001/ws)
```

### 3. Iniciar el Frontend
```bash
cd frontend
npm install
npm run dev        # Inicia Vite en http://localhost:5173
```

### 4. Iniciar el Local Agent Bridge (Opcional para servidores MCP STDIO locales)
```bash
cd bridge
npm install
npm run dev        # Escucha en http://127.0.0.1:8765
```

O desde la raíz del proyecto:
```bash
npm run dev:backend
npm run dev:frontend
npm run dev:bridge
```

---

## 🐳 Despliegue con Docker Compose

El proyecto incluye un `docker-compose.yml` listo para levantar backend y frontend en contenedores:

```bash
# 1. Configura la clave de cifrado
cp .env.example .env
# Edita .env y genera una ENCRYPTION_KEY segura (ver abajo)

# 2. Construir y levantar
docker compose up -d --build
```

| Servicio | URL | Puerto |
|----------|-----|--------|
| Frontend | http://localhost | 80 |
| Backend API | http://localhost:3001 | 3001 |
| WebSocket | ws://localhost:3001/ws | 3001 |

Los datos de SQLite se persisten en el volumen `agenthub-db-data`.

> ⚠️ **Importante**: Nunca uses la clave de cifrado por defecto en producción. Genera una clave segura antes de desplegar (ver sección siguiente).

---

## 🔐 Variables de Entorno

### Backend (`backend/.env`)

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `PORT` | Puerto del servidor HTTP Fastify | `3001` |
| `HOST` | Host de escucha | `0.0.0.0` |
| `DATABASE_URL` | Ruta a la base de datos SQLite | `./data/agenthub.db` |
| `CORS_ORIGIN` | Orígenes permitidos para CORS (separados por coma) | `http://localhost:5173` |
| `ENCRYPTION_KEY` | Clave para cifrado AES-256-GCM con derivación scrypt | ⚠️ **Obligatorio cambiar** |

#### Generar una clave de cifrado segura

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Esto genera una clave hexadecimal de 64 caracteres. Cópiala al valor de `ENCRYPTION_KEY` en tu `.env`.

### Frontend (`frontend/.env`)

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `VITE_API_URL` | URL base del backend REST | `http://localhost:3001/v1` |
| `VITE_WS_URL` | URL del servidor WebSocket | `ws://localhost:3001/ws` |
| `VITE_USE_MOCK` | Usar datos simulados (`true`/`false`) | `true` |

> **Nota**: Las variables `VITE_*` se exponen al cliente. Nunca coloques credenciales secretas en variables con prefijo `VITE_`.

### Docker Compose (`.env` en la raíz)

| Variable | Descripción |
|----------|-------------|
| `ENCRYPTION_KEY` | Clave AES-256-GCM requerida por el contenedor backend |

---

## 🛡️ Políticas de Seguridad Implementadas

1. **Cifrado de Credenciales en Reposo**: Las claves de API de los proveedores (OpenAI, Anthropic, Gemini) se cifran mediante **AES-256-GCM** con derivación de clave vía **scrypt** antes de persistirse en SQLite y nunca se exponen al cliente.
2. **Aislamiento Zero-Trust para Servidores MCP**:
   - Todo servidor registrado inicia en estado `pending_validation` y desactivado (`isActivated: false`).
   - El frontend jamás ejecuta procesos STDIO o comandos de terminal de forma directa.
   - Las operaciones de escritura (`write_file`, creación de PRs, etc.) requieren **aprobación humana explícita** antes de ejecutarse.
3. **Validación Estricta de Entradas**: Validación de esquemas en todas las rutas con **Zod**.
4. **WebSocket Seguro**: Notificaciones en tiempo real para progreso de workflows, logs y solicitudes de aprobación humana.

---

## 🔒 Autenticación y Multi-Tenancy

> **Estado actual**: La versión actual de AgentHub es **single-tenant** y **no incluye autenticación de usuarios**. La API REST en el puerto 3001 es abierta por diseño para facilitar el desarrollo local.

### ⚠️ Consideraciones para Producción

Si despliegas AgentHub en un entorno accesible desde la red, **debes** proteger la API detrás de un reverse proxy con autenticación. Opciones recomendadas:

- **Nginx** con autenticación básica o OAuth2 Proxy
- **Traefik** con middleware de autenticación
- **API Gateway** (Kong, AWS API Gateway) con API keys o JWT

### 🗺️ Roadmap de Autenticación

- [ ] Autenticación JWT con refresh tokens
- [ ] Roles y permisos (RBAC)
- [ ] Multi-tenancy por organización
- [ ] Rate limiting por usuario
- [ ] Audit logging de acciones sensibles

---

## 📡 Endpoints de la API REST

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/health` | Chequeo de estado del servicio |
| `GET` | `/v1/providers` | Lista de proveedores de IA configurados |
| `POST` | `/v1/providers/:id/connect` | Conectar y cifrar API key |
| `POST` | `/v1/providers/:id/test` | Prueba de latencia y conectividad |
| `GET` | `/v1/agents` | Catálogo de agentes autónomos |
| `POST` | `/v1/agents` | Creación de nuevo agente con validación Zod |
| `PATCH` | `/v1/agents/:id` | Modificación de configuración y herramientas |
| `DELETE` | `/v1/agents/:id` | Eliminación de agente |
| `GET` | `/v1/mcp/servers` | Servidores MCP, herramientas y logs |
| `POST` | `/v1/mcp/servers` | Registro de servidor (STDIO o HTTP) |
| `POST` | `/v1/mcp/servers/:id/validate` | Validación y descubrimiento de herramientas |
| `PATCH` | `/v1/mcp/servers/:id/activation` | Activar / desactivar servidor |
| `GET` | `/v1/workflows` | Listado de flujos de trabajo |
| `PUT` | `/v1/workflows/:id` | Guardar nodos y aristas del flujo |
| `POST` | `/v1/workflows/:id/execute` | Ejecutar grafo de workflow con WebSocket |
| `GET` | `/v1/chat/conversations` | Historial de conversaciones multi-agente |
| `POST` | `/v1/chat/conversations/:id/messages` | Enviar mensaje y orquestar respuesta multi-agente |
| `POST` | `/v1/chat/approvals/:id/respond` | Aprobar / rechazar operación sensible |
| `GET` | `/v1/executions` | Registro de ejecuciones, steps y timeline |
| `POST` | `/v1/executions/:id/cancel` | Cancelar ejecución en progreso |
| `GET` | `/v1/analytics` | Métricas de consumo de tokens y costos |
| `GET` / `PUT` | `/v1/settings` | Preferencias y políticas de seguridad |

---

## 🧪 Testing y CI/CD

El proyecto incluye un pipeline de GitHub Actions (`.github/workflows/ci.yml`) que ejecuta automáticamente:

| Job | Descripción |
|-----|-------------|
| **lint-and-build** | Instalación de dependencias + TypeScript build completo |
| **test** | Tests unitarios con Vitest (frontend y backend) |
| **security-audit** | `npm audit --audit-level=high` en los 3 módulos |
| **codeql** | Análisis estático de seguridad con CodeQL (JavaScript/TypeScript) |
| **docker-build** | Verificación de build de imágenes Docker (sin push) |

Para ejecutar los tests localmente:
```bash
# Desde la raíz
npm run test

# O individualmente
npm run test:frontend
npm run test:backend
```

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
|------|-------------|
| **Frontend** | React 19, TypeScript 5.7, Vite, Tailwind CSS v4, React Flow, Recharts, Zustand, Lucide Icons |
| **Backend** | Fastify 5, TypeScript, Drizzle ORM, SQLite (WAL mode), Zod, WebSocket |
| **IA** | OpenAI SDK, Anthropic SDK, Google Generative AI, Ollama (local) |
| **MCP** | Model Context Protocol SDK, JSON-RPC 2.0 sobre STDIO |
| **Infra** | Docker, Docker Compose, GitHub Actions, Nginx |
| **Seguridad** | AES-256-GCM + scrypt, Zero-Trust sandbox, Human-in-the-loop approval |

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

---

<p align="center">
  Hecho con 🧠 por <a href="https://github.com/benjamincontrerasg">Benjamin Contreras</a>
</p>
