# Arquitetura do Sistema de Cloaking

Documentação técnica completa da arquitetura do sistema.

## 📐 Visão Geral

```
┌─────────────────────────────────────────────────────────────┐
│                         USUÁRIO                              │
│                      (Navegador Web)                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP Request
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL EDGE NETWORK                       │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              MIDDLEWARE (middleware.ts)             │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │ 1. Intercepta TODAS as requisições           │  │    │
│  │  │ 2. Verifica cookie '_verify_token'           │  │    │
│  │  │ 3. Valida JWT (assinatura, expiração)        │  │    │
│  │  │ 4. Redireciona se inválido                   │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
│                       │                                      │
│                       │ Token válido?                        │
│                       ├─── SIM ──► Permite acesso            │
│                       └─── NÃO ──► Redireciona para /        │
└───────────────────────┬──────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
    ┌───────┐    ┌──────────┐    ┌──────────┐
    │   /   │    │ /acesso  │    │ /resgate │
    │Bloquei│    │Verifica  │    │Protegido │
    └───────┘    └──────────┘    └──────────┘
                       │
                       │ Coleta fingerprint
                       ▼
            ┌──────────────────────┐
            │  lib/fingerprint.ts  │
            │  ┌────────────────┐  │
            │  │ Canvas        │  │
            │  │ WebGL         │  │
            │  │ Timezone      │  │
            │  │ Screen        │  │
            │  │ Mouse         │  │
            │  │ Fonts         │  │
            │  │ Time on page  │  │
            │  └────────────────┘  │
            └──────────┬───────────┘
                       │
                       │ POST /api/validate-access
                       ▼
            ┌───────────────────────┐
            │  api/validate-access  │
            │  ┌─────────────────┐  │
            │  │ Rate Limiting   │  │
            │  │ Validate Data   │  │
            │  │ Calculate Score │  │
            │  │ Generate JWT    │  │
            │  │ Set Cookie      │  │
            │  └─────────────────┘  │
            └──────────┬────────────┘
                       │
                       ├─── Score >= 70 ──► Token válido (200)
                       └─── Score < 70 ───► Bloqueado (403)
```

## 🔧 Componentes Principais

### 1. Middleware (`middleware.ts`)

**Função**: Interceptação global de requisições

**Executa em**: Vercel Edge (mais próximo do usuário)

**Fluxo**:
```typescript
Request → Middleware
         │
         ├─ Path = /resgate/* ?
         │  ├─ Token existe?
         │  │  ├─ Token válido?
         │  │  │  ├─ SIM → Allow
         │  │  │  └─ NÃO → Redirect /
         │  │  └─ NÃO → Redirect /
         │  └─ Não é /resgate
         │     └─ Allow
         └─ Continue
```

**Validações**:
1. Formato JWT (3 partes)
2. Campos obrigatórios (fp, iat, exp)
3. Expiração (exp > now)
4. Idade máxima (< 24h)

**Performance**: ~10ms overhead por request

### 2. Fingerprinting (`lib/fingerprint.ts`)

**Classe**: `BrowserFingerprint`

**Dados Coletados**:

```typescript
interface FingerprintData {
  // Identificação
  userAgent: string;              // Mozilla/5.0...
  platform: string;               // Win32, MacIntel, Linux...

  // Localização
  language: string;               // pt-BR
  languages: string[];            // [pt-BR, en-US, ...]
  timezone: string;               // America/Sao_Paulo
  timezoneOffset: number;         // -180

  // Tela
  screen: {
    width: number;                // 1920
    height: number;               // 1080
    availWidth: number;           // 1920
    availHeight: number;          // 1040
    colorDepth: number;           // 24
    pixelDepth: number;           // 24
  };

  // Renderização (Detecta bots)
  canvas: string;                 // Hash único do canvas
  webgl: string;                  // GPU info

  // Sistema
  plugins: string[];              // Plugins instalados
  fonts: string[];                // Fontes detectadas
  touchSupport: boolean;          // É touch device?
  hardwareConcurrency: number;    // Núcleos de CPU
  deviceMemory: number;           // RAM (GB)
  doNotTrack: string | null;      // DNT header

  // Comportamento (Detecta automação)
  mouseMovement: boolean;         // Moveu o mouse?
  timeOnPage: number;             // Segundos na página
}
```

