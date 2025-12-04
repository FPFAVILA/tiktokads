# Sistema de Proteção de Acesso (Cloaking System)

Sistema avançado de proteção de conteúdo com verificação de navegador real, fingerprinting e sistema de tokens para Next.js hospedado na Vercel.

## 🔒 Características

- **Middleware de Interceptação**: Protege todas as rotas automaticamente
- **Fingerprinting Avançado**: Canvas, WebGL, timezone, user-agent, mouse tracking
- **Validação Multi-camada**: Score de confiança baseado em múltiplos fatores
- **JWT Seguro**: Tokens criptografados com expiração de 24 horas
- **Rate Limiting**: Máximo 3 tentativas por IP/hora
- **Anti-Bot**: Detecta e bloqueia crawlers e bots automaticamente
- **Mobile Friendly**: Funciona perfeitamente em dispositivos móveis
- **Design Profissional**: Interface moderna e minimalista

## 📁 Estrutura de Rotas

```
/                    → Tela de "Acesso Bloqueado" (pública)
/acesso              → Página de verificação (executa fingerprinting)
/resgate             → Conteúdo protegido (requer token válido)
/resgate/*           → Todas as sub-rotas protegidas
/api/validate-access → Edge Function de validação
```

## 🚀 Como Funciona

### Fluxo Completo:

1. **Usuário acessa qualquer rota** → Middleware intercepta
2. **Sem token válido** → Redireciona para `/` (Acesso Bloqueado)
3. **Usuário acessa `/acesso`** → Página inicia verificação
4. **Sistema coleta dados**:
   - Canvas Fingerprint
   - WebGL Fingerprint
   - User-Agent completo
   - Timezone e Language
   - Screen Resolution
   - Touch Support
   - Plugins instalados
   - Movimento do mouse
   - Tempo na página (mínimo 2 segundos)
5. **Envia para API `/api/validate-access`**
6. **API valida dados** e calcula score (0-100)
7. **Se score ≥ 70**:
   - Gera token JWT com expiração de 24h
   - Salva em cookie httpOnly/secure
   - Redireciona para `/resgate`
8. **Usuário acessa conteúdo protegido** → Middleware valida token
9. **Token válido** → Acesso permitido
10. **Token inválido/expirado** → Redireciona para `/`

## 🛠️ Instalação

### 1. Clone ou crie o projeto:

```bash
cd cloaking-system
npm install
```

### 2. Configure as variáveis de ambiente:

Copie `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Edite `.env.local` e adicione uma chave secreta forte:

```env
JWT_SECRET=sua-chave-secreta-super-forte-min-32-caracteres-aqui
```

**⚠️ IMPORTANTE**: Gere uma chave segura usando:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Execute em desenvolvimento:

```bash
npm run dev
```

Acesse:
- http://localhost:3000 → Tela de bloqueio
- http://localhost:3000/acesso → Página de verificação
- http://localhost:3000/resgate → Conteúdo protegido (após verificação)

## 🌐 Deploy na Vercel

### Opção 1: Via CLI

```bash
npm install -g vercel
vercel
```

### Opção 2: Via GitHub

1. Faça push do código para um repositório GitHub
2. Importe o projeto na Vercel
3. Configure a variável de ambiente `JWT_SECRET`
4. Deploy automático

### Configurar Variáveis de Ambiente na Vercel:

1. Acesse seu projeto no dashboard da Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione:
   - **Name**: `JWT_SECRET`
   - **Value**: Sua chave secreta (mínimo 32 caracteres)
   - **Environments**: Production, Preview, Development
4. Clique em **Save**
5. Faça redeploy se necessário

## 🧪 Testando o Sistema

### Teste 1: Acesso Direto (Deve Bloquear)

```bash
curl https://seu-dominio.vercel.app/resgate
```

**Resultado esperado**: Redirecionamento para `/`

### Teste 2: Verificação Manual

1. Acesse `https://seu-dominio.vercel.app/acesso`
2. Aguarde 2-3 segundos
3. Deve ser redirecionado para `/resgate` automaticamente

### Teste 3: Bot Detection

```bash
curl -A "bot" https://seu-dominio.vercel.app/acesso
```

**Resultado esperado**: Validação falha, score baixo

## 🔧 Personalização

### Alterar Tempo de Expiração do Token

Em `pages/api/validate-access.ts`:

```typescript
const token = jwt.sign(
  {
    fp: fingerprintHash,
    iat: now,
    exp: now + 86400, // 86400 = 24 horas (mude aqui)
  },
  JWT_SECRET
);
```

