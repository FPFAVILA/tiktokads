# Guia de Testes do Sistema de Cloaking

Este documento detalha todos os testes necessários para validar o sistema.

## 🧪 Testes Locais (Antes do Deploy)

### 1. Instalação

```bash
cd cloaking-system
npm install
```

**Verificar**:
- ✅ Nenhum erro de instalação
- ✅ `node_modules` criado
- ✅ `package-lock.json` atualizado

### 2. Variáveis de Ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local`:
```env
JWT_SECRET=seu-secret-de-pelo-menos-32-caracteres-aqui
```

Gere um secret seguro:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Build Local

```bash
npm run build
```

**Verificar**:
- ✅ Build completa sem erros
- ✅ Pasta `.next` criada
- ✅ Nenhum erro de TypeScript

### 4. Rodar Desenvolvimento

```bash
npm run dev
```

**Verificar**:
- ✅ Servidor inicia em http://localhost:3000
- ✅ Nenhum erro no console

## 🌐 Testes no Navegador (Desktop)

### Teste 1: Página de Bloqueio

**URL**: `http://localhost:3000/`

**Esperado**:
- ✅ Exibe "Access Restricted"
- ✅ Ícone de cadeado visível
- ✅ Sem erros no console (F12)
- ✅ Design responsivo

**Validar**:
- Visual profissional
- Sem links visíveis
- Sem menção a rotas protegidas

### Teste 2: Acesso Direto à Rota Protegida

**URL**: `http://localhost:3000/resgate`

**Esperado**:
- ✅ Redireciona para `/` automaticamente
- ✅ Não mostra conteúdo protegido
- ✅ Middleware bloqueia acesso

**Validar**:
```bash
# Via curl (deve redirecionar)
curl -I http://localhost:3000/resgate

# Esperado:
HTTP/1.1 307 Temporary Redirect
Location: http://localhost:3000/
```

### Teste 3: Página de Verificação

**URL**: `http://localhost:3000/acesso`

**Esperado**:
- ✅ Loading aparece
- ✅ Progress bar anima
- ✅ Status muda (3-4 estados)
- ✅ Após 2-3 segundos, redireciona para `/resgate`

**Validar no DevTools (F12)**:

**Console**:
```
Nenhum erro
```

**Network**:
```
POST /api/validate-access
Status: 200 OK
Response: { success: true, score: 85 }
```

**Application → Cookies**:
```
Name: _verify_token
Value: eyJhbGciOiJIUzI1NiIs...
HttpOnly: ✓
Secure: ✓
SameSite: Strict
```

### Teste 4: Conteúdo Protegido

**URL**: `http://localhost:3000/resgate` (após verificação)

**Esperado**:
- ✅ Página carrega sem redirecionar
- ✅ Exibe "Bem-vindo à Área Protegida"
- ✅ Sessão ativa (indicador verde)
- ✅ Conteúdo visível

**Validar**:
- Header com status
- Cards de informação
- Botão "Revelar Conteúdo"
- Footer com info de sessão

### Teste 5: Token Expirado

**Simular**:
1. Acesse `/resgate` com sucesso
2. Abra DevTools → Application → Cookies
3. Delete o cookie `_verify_token`
4. Recarregue a página

**Esperado**:
- ✅ Redireciona para `/` imediatamente
- ✅ Middleware detecta token ausente

### Teste 6: Rota Inexistente

**URL**: `http://localhost:3000/qualquercoisa`

**Esperado**:
- ✅ Redireciona para `/`
- ✅ Não mostra erro 404

## 📱 Testes Mobile

### iPhone/Safari

**Dispositivos**: iPhone 11, 12, 13, 14
**iOS**: 14+

**Testes**:
1. Acesse `/` → Deve bloquear
2. Acesse `/acesso` → Deve verificar
3. Verificação deve levar 2-3 segundos
4. Deve redirecionar para `/resgate`
5. Touch deve ser detectado

**Validar**:
- ✅ Layout responsivo
- ✅ Botões clicáveis
- ✅ Animações suaves
- ✅ Sem problemas de cookies (SameSite)

### Android/Chrome

**Dispositivos**: Galaxy S20+, Pixel 5+
**Android**: 10+

**Testes**:
1. Acesse `/` → Deve bloquear
2. Acesse `/acesso` → Deve verificar
3. Verificação deve levar 2-3 segundos
4. Deve redirecionar para `/resgate`
5. Touch deve ser detectado