**Métodos Principais**:

```typescript
// Coleta completa (async)
async collect(): Promise<FingerprintData>

// Canvas fingerprint
private async getCanvasFingerprint(): Promise<string>

// WebGL fingerprint
private getWebGLFingerprint(): string

// Detecção de fontes
private async getFonts(): Promise<string[]>

// Hash do fingerprint
generateFingerprintHash(data: FingerprintData): string
```

### 3. Validação (`lib/validator.ts`)

**Classe**: `FingerprintValidator`

**Sistema de Score**:

```typescript
// Cada check retorna 0-10 pontos
interface Check {
  score: number;    // 0-10
  reason: string;   // Motivo do score
}

// 10 checks = 100 pontos máximo
checks = [
  checkUserAgent(),        // 10 pontos
  checkCanvas(),           // 10 pontos
  checkWebGL(),            // 10 pontos
  checkScreen(),           // 10 pontos
  checkTimezone(),         // 10 pontos
  checkLanguage(),         // 10 pontos
  checkPluginsAndFonts(),  // 10 pontos
  checkMouseMovement(),    // 10 pontos
  checkTimeOnPage(),       // 10 pontos
  checkHardware(),         // 10 pontos
];

// Score final = (soma / 100) * 100
finalScore = Math.round((totalScore / 100) * 100);

// Validação
isValid = finalScore >= 70;
```

**Exemplo de Validação**:

```typescript
// Usuário Real (Desktop Chrome)
{
  checkUserAgent: { score: 10, reason: "User-Agent válido" },
  checkCanvas: { score: 10, reason: "Canvas fingerprint válido" },
  checkWebGL: { score: 10, reason: "WebGL fingerprint válido" },
  checkScreen: { score: 10, reason: "Resolução comum" },
  checkTimezone: { score: 10, reason: "Timezone válido" },
  checkLanguage: { score: 10, reason: "Idiomas válidos" },
  checkPluginsAndFonts: { score: 10, reason: "12 fontes detectadas" },
  checkMouseMovement: { score: 10, reason: "Movimento de mouse detectado" },
  checkTimeOnPage: { score: 10, reason: "Tempo na página adequado (3s)" },
  checkHardware: { score: 10, reason: "Hardware normal" }
}
Total: 100/100 = 100% ✅ APROVADO

// Bot (cURL)
{
  checkUserAgent: { score: 2, reason: "User-Agent suspeito: contém 'curl'" },
  checkCanvas: { score: 0, reason: "Canvas fingerprint ausente" },
  checkWebGL: { score: 0, reason: "WebGL não disponível" },
  checkScreen: { score: 0, reason: "Dados de tela ausentes" },
  checkTimezone: { score: 0, reason: "Timezone ausente" },
  checkLanguage: { score: 0, reason: "Idioma ausente" },
  checkPluginsAndFonts: { score: 3, reason: "Nenhuma fonte detectada" },
  checkMouseMovement: { score: 5, reason: "Nenhum movimento (pode ser mobile)" },
  checkTimeOnPage: { score: 2, reason: "Tempo na página muito curto (0s)" },
  checkHardware: { score: 4, reason: "Hardware concurrency não disponível" }
}
Total: 16/100 = 16% ❌ BLOQUEADO
```

### 4. API de Validação (`pages/api/validate-access.ts`)

**Tipo**: Serverless Function (Edge Runtime)

**Fluxo**:

```typescript
Request → Rate Limit Check
         │
         ├─ Limit exceeded?
         │  ├─ YES → HTTP 429
         │  └─ NO → Continue
         │
         └→ Validate Fingerprint
            │
            ├─ Score >= 70?
            │  ├─ YES → Generate JWT
            │  │        Set Cookie
            │  │        Return 200
            │  └─ NO  → Return 403
            └─ Error → Return 500
```

**Rate Limiting**:

```typescript
// In-memory store
Map<IP, { count: number, resetTime: timestamp }>

// Exemplo:
"192.168.1.1" => { count: 2, resetTime: 1704067200000 }

// Limites:
Max tentativas: 3 por IP
Janela: 1 hora (3600s)
Reset: Automático após janela
```