### Alterar Score Mínimo de Validação

Em `pages/api/validate-access.ts`:

```typescript
if (!result.isValid) {  // result.isValid = score >= 70
  return res.status(403).json({
    success: false,
    score: result.score,
    message: 'Verification failed',
  });
}
```

Para mudar o score mínimo, edite em `lib/validator.ts`:

```typescript
return {
  isValid: finalScore >= 70,  // Mude aqui (ex: 80 para ser mais restritivo)
  score: finalScore,
  reasons,
};
```

### Alterar Rate Limiting

Em `pages/api/validate-access.ts`:

```typescript
if (limit.count >= 3) {  // Máximo 3 tentativas
  return { allowed: false, remaining: 0 };
}
```

E o tempo de reset:

```typescript
rateLimitStore.set(key, {
  count: 1,
  resetTime: now + 60 * 60 * 1000,  // 1 hora (mude aqui)
});
```

### Adicionar Novas Verificações

Em `lib/validator.ts`, adicione novos checks:

```typescript
const checks = [
  this.checkUserAgent(data),
  this.checkCanvas(data),
  // ... outros checks
  this.seuNovoCheck(data),  // Adicione aqui
];
```

E implemente o método:

```typescript
private seuNovoCheck(data: FingerprintData): { score: number; reason: string } {
  // Sua lógica de validação
  return { score: 10, reason: 'Check passou' };
}
```

## 📊 Monitoramento

### Logs da Vercel

Acesse logs em tempo real:

1. Dashboard da Vercel
2. Seu projeto
3. **Functions** → Selecione a função
4. Veja logs de validação

### Exemplo de Log:

```
[VALIDATION] IP: 192.168.1.1, Score: 85, Valid: true
```

## 🔐 Segurança

### Proteções Implementadas:

✅ **Headers de Segurança**:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

✅ **Cookies Seguros**:
- HttpOnly (não acessível via JavaScript)
- Secure (apenas HTTPS)
- SameSite=Strict (proteção CSRF)
- Max-Age=86400 (24 horas)

✅ **Rate Limiting**:
- 3 tentativas por IP/hora
- Blacklist automático temporário

✅ **Anti-Bot**:
- Detecção de user-agents conhecidos
- Validação de comportamento real
- Fingerprinting avançado

✅ **Token JWT**:
- Criptografado com HS256
- Expiração de 24 horas
- Validação em cada requisição

## 🚨 Troubleshooting

### Problema: "Token inválido" mesmo após verificação

**Solução**:
1. Verifique se `JWT_SECRET` está configurado na Vercel
2. Limpe cookies do navegador
3. Verifique se o domínio é HTTPS (cookies seguros)

### Problema: Redirecionamento infinito

**Solução**:
1. Verifique se o middleware está funcionando
2. Limpe cache do Next.js: `rm -rf .next`
3. Reinstale dependências: `npm install`

### Problema: Score muito baixo (sempre < 70)

**Solução**:
1. Verifique no navegador se JavaScript está ativo
2. Desative extensões que bloqueiam fingerprinting
3. Ajuste o score mínimo em `lib/validator.ts`

### Problema: Rate limit muito agressivo

**Solução**:
1. Aumente limite em `pages/api/validate-access.ts`
2. Ou aumente tempo de reset para 2-4 horas

## 📝 Notas Importantes

⚠️ **Produção**:
- SEMPRE use HTTPS
- Configure `JWT_SECRET` forte (32+ caracteres)
- Monitore logs regularmente
- Teste em múltiplos navegadores

⚠️ **Privacidade**:
- Sistema coleta fingerprint do navegador
- Dados não são armazenados permanentemente
- Não coleta informações pessoais identificáveis
- Respeite LGPD/GDPR se aplicável

⚠️ **Performance**:
- Verificação leva 2-3 segundos
- Middleware adiciona ~10ms por requisição
- Use CDN da Vercel para otimização
- Edge Functions são rápidas globalmente

## 🤝 Suporte

Para problemas ou dúvidas:

1. Verifique os logs na Vercel
2. Revise a documentação acima
3. Teste localmente primeiro
4. Verifique variáveis de ambiente

## 📄 Licença

Este código é fornecido como exemplo educacional. Use por sua conta e risco.

---

**Sistema desenvolvido para proteção de conteúdo contra bots e crawlers.**
**100% compatível com Vercel Edge Functions.**