**Validar**:
- ✅ Layout responsivo
- ✅ Performance boa
- ✅ Sem crash

## 🤖 Testes Anti-Bot

### Teste 1: cURL Simples

```bash
curl http://localhost:3000/acesso
```

**Esperado**:
- ✅ Retorna HTML
- ✅ JavaScript não executa (não faz POST)

### Teste 2: cURL com POST Direto

```bash
curl -X POST http://localhost:3000/api/validate-access \
  -H "Content-Type: application/json" \
  -d '{
    "userAgent": "curl/7.64.1",
    "canvas": "",
    "webgl": "",
    "timeOnPage": 0
  }'
```

**Esperado**:
```json
{
  "success": false,
  "score": 15,
  "message": "Verification failed"
}
```

Score baixo porque:
- User-Agent é bot (curl)
- Canvas vazio
- WebGL ausente
- Tempo na página = 0

### Teste 3: Headless Chrome (Puppeteer)

Crie `test-bot.js`:

```javascript
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:3000/acesso');
  await page.waitForTimeout(5000);

  const url = page.url();
  console.log('Final URL:', url);

  await browser.close();
})();
```

Execute:
```bash
npm install puppeteer
node test-bot.js
```

**Esperado**:
- ⚠️ Score médio-baixo (50-70)
- ⚠️ Pode passar ou falhar dependendo das configs
- ✅ Headless básico geralmente bloqueado

### Teste 4: Rate Limiting

Execute 4 vezes seguidas:

```bash
for i in {1..4}; do
  curl -X POST http://localhost:3000/api/validate-access \
    -H "Content-Type: application/json" \
    -d '{"userAgent":"test"}'
  echo ""
done
```

**Esperado**:

Tentativa 1-3:
```json
{ "success": false, "score": 20 }
```

Tentativa 4:
```json
{ "success": false, "message": "Too many attempts. Try again later." }
```

HTTP Status: 429 (Too Many Requests)

## 🔍 Testes de Fingerprinting

### Teste 1: Canvas Fingerprint

**No navegador (DevTools Console)**:

```javascript
// Copie e cole no console após abrir /acesso
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
ctx.textBaseline = 'top';
ctx.font = '14px Arial';
ctx.fillText('Test', 2, 2);
console.log('Canvas:', canvas.toDataURL());
```

**Esperado**:
```
Canvas: data:image/png;base64,iVBORw0KGgoAAAANS...
```

Hash único por dispositivo/browser.

### Teste 2: WebGL Fingerprint

```javascript
// Console
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl');
const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
console.log('Vendor:', gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL));
console.log('Renderer:', gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
```

**Esperado** (exemplo):
```
Vendor: Google Inc. (Apple)
Renderer: ANGLE (Apple, Apple M1, OpenGL 4.1)
```

### Teste 3: Fontes Detectadas

```javascript
// Console após abrir /acesso
// Aguarde 2 segundos
// Inspecione requisição POST
```

No **Network → validate-access → Payload**:
```json
{
  "fonts": ["Arial", "Verdana", "Times New Roman", "Georgia", ...],
  ...
}
```

**Esperado**:
- ✅ 8-15 fontes em desktop
- ✅ 5-10 fontes em mobile

## 🌍 Testes Pós-Deploy (Vercel)

### Teste 1: HTTPS

```bash
curl -I https://seu-dominio.vercel.app
```

**Esperado**:
```
HTTP/2 200
strict-transport-security: max-age=63072000
x-frame-options: DENY
x-content-type-options: nosniff
```

### Teste 2: Headers de Segurança

```bash
curl -I https://seu-dominio.vercel.app
```

**Validar**:
- ✅ `X-Frame-Options: DENY`
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `Referrer-Policy: strict-origin-when-cross-origin`

### Teste 3: Cookies Seguros

Abra DevTools → Application → Cookies:

**Validar**:
```
Name: _verify_token
Domain: seu-dominio.vercel.app
Path: /
Expires: (24 horas a partir de agora)
HttpOnly: ✓
Secure: ✓
SameSite: Strict
```

### Teste 4: Performance

