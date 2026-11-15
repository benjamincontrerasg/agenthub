#!/usr/bin/env node

import { createBridgeServer } from './server.js';
import { BridgeConfig } from './types.js';

// Parse command line arguments
function parseArgs(): BridgeConfig {
  const args = process.argv.slice(2);
  let port = 8765;
  let host = '127.0.0.1';
  let backendUrl = 'http://localhost:3001';
  let allowStdioExecution = true;
  let token = process.env.BRIDGE_TOKEN || undefined;
  const authorizedDirectories: string[] = [process.cwd()];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--port' || arg === '-p') {
      port = parseInt(args[++i], 10) || port;
    } else if (arg === '--host' || arg === '-h') {
      host = args[++i] || host;
    } else if (arg === '--backend' || arg === '-b') {
      backendUrl = args[++i] || backendUrl;
    } else if (arg === '--token' || arg === '-t') {
      token = args[++i] || token;
    } else if (arg === '--no-stdio') {
      allowStdioExecution = false;
    } else if (arg === '--allow-dir' || arg === '-d') {
      authorizedDirectories.push(args[++i]);
    }
  }

  return {
    port,
    host,
    backendUrl,
    allowStdioExecution,
    authorizedDirectories,
    token,
  };
}

async function start() {
  const config = parseArgs();
  const { fastify, processManager } = createBridgeServer(config);

  console.log(`
┌────────────────────────────────────────────────────────┐
│                NEXORA LOCAL AGENT BRIDGE               │
│       Puente seguro para servidores MCP STDIO          │
└────────────────────────────────────────────────────────┘
  `);
  console.log(`  🌐 Escuchando en: http://${config.host}:${config.port}`);
  console.log(`  🛡️  Sandbox STDIO: ${config.allowStdioExecution ? 'HABILITADO' : 'DESHABILITADO'}`);
  console.log(`  📁 Directorios autorizados:`);
  config.authorizedDirectories.forEach((d) => console.log(`     - ${d}`));
  console.log(`  🔗 NEXORA Backend: ${config.backendUrl}`);
  console.log(`\n  Presiona Ctrl+C para detener el bridge.\n`);

  // Handle graceful shutdown
  const shutdown = () => {
    console.log('\n[Bridge] Deteniendo procesos MCP y cerrando servidor...');
    processManager.stopAll();
    fastify.close().then(() => {
      console.log('[Bridge] Servidor detenido.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  try {
    await fastify.listen({ port: config.port, host: config.host });
  } catch (err: any) {
    console.error(`Error al iniciar el Local Bridge en el puerto ${config.port}:`, err.message);
    process.exit(1);
  }
}

start();
