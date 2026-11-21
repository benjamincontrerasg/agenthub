import { Workflow } from '@/types';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'DevOps & CI/CD' | 'RAG & Knowledge' | 'Security & Audit';
  badge: string;
  workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt' | 'stats'>;
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'template-code-review',
    name: 'Auditoría de Código & Generación de Tests',
    description: 'Architect analiza especificaciones técnicas, Developer implementa tests Vitest y Security Gate autoriza.',
    category: 'DevOps & CI/CD',
    badge: 'Popular',
    workflow: {
      name: 'Auditoría de Código & Generación de Tests',
      description: 'Pipeline automatizado de revisión arquitectónica y generación de suite de pruebas unitarias',
      version: '1.0.0',
      status: 'active',
      nodes: [
        {
          id: 't-start',
          type: 'start',
          position: { x: 100, y: 150 },
          data: { label: 'Recepción de Pull Request', nodeType: 'start' },
        },
        {
          id: 't-arch',
          type: 'agent',
          position: { x: 350, y: 150 },
          data: { label: 'Revisión Arquitecto', nodeType: 'agent', agentId: 'agent-architect' },
        },
        {
          id: 't-cond',
          type: 'condition',
          position: { x: 600, y: 150 },
          data: { label: '¿Arquitectura Válida?', nodeType: 'condition', conditionExpr: 'status === "completed"' },
        },
        {
          id: 't-dev',
          type: 'agent',
          position: { x: 850, y: 150 },
          data: { label: 'Generación de Tests', nodeType: 'agent', agentId: 'agent-developer' },
        },
      ],
      edges: [
        { id: 'e-1', source: 't-start', target: 't-arch' },
        { id: 'e-2', source: 't-arch', target: 't-cond' },
        { id: 'e-3', source: 't-cond', target: 't-dev', sourceHandle: 'true' },
      ],
    },
  },
  {
    id: 'template-rag-ingest',
    name: 'Indexación RAG & Memoria Semántica',
    description: 'Extracción de conocimiento desde documentos técnicos e indexación en base de datos vectorial pgvector.',
    category: 'RAG & Knowledge',
    badge: 'RAG Vector',
    workflow: {
      name: 'Pipeline de Ingesta y Memoria Vectorial',
      description: 'Extracción semántica y cálculo de embeddings de 1536 dimensiones',
      version: '1.0.0',
      status: 'active',
      nodes: [
        {
          id: 'r-start',
          type: 'start',
          position: { x: 100, y: 150 },
          data: { label: 'Webhook de Nuevo Documento', nodeType: 'start' },
        },
        {
          id: 'r-coord',
          type: 'agent',
          position: { x: 350, y: 150 },
          data: { label: 'Extracción Semántica', nodeType: 'agent', agentId: 'agent-coordinator' },
        },
        {
          id: 'r-tool',
          type: 'mcp_tool',
          position: { x: 600, y: 150 },
          data: { label: 'Vector Store Ingestion', nodeType: 'mcp_tool', toolId: 'tool-fs-write' },
        },
      ],
      edges: [
        { id: 're-1', source: 'r-start', target: 'r-coord' },
        { id: 're-2', source: 'r-coord', target: 'r-tool' },
      ],
    },
  },
  {
    id: 'template-security-gate',
    name: 'CI/CD con Compuerta Humana Zero-Trust',
    description: 'Ejecución de cambios en infraestructura condicionada a la aprobación explícita de un operador humano.',
    category: 'Security & Audit',
    badge: 'Zero-Trust',
    workflow: {
      name: 'Despliegue Seguro con Aprobación Humana',
      description: 'Bloqueo preventivo en producción hasta validación de firma y token de operador',
      version: '1.0.0',
      status: 'active',
      nodes: [
        {
          id: 's-start',
          type: 'start',
          position: { x: 100, y: 150 },
          data: { label: 'Deploy Trigger', nodeType: 'start' },
        },
        {
          id: 's-approval',
          type: 'human_approval',
          position: { x: 350, y: 150 },
          data: { label: 'Security Gate (Aprobación)', nodeType: 'human_approval' },
        },
        {
          id: 's-deploy',
          type: 'mcp_tool',
          position: { x: 600, y: 150 },
          data: { label: 'Docker Deploy Local', nodeType: 'mcp_tool', toolId: 'tool-fs-write' },
        },
      ],
      edges: [
        { id: 'se-1', source: 's-start', target: 's-approval' },
        { id: 'se-2', source: 's-approval', target: 's-deploy' },
      ],
    },
  },
  {
    id: 'template-ollama-local',
    name: 'DevOps Local & Generación Privada (Ollama $0)',
    description: 'Generación y ejecución de scripts locales con Ollama (Llama 3 / CodeLlama) sin salir a internet.',
    category: 'DevOps & CI/CD',
    badge: 'Ollama Local',
    workflow: {
      name: 'DevOps Privado con Modelo Local Ollama',
      description: 'Inferencia offline a costo $0 para tareas de infraestructura y testing interno',
      version: '1.0.0',
      status: 'active',
      nodes: [
        {
          id: 'ol-start',
          type: 'start',
          position: { x: 100, y: 150 },
          data: { label: 'Evento de Commit Git', nodeType: 'start' },
        },
        {
          id: 'ol-agent',
          type: 'agent',
          position: { x: 350, y: 150 },
          data: { label: 'Ollama Dev Agent', nodeType: 'agent', providerId: 'ollama', description: 'Inferencia local Llama 3' },
        },
        {
          id: 'ol-mcp',
          type: 'mcp_tool',
          position: { x: 600, y: 150 },
          data: { label: 'MCP Run Tests', nodeType: 'mcp_tool', toolId: 'tool-run-tests' },
        },
        {
          id: 'ol-end',
          type: 'end',
          position: { x: 850, y: 150 },
          data: { label: 'Reporte Completado', nodeType: 'end' },
        },
      ],
      edges: [
        { id: 'oe-1', source: 'ol-start', target: 'ol-agent' },
        { id: 'oe-2', source: 'ol-agent', target: 'ol-mcp' },
        { id: 'oe-3', source: 'ol-mcp', target: 'ol-end' },
      ],
    },
  },
  {
    id: 'template-multi-brain',
    name: 'Investigación & Síntesis Multi-Cerebro (Gemini + Claude)',
    description: 'Gemini 2.5 investiga y extrae información a alta velocidad, y Claude 3.7 sintetiza y valida el documento final.',
    category: 'RAG & Knowledge',
    badge: 'Multi-Brain',
    workflow: {
      name: 'Síntesis Documental Multi-Cerebro',
      description: 'Colaboración híbrida de modelos especializados en búsqueda y redacción ejecutiva',
      version: '1.0.0',
      status: 'active',
      nodes: [
        {
          id: 'mb-start',
          type: 'start',
          position: { x: 100, y: 150 },
          data: { label: 'Prompt de Investigación', nodeType: 'start' },
        },
        {
          id: 'mb-gemini',
          type: 'agent',
          position: { x: 350, y: 150 },
          data: { label: 'Gemini Research Agent', nodeType: 'agent', providerId: 'gemini', description: 'Extracción rápida de contexto' },
        },
        {
          id: 'mb-claude',
          type: 'agent',
          position: { x: 600, y: 150 },
          data: { label: 'Claude Synthesizer Agent', nodeType: 'agent', providerId: 'anthropic', description: 'Razonamiento y redacción estructurada' },
        },
        {
          id: 'mb-output',
          type: 'output',
          position: { x: 850, y: 150 },
          data: { label: 'Publicación de Reporte Markdown', nodeType: 'output' },
        },
      ],
      edges: [
        { id: 'me-1', source: 'mb-start', target: 'mb-gemini' },
        { id: 'me-2', source: 'mb-gemini', target: 'mb-claude' },
        { id: 'me-3', source: 'mb-claude', target: 'mb-output' },
      ],
    },
  },
];