Use [PageSpeed Insights](https://pagespeed.web.dev/):

```
https://pagespeed.web.dev/analysis?url=https://seu-dominio.vercel.app
```

**Metas**:
- ✅ Performance: > 90
- ✅ Accessibility: > 95
- ✅ Best Practices: > 95
- ✅ SEO: > 80 (pode ser baixo se bloqueado para bots)

### Teste 5: Múltiplas Regiões

Use [Uptime Robot](https://uptimerobot.com) ou teste manualmente:

```bash
# Via VPN de diferentes países
# USA
curl https://seu-dominio.vercel.app

# Europa
curl https://seu-dominio.vercel.app

# Ásia
curl https://seu-dominio.vercel.app
```

**Esperado**:
- ✅ Latência < 200ms de qualquer região
- ✅ Edge Functions funcionam globalmente

## 📊 Testes de Logs

### No Dashboard da Vercel:

1. Acesse **Deployments** → Deployment atual
2. Clique em **Functions**
3. Selecione `api/validate-access`

**Validar Logs**:

Aprovação:
```
[VALIDATION] IP: 192.168.1.1, Score: 85, Valid: true
```

Rejeição:
```
[VALIDATION] IP: 203.0.113.42, Score: 45, Valid: false
```

Rate Limit:
```
(Nenhum log, mas HTTP 429 na resposta)
```

## 🎯 Checklist de Testes Completo

### Pré-Deploy:
- [ ] `npm install` sem erros
- [ ] `npm run build` completa
- [ ] Variáveis de ambiente configuradas
- [ ] Testes locais passando

### Navegador Desktop:
- [ ] Página de bloqueio carrega
- [ ] Verificação funciona
- [ ] Redireciona para `/resgate` após aprovação
- [ ] Conteúdo protegido acessível com token
- [ ] Token expirado redireciona
- [ ] Rotas inexistentes redirecionam

### Navegador Mobile:
- [ ] iPhone/Safari funciona
- [ ] Android/Chrome funciona
- [ ] Touch detectado
- [ ] Layout responsivo

### Anti-Bot:
- [ ] cURL bloqueado
- [ ] Headless Chrome bloqueado (maioria)
- [ ] Rate limiting funciona
- [ ] User-Agents suspeitos rejeitados

### Fingerprinting:
- [ ] Canvas gerado
- [ ] WebGL detectado
- [ ] Fontes listadas
- [ ] Mouse tracking funciona
- [ ] Tempo na página validado

### Pós-Deploy Vercel:
- [ ] HTTPS ativo
- [ ] Headers de segurança presentes
- [ ] Cookies seguros configurados
- [ ] Performance boa (> 90)
- [ ] Logs funcionando

### Segurança:
- [ ] Token JWT válido
- [ ] Expiração funciona
- [ ] HttpOnly ativo
- [ ] SameSite Strict
- [ ] Rate limiting efetivo

## 🐛 Debugging

### Console do Navegador Mostra Erro

**Erro**: `Failed to fetch`

**Solução**:
1. Verifique se API está rodando
2. Veja Network tab para detalhes
3. Verifique CORS (não deve ser problema)

**Erro**: `TypeError: Cannot read property...`

**Solução**:
1. Verifique se fingerprinting carregou
2. Aguarde 2 segundos antes de enviar
3. Verifique se todos os dados foram coletados

### Score Sempre Baixo

**Debug**:

Adicione console.log em `lib/validator.ts`:

```typescript
validate(data: FingerprintData): ValidationResult {
  const checks = [...];

  // DEBUG
  console.log('Checks:', checks);
  console.log('Total Score:', totalScore);
  console.log('Final Score:', finalScore);

  // ...
}
```

Execute no local e veja quais checks falharam.

### Rate Limit Não Funciona

**Debug**:

Em `pages/api/validate-access.ts`:

```typescript
console.log('Rate Limit Store:', Array.from(rateLimitStore.entries()));
```

Verifique se IPs estão sendo rastreados corretamente.

## 📈 Métricas de Sucesso

Após todos os testes:

| Métrica | Meta | Realidade |
|---------|------|-----------|
| Taxa de aprovação (humanos) | > 95% | ___% |
| Taxa de bloqueio (bots) | > 95% | ___% |
| Tempo de verificação | < 3s | ___s |
| Performance Score | > 90 | ___ |
| Taxa de erro | < 1% | ___% |

Preencha a coluna "Realidade" com seus resultados.

---

**Sistema testado e pronto para produção!**
