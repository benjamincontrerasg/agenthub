import dns from 'dns/promises';
import net from 'net';
import { ValidationError } from './errors.js';

export interface SSRFOptions {
  allowLocalhost?: boolean;
  allowedHosts?: string[];
}

function parseAllowedPrivateHosts(): string[] {
  const envVal = process.env.ALLOWED_PRIVATE_HOSTS || '';
  return envVal
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return false;
  }

  const [a, b] = parts;

  // 127.0.0.0/8 Loopback
  if (a === 127) return true;

  // 10.0.0.0/8 Private
  if (a === 10) return true;

  // 172.16.0.0/12 Private (172.16.0.0 – 172.31.255.255)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.168.0.0/16 Private
  if (a === 192 && b === 168) return true;

  // 169.254.0.0/16 Link-Local / Cloud Metadata (169.254.169.254)
  if (a === 169 && b === 254) return true;

  // 0.0.0.0/8
  if (a === 0) return true;

  // 100.64.0.0/10 Carrier-grade NAT
  if (a === 100 && b >= 64 && b <= 127) return true;

  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();

  // Loopback ::1
  if (lower === '::1' || lower === '0:0:0:0:0:0:0:1') return true;

  // Unique local fc00::/7 (fc.. or fd..)
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true;

  // Link-local fe80::/10 (fe8, fe9, fea, feb)
  if (/^fe[89ab]/i.test(lower)) return true;

  // IPv4-mapped IPv6 ::ffff:192.0.2.1
  if (lower.startsWith('::ffff:')) {
    const v4 = lower.replace('::ffff:', '');
    if (net.isIPv4(v4)) {
      return isPrivateIPv4(v4);
    }
  }

  return false;
}

export function isPrivateIP(ip: string): boolean {
  const version = net.isIP(ip);
  if (version === 4) {
    return isPrivateIPv4(ip);
  }
  if (version === 6) {
    return isPrivateIPv6(ip);
  }
  return false;
}

/**
 * Valida que una URL no sea vector de SSRF.
 * Bloquea IPs privadas, metadatos (169.254.169.254), link-local y localhost,
 * salvo excepciones explícitas. Resuelve DNS para evitar bypasses.
 */
export async function validateSafeUrl(rawUrl: string, options: SSRFOptions = {}): Promise<string> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new ValidationError(`URL inválida: '${rawUrl}'`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new ValidationError(`Protocolo no permitido: '${parsed.protocol}'. Solo se admite http: o https:`);
  }

  const hostname = parsed.hostname.toLowerCase();
  const allowedConfigHosts = parseAllowedPrivateHosts();
  const explicitAllowed = (options.allowedHosts || []).map((h) => h.toLowerCase());
  const allAllowed = [...allowedConfigHosts, ...explicitAllowed];

  if (allAllowed.includes(hostname)) {
    return rawUrl;
  }

  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  if (isLocalhost) {
    if (options.allowLocalhost) {
      return rawUrl;
    }
    throw new ValidationError(`SSRF Protection: Acceso a localhost bloqueado para este proveedor.`);
  }

  // Si hostname ya es una IP directa
  if (net.isIP(hostname)) {
    if (isPrivateIP(hostname)) {
      throw new ValidationError(`SSRF Protection: La IP '${hostname}' pertenece a un rango privado o de metadatos de nube prohibido.`);
    }
    return rawUrl;
  }

  // Resolución DNS para evitar DNS Rebinding o dominios apuntando a IPs internas
  try {
    const lookupResults = await dns.lookup(hostname, { all: true });
    for (const record of lookupResults) {
      if (isPrivateIP(record.address)) {
        throw new ValidationError(
          `SSRF Protection: El host '${hostname}' resuelve a la IP interna '${record.address}', bloqueada por seguridad.`
        );
      }
    }
  } catch (err: any) {
    if (err instanceof ValidationError) throw err;
    throw new ValidationError(`SSRF Protection: Fallo al resolver DNS para el host '${hostname}': ${err.message}`);
  }

  return rawUrl;
}
