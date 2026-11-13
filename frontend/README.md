# AgentHub — Frontend SaaS Platform

Plataforma SaaS moderna, profesional y escalable para conectar múltiples proveedores de Inteligencia Artificial (**Anthropic Claude, OpenAI, Google Gemini, Ollama**), administrar servidores **Model Context Protocol (MCP)**, orquestar **agentes autónomos especializados** y diseñar pipelines colaborativos mediante un **editor visual de flujos de trabajo**.

Diseñado bajo principios de ingeniería de software enterprise, tipado estricto con TypeScript, arquitectura basada en funcionalidades y preparado para despliegue directo en **Vercel**.

---

## 🚀 Stack Tecnológico

| Capa | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Framework** | **React 19** | Renderizado concurrente y componentes funcionales |
| **Lenguaje** | **TypeScript (Strict Mode)** | Contratos de tipos de dominio e interfaces completas |
| **Bundler** | **Vite** | Empaquetado ultra rápido y Hot Module Replacement |
| **Estilos** | **Tailwind CSS v4** | Sistema de diseño oscuro con tokens SaaS personalizados |
| **Componentes UI** | **shadcn/ui Pattern** | Primitivas accesibles y reutilizables sin componentes monolíticos |
| **Navegación** | **React Router (v7)** | Enrutamiento SPA con layout persistente y deep-linking |
| **Estado Global** | **Zustand** | Stores atómicos con persistencia de sesión en cliente |
| **Data Fetching** | **TanStack Query** | Capa desacoplada para queries y caching del backend |
| **Visual Workflows** | **React Flow (`@xyflow/react`)** | Editor gráfico con nodos interactivos y simulación en vivo |
| **Formularios** | **React Hook Form + Zod** | Validación declarativa de esquemas y datos de agentes |
| **Analítica y Gráficos** | **Recharts** | Visualizaciones interactivas de consumo de tokens y costos |
| **Iconografía** | **Lucide React** | Iconos minimalistas y coherentes |
| **Testing** | **Vitest** | Pruebas unitarias automatizadas de stores y utilidades |

---

## 🎨 Identidad Visual y Experiencia de Usuario (UI/UX)

- **Tema Oscuro Predeterminado:** Fondo profundo `#090d16` con superficies en `#0f172a` y bordes discretos `#1e293b`.
- **Acentos:** Violeta (`#8b5cf6`) y azul tecnológico (`#3b82f6`).
- **Jerarquía:** Excelente legibilidad tipográfica, micro-interacciones sin saturación y diseño responsivo adaptado a Desktop, Laptop, Tablet y Móvil.
- **Transparencia:** Badges indicadores de simulación y telemetría en tiempo real.

---

## 📁 Arquitectura del Proyecto

```
frontend/
├── public/
├── src/
│   ├── app/
│   │   ├── App.tsx             # Punto de entrada de la aplicación
│   │   ├── providers.tsx       # QueryClientProvider y contextos globales
│   │   └── router.tsx          # Definición de rutas del SaaS
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx   # Layout principal con banner de simulación
│   │   │   ├── Header.tsx      # Barra superior con buscador ⌘K, notificaciones y perfil
│   │   │   └── Sidebar.tsx     # Barra lateral colapsable y responsiva
│   │   └── ui/                 # Primitivas accesibles (Button, Input, Dialog, etc.)
│   ├── features/
│   │   ├── dashboard/          # Panel de control con métricas, gráficos y estado general
│   │   ├── providers/          # Gestión de Claude, OpenAI, Gemini y Ollama
│   │   ├── agents/             # CRUD de agentes, prompts, hiperparámetros y detalle
│   │   ├── mcp/                # MCP Hub (STDIO/HTTP), esquemas de tools y logs
│   │   ├── workflows/          # Editor React Flow (8 tipos de nodos + simulación en vivo)
│   │   ├── chat/               # Sala multiagente colaborativa con aprobaciones Zero-Trust
│   │   ├── executions/         # Centro de telemetría con línea temporal de eventos
│   │   ├── analytics/          # Gráficos de consumo de tokens y proyección de costos
│   │   └── settings/           # Ajustes de perfil, seguridad, backend y Local Agent
│   ├── services/
│   │   ├── api.ts              # Cliente HTTP desacoplado con normalización de errores
│   │   ├── mock-data.ts        # Conjunto completo de datos realistas preconfigurados
│   │   ├── websocket.ts        # Cliente WebSocket con eventos tipados
│   │   └── *.service.ts        # Servicios por dominio (providers, agents, mcp, workflows, etc.)
│   ├── stores/                 # Zustand stores para agents, providers, mcp, chat, etc.
│   ├── types/                  # Modelos TypeScript completos del dominio
│   └── lib/                    # Utilidades de formato (moneda, tokens, fechas, tailwind-merge)
├── .env.example
├── vercel.json                 # Configuración de rewrite SPA para Vercel
├── package.json
└── vite.config.ts              # Configuración de chunks y alias @/*
```