**JWT Token**:

```typescript
// Payload
{
  fp: "abc123xyz",        // Hash do fingerprint
  iat: 1704038400,        // Issued At (Unix timestamp)
  exp: 1704124800         // Expires (iat + 86400s = 24h)
}

// Assinatura
Algorithm: HS256 (HMAC-SHA256)
Secret: JWT_SECRET (env var)

// Token final
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcCI6ImFiYzEyM3h5eiIsImlhdCI6MTcwNDAzODQwMCwiZXhwIjoxNzA0MTI0ODAwfQ.signature
```

**Cookie Configuration**:

```typescript
Set-Cookie: _verify_token=<JWT>;
  Path=/;
  HttpOnly;       // Não acessível via JavaScript
  Secure;         // Apenas HTTPS
  SameSite=Strict;// Proteção CSRF
  Max-Age=86400   // 24 horas
```

### 5. Páginas

#### `/` (index.tsx)
- Tela de "Access Restricted"
- Design minimalista
- Sem links visíveis
- Sem menção a outras rotas

#### `/acesso` (acesso.tsx)
- Loading com progress bar
- Coleta fingerprint em background
- Envia para API após 2-3s
- Redireciona para `/resgate` se aprovado
- Redireciona para `/` se rejeitado

#### `/resgate` (resgate/index.tsx)
- Conteúdo protegido
- Só acessível com token válido
- Middleware valida em cada acesso
- Header com status da sessão

## 🔐 Segurança

### Camadas de Proteção

```
┌─────────────────────────────────────────────┐
│         Layer 1: HTTP Headers               │
│  X-Frame-Options, CSP, etc.                 │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         Layer 2: Middleware                 │
│  Token validation, Redirect logic           │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         Layer 3: Rate Limiting              │
│  3 attempts per IP/hour                     │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         Layer 4: Fingerprinting             │
│  10+ checks, Score-based validation         │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         Layer 5: JWT Token                  │
│  Signed, Expires, HttpOnly                  │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         Layer 6: Secure Cookies             │
│  HttpOnly, Secure, SameSite                 │
└─────────────────────────────────────────────┘
```

### Vetores de Ataque Mitigados

| Ataque | Mitigação | Status |
|--------|-----------|--------|
| **Bot Simples (curl)** | User-Agent check, Score baixo | ✅ Bloqueado |
| **Headless Browser** | Canvas/WebGL ausente, Score baixo | ✅ Bloqueado |
| **Scraper** | Multiple checks, Score baixo | ✅ Bloqueado |
| **Brute Force** | Rate limiting (3/hour) | ✅ Bloqueado |
| **Token Replay** | Expiração (24h) | ✅ Mitigado |
| **CSRF** | SameSite=Strict cookie | ✅ Bloqueado |
| **XSS** | HttpOnly cookie | ✅ Bloqueado |
| **MITM** | HTTPS only, Secure flag | ✅ Bloqueado |
| **Clickjacking** | X-Frame-Options: DENY | ✅ Bloqueado |

## 📊 Fluxo de Dados

### Request Flow (Usuário Real)

```
1. User → GET / (Bloqueio)
   ↓
   Middleware: Sem token
   ↓
   Exibe página de bloqueio

2. User → GET /acesso (Manual ou redirect)
   ↓
   Página carrega
   ↓
   JavaScript coleta fingerprint (2-3s)
   ↓
   POST /api/validate-access
   {
     userAgent: "Mozilla/5.0...",
     canvas: "data:image/png...",
     webgl: "Intel Inc.~Intel Iris...",
     timeOnPage: 3,
     mouseMovement: true,
     ...
   }
   ↓
   API valida e calcula score
   ↓
   Score = 85 (>= 70) ✅
   ↓
   Gera JWT, Set Cookie
   ↓
   Return { success: true, score: 85 }
   ↓
   JavaScript redireciona para /resgate

3. User → GET /resgate
   ↓
   Middleware: Token existe e válido
   ↓
   Permite acesso
   ↓
   Exibe conteúdo protegido

4. User → GET /resgate/qualquer-sub-rota
   ↓
   Middleware: Token existe e válido
   ↓
   Permite acesso (todas as sub-rotas protegidas)
```

### Request Flow (Bot)

