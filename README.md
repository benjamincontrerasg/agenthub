# AgentHub — Plataforma SaaS Multi-Agente & Orquestador MCP

AgentHub es una plataforma SaaS completa diseñada para conectar múltiples proveedores de inteligencia artificial, diseñar agentes autónomos especializados, administrar servidores MCP (Model Context Protocol) bajo arquitectura Zero-Trust y crear flujos de trabajo colaborativos con editor visual de grafos.

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
│   │   ├── services/
│   │   │   ├── provider.service.ts
│   │   │   ├── agent.service.ts
│   │   │   ├── mcp.service.ts
│   │   │   ├── workflow.service.ts
│   │   │   ├── chat.service.ts
│   │   │   ├── execution.service.ts
│   │   │   ├── analytics.service.ts
│   │   │   ├── settings.service.ts
│   │   │   └── websocket.service.ts
│   │   ├── routes/                # Controladores REST (/v1 y raíz)
│   │   ├── types.ts               # Interfaces de dominio
│   │   └── index.ts               # Servidor HTTP y Gateway WebSocket
│   ├── drizzle.config.ts
│   └── package.json
│
├── frontend/                      # React 19 + TypeScript + Vite + Tailwind CSS v4 + React Flow
│   ├── src/
│   │   ├── features/              # 9 módulos funcionales (Dashboard, Providers, Agents, etc.)
│   │   ├── components/            # Primitivas UI + Layouts + Modales
│   │   ├── services/              # Cliente HTTP + WebSocket + Service layer
│   │   ├── stores/                # Zustand stores con persistencia
│   │   └── types/                 # Interfaces TypeScript del dominio
│   └── package.json
│
└── package.json                   # Scripts unificados de ejecución
```

---

## 🚀 Puesta en Marcha Rápida

### Prerrequisitos
- Node.js >= 20.x
- npm >= 10.x

### 1. Iniciar el Backend
```bash
cd backend
npm install
npm run seed       # Inicializa la base de datos SQLite con los datos base
npm run dev        # Inicia Fastify en http://localhost:3001 (WS en ws://localhost:3001/ws)
```

### 2. Iniciar el Frontend
```bash
cd frontend
npm install
npm run dev        # Inicia Vite en http://localhost:5173
```

O desde la raíz del proyecto:
```bash
npm run dev:backend
npm run dev:frontend
```

---

## 🛡️ Políticas de Seguridad Implementadas

1. **Cifrado de Credenciales en Reposo**: Las claves de API de los proveedores (OpenAI, Anthropic, Gemini) se cifran mediante **AES-256-GCM** antes de persistirse en SQLite y nunca se exponen al cliente.
2. **Aislamiento Zero-Trust para Servidores MCP**:
   - Todo servidor registrado inicia en estado `pending_validation` y desactivado (`isActivated: false`).
   - El frontend jamás ejecuta procesos STDIO o comandos de terminal de forma directa.
   - Las operaciones de escritura (`write_file`, creación de PRs, etc.) requieren **aprobación humana explícita** antes de ejecutarse.
3. **Validación Estricta de Entradas**: Validación de esquemas en todas las rutas con **Zod**.
4. **WebSocket Seguro**: Notificaciones en tiempo real para progreso de workflows, logs y solicitudes de aprobación humana.

---

## 📡 Endpoints de la API REST

| Método | Endpoint | Descripción |
|---|---|---|
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