---

## 🔒 Seguridad y Gobernanza Zero-Trust

1. **Protección de Credenciales:** Las API Keys nunca se almacenan en `localStorage` ni se compilan en variables estáticas en el cliente. Son tratadas como secretos transmitidos exclusivamente por canal TLS seguro.
2. **Sin Ejecución Directa en el Frontend:** El frontend web no ejecuta comandos de terminal ni subprocesos de PowerShell. Toda ejecución corresponde al backend o al Local Agent.
3. **Validación Previa de Servidores MCP:** Los servidores importados quedan inicialmente en estado `pending_validation`.
4. **Punto de Control Humano Obligatorio (Human-in-the-Loop):** Toda herramienta MCP que represente una operación de escritura (`write_file`, creación de PRs) pausa la ejecución y requiere que el operador apruebe explícitamente la acción en la interfaz.

---

## 🛠️ Comandos de Ejecución Local

### 1. Clonar e Instalar Dependencias

```bash
# Navegar a la carpeta del frontend
cd frontend

# Instalar dependencias
npm install
```

### 2. Configurar Variables de Entorno

```bash
# Copiar plantilla
cp .env.example .env
```

Contenido de `.env`:
```env
VITE_API_URL=https://api.agenthub.dev/v1
VITE_WS_URL=wss://api.agenthub.dev/ws
VITE_USE_MOCK=true
```

### 3. Iniciar Servidor de Desarrollo

```bash
npm run dev
```

La aplicación estará disponible inmediatamente en `http://localhost:5173`.

### 4. Ejecutar Suite de Pruebas Unitarias

```bash
npm run test
```

### 5. Compilar para Producción

```bash
npm run build
```

La compilación generará los artefactos optimizados en la carpeta `dist/`.

---

## 🌐 Despliegue en Vercel

El proyecto incluye la configuración requerida en `vercel.json` para enrutamiento SPA y caché de assets.

### Opción A: Despliegue con GitHub + Vercel Dashboard (Recomendado)

1. **Subir el repositorio a GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit of AgentHub SaaS frontend"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/agenthub.git
   git push -u origin main
   ```

2. **Conectar en Vercel**:
   - Ingresa a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
   - Haz clic en **"Add New Project"** e importa el repositorio de **AgentHub**.
   - En **Root Directory**, selecciona la carpeta `frontend` (si el repo tiene estructura monorepo) o déjala en `./` si subiste directamente el frontend.
   - En **Framework Preset**, Vercel detectará automáticamente **Vite**.
   - En **Build Command**: `npm run build`
   - En **Output Directory**: `dist`
   - En **Environment Variables**:
     - `VITE_API_URL` = `https://tu-backend.com/v1` (o la URL de tu API)
     - `VITE_WS_URL` = `wss://tu-backend.com/ws`
     - `VITE_USE_MOCK` = `true` (o `false` cuando conectes el backend)
   - Haz clic en **Deploy**.

### Opción B: Despliegue mediante Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
vercel --prod
```

---

## 🧩 Preparación para Integración con Backend Real

Cuando se desarrolle el backend en Node.js, Python o Go:

1. Modifica `VITE_USE_MOCK=false` en el archivo `.env`.
2. Las llamadas de los componentes ya están desacopladas en `src/services/*.service.ts` y consumen `src/services/api.ts` mediante `fetch` nativo con token Bearer automático y manejo tipado de respuestas.
3. El servicio WebSocket en `src/services/websocket.ts` gestiona reconexión automática y emisión de los eventos requeridos (`agent.started`, `agent.message`, `tool.approval_required`, `workflow.progress`, etc.).