```
1. Bot → GET /
   ↓
   Middleware: Sem token
   ↓
   Exibe página de bloqueio (HTML)
   ↓
   Bot não executa JavaScript
   ↓
   FIM (bloqueado)

2. Bot → GET /resgate (direto)
   ↓
   Middleware: Sem token
   ↓
   Redirect 307 → /
   ↓
   FIM (bloqueado)

3. Bot → POST /api/validate-access (tentativa)
   {
     userAgent: "curl/7.64.1",
     canvas: "",
     webgl: "",
     timeOnPage: 0,
     ...
   }
   ↓
   API valida e calcula score
   ↓
   Score = 16 (< 70) ❌
   ↓
   Return { success: false, score: 16 }
   ↓
   FIM (bloqueado)
```

## 🚀 Performance

### Latência

| Operação | Tempo |
|----------|-------|
| Middleware check | ~10ms |
| Fingerprint collection | 2-3s (intencional) |
| API validation | 50-150ms |
| Token generation | 5-10ms |
| Cookie set | ~5ms |
| **Total (first access)** | **~3s** |
| **Subsequent access** | **~10ms** |

### Edge Deployment

```
Vercel Edge Network (30+ locations)

User in São Paulo → Edge SP (10ms)
User in New York → Edge NY (15ms)
User in Tokyo → Edge TK (12ms)
User in London → Edge LN (18ms)

Average latency: < 20ms
```

### Scalability

```
Serverless Functions:
- Auto-scaling
- No cold starts (Edge Runtime)
- Pay per invocation
- 10M requests/month (free tier)

Rate Limit Store:
- In-memory (volatile)
- Resets on redeploy
- For high traffic: use Redis/Upstash
```

## 🔄 Ciclo de Vida

### Token Lifecycle

```
1. Geração (em /api/validate-access)
   ↓
   JWT sign com HS256
   ↓
   Set-Cookie com flags de segurança
   ↓
2. Uso (em middleware)
   ↓
   Parse cookie
   ↓
   Decode JWT
   ↓
   Validate signature
   ↓
   Check expiration
   ↓
3. Expiração (após 24h)
   ↓
   Middleware detecta exp < now
   ↓
   Delete cookie
   ↓
   Redirect para /
   ↓
   Usuário precisa verificar novamente
```

### Session Flow

```
Session Start: Usuário passa em /acesso
   ↓
Session Active: Token válido por 24h
   ↓
Session Renew: Não implementado (usuário verifica novamente)
   ↓
Session End: Token expira ou é deletado
```

## 💾 Data Storage

### Persistência

```
Dados Temporários:
├─ Rate Limit Store (in-memory)
│  └─ Reseta a cada deploy
├─ JWT Token (cookie)
│  └─ Expira em 24h
└─ Fingerprint (não armazenado)
   └─ Descartado após validação

Dados Permanentes:
└─ Nenhum (sistema stateless)
```

### Privacy

```
Dados Coletados:
✅ Fingerprint do navegador (temporário)
✅ IP address (rate limiting, não armazenado)
✅ User-Agent (temporário)

Dados NÃO Coletados:
❌ Nome, email, CPF
❌ Localização exata (GPS)
❌ Histórico de navegação
❌ Cookies de terceiros
❌ Tracking entre sites
```

## 🎯 Decision Points

### Quando usar Score >= 70?

```
Casos de uso:
✅ Conteúdo premium
✅ Downloads exclusivos
✅ Páginas de afiliados
✅ Ofertas limitadas
✅ Cursos online
✅ Materiais educacionais

Quando aumentar (>= 80):
⚠️ Conteúdo muito sensível
⚠️ Alvo de ataques constantes

Quando diminuir (>= 60):
⚠️ Muitos falso-positivos
⚠️ Audiência com browsers antigos
```

### Quando usar este sistema?

```
✅ USAR quando precisa:
- Proteger de bots/scrapers
- Validar usuários reais
- Conteúdo exclusivo
- Evitar acesso direto

❌ NÃO USAR quando:
- Conteúdo deve ser público
- SEO é crítico
- Acessibilidade máxima necessária
- Audiência técnica limitada
```

---

**Sistema robusto, escalável e imperceptível para crawlers.**
