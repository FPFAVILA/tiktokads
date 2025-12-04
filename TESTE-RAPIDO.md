# ⚡ Teste Rápido - Sistema de Cloaking

## 🧪 Como Testar se Está Funcionando

### Teste 1: Navegador (Usuário Real)

#### Passo 1: Acesse o Site
```
https://seu-dominio.vercel.app/
```

#### Resultado Esperado:
1. ✅ Redireciona para `/bloqueado.html`
2. ✅ Mostra "Acesso Restrito"
3. ✅ Após 3 segundos → `/verificacao.html`
4. ✅ Progress bar anima (0% → 100%)
5. ✅ Status muda 3-4 vezes
6. ✅ Após 2-3 segundos → Redirect para `/`
7. ✅ Agora mostra SEU SITE normalmente

#### Se NÃO Funcionar:
- Limpe cache: Ctrl+Shift+R (Windows) ou Cmd+Shift+R (Mac)
- Limpe cookies: F12 → Application → Cookies → Delete All
- Tente aba anônima
- Verifique se `JWT_SECRET` está configurado na Vercel

---

### Teste 2: Bot (Deve Bloquear)

#### Terminal/CMD:
```bash
curl -L https://seu-dominio.vercel.app/
```

#### Resultado Esperado:
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <title>Acesso Restrito</title>
  ...
</head>
<body>
  <div class="container">
    <h1>Acesso Restrito</h1>
    <p>Este conteúdo não está disponível publicamente</p>
    ...
```

**Bot vê página de bloqueio, NÃO o conteúdo real!**

#### Se Mostrar Seu Site:
- Sistema NÃO está funcionando
- Verifique se `middleware.js` está na raiz
- Verifique se fez deploy após as mudanças

---

### Teste 3: DevTools (Verificar Cookie)

#### Passo 1: Abra DevTools
- Windows: F12 ou Ctrl+Shift+I
- Mac: Cmd+Option+I

#### Passo 2: Vá em Application → Cookies

#### Resultado Esperado:
```
Name: _site_access_token
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Domain: seu-dominio.vercel.app
Path: /
Expires: (24 horas a partir de agora)
HttpOnly: ✓
Secure: ✓
SameSite: Strict
```

**Sem esse cookie = Sem acesso ao site!**

---

### Teste 4: Network (Verificar Requisições)

#### Passo 1: Abra DevTools → Network

#### Passo 2: Acesse `/verificacao.html`

#### Resultado Esperado:
```
Request                         Status  Response
-------------------------------------------
verificacao.html                200     OK
verificacao.js                  200     OK
POST /api/verificar-acesso      200     OK

Response de /api/verificar-acesso:
{
  "success": true,
  "score": 85,
  "message": "Verificação bem-sucedida"
}
```

**Se score < 70**: Verificação falha, bloqueado

**Se score >= 70**: Verificação passa, token gerado

---

### Teste 5: Logs da Vercel

#### Passo 1: Dashboard Vercel
1. [vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecione seu projeto
3. **Deployments** → Deployment mais recente
4. **Functions**

#### Passo 2: Selecione `api/verificar-acesso`

#### Resultado Esperado:
```
[VALIDATION] IP: 192.168.1.1, Score: 85, Valid: true
[VALIDATION] IP: 192.168.1.1, Score: 85, Valid: true
```

**Cada validação bem-sucedida aparece aqui!**

---

## 🎯 Cenários de Teste

### Cenário 1: Primeira Visita
```
1. Acesso / → Sem cookie
2. Redirect /bloqueado.html
3. Auto-redirect /verificacao.html (3s)
4. Coleta fingerprint (2-3s)
5. POST /api/verificar-acesso
6. Score 85 ≥ 70 ✅
7. Gera token, salva cookie
8. Redirect /
9. Middleware detecta cookie
10. Permite acesso ✅
```

### Cenário 2: Visita Subsequente (Com Cookie)
```
1. Acesso /
2. Middleware detecta cookie válido
3. Permite acesso imediato ✅
(Sem verificação novamente)
```

### Cenário 3: Token Expirado (Após 24h)
```
1. Acesso / → Cookie expirado
2. Middleware detecta exp < now
3. Remove cookie
4. Redirect /bloqueado.html
5. Processo de verificação novamente
```

### Cenário 4: Bot/Scraper
```
1. Bot acessa /
2. Middleware não encontra cookie
3. Redirect /bloqueado.html
4. Bot vê HTML mas não executa JS
5. Não faz POST /api/verificar-acesso
6. Nunca consegue token
7. Sempre bloqueado ❌
```

---

## 📊 Score de Validação

### Como é Calculado:

```
Check                  Pontos   Peso
-----------------------------------
User-Agent válido      0-10     10%
Canvas fingerprint     0-10     10%
WebGL fingerprint      0-10     10%
Screen resolution      0-10     10%
Timezone válido        0-10     10%
Language válido        0-10     10%
Plugins/Fonts          0-10     10%
Mouse movement         0-10     10%
Time on page           0-10     10%
Hardware specs         0-10     10%
-----------------------------------
TOTAL                  0-100    100%

Aprovação: Score >= 70
```

### Exemplos Reais:

**Usuário Desktop (Chrome)**:
```
User-Agent: 10 (válido)
Canvas: 10 (válido)
WebGL: 10 (Intel HD Graphics)
Screen: 10 (1920x1080)
Timezone: 10 (America/Sao_Paulo)
Language: 10 (pt-BR)
Plugins/Fonts: 10 (12 fontes)
Mouse: 10 (moveu)
Time: 10 (3 segundos)
Hardware: 10 (8 cores)
---
TOTAL: 100/100 ✅ APROVADO
```

**Usuário Mobile (iPhone)**:
```
User-Agent: 10 (válido)
Canvas: 10 (válido)
WebGL: 4 (não disponível mobile)
Screen: 10 (390x844)
Timezone: 10 (America/Sao_Paulo)
Language: 10 (pt-BR)
Plugins/Fonts: 5 (poucas fontes)
Mouse: 5 (sem mouse, é touch)
Time: 10 (3 segundos)
Hardware: 10 (6 cores)
---
TOTAL: 84/100 ✅ APROVADO
```

**Bot (cURL)**:
```
User-Agent: 2 (contém 'curl')
Canvas: 0 (ausente)
WebGL: 0 (ausente)
Screen: 0 (ausente)
Timezone: 0 (ausente)
Language: 0 (ausente)
Plugins/Fonts: 3 (nenhuma)
Mouse: 5 (sem movimento)
Time: 2 (0 segundos)
Hardware: 4 (ausente)
---
TOTAL: 16/100 ❌ BLOQUEADO
```

---

## 🔍 Debug: Score Baixo

Se usuários reais estão sendo bloqueados:

### Passo 1: Ver Logs
```
Dashboard Vercel → Functions → verificar-acesso
```

Exemplo:
```
[VALIDATION] IP: 192.168.1.1, Score: 65, Valid: false
```

### Passo 2: Identificar Problema

Score 60-69: Ajuste o mínimo para 60
Score 40-59: Pode ser mobile ou browser com privacidade alta
Score < 40: Provavelmente bot

### Passo 3: Ajustar Score Mínimo

**Edite `api/verificar-acesso.js`**:
```javascript
// Linha ~50 da classe FingerprintValidator
return {
  isValid: finalScore >= 60,  // Era 70
  score: finalScore,
  reasons
};
```

**Deploy**:
```bash
git add .
git commit -m "Ajustar score para 60"
git push
```

---

## ✅ Checklist Rápido

Está funcionando se:

- [ ] Acesso direto a `/` redireciona
- [ ] `/bloqueado.html` é exibido
- [ ] Auto-redirect para `/verificacao.html` (3s)
- [ ] Progress bar anima
- [ ] Após 2-3s redireciona para `/`
- [ ] Cookie `_site_access_token` está configurado
- [ ] Acesso subsequente é IMEDIATO (sem verificação)
- [ ] Bot (curl) vê apenas página de bloqueio
- [ ] Logs na Vercel mostram validações

Não está funcionando se:

- [ ] Acesso direto a `/` mostra o site
- [ ] Sem redirecionamentos
- [ ] Sem cookie configurado
- [ ] Bot consegue ver o conteúdo

---

## 🆘 Não Funciona?

### 1. Limpar Tudo
```bash
# Navegador
Ctrl+Shift+R (limpar cache)
F12 → Application → Cookies → Clear All

# Testar aba anônima
Ctrl+Shift+N (Chrome)
Ctrl+Shift+P (Firefox)
```

### 2. Verificar Deploy
```
Dashboard Vercel → Deployments
Status deve ser: Ready ✅
```

### 3. Verificar JWT_SECRET
```
Settings → Environment Variables
JWT_SECRET deve existir
```

### 4. Verificar Logs
```
Functions → verificar-acesso
Deve ter logs de validação
```

### 5. Verificar Middleware
```
Arquivo middleware.js na raiz do projeto
Git status → deve estar commitado
```

---

**Teste completo! Se todos os checks passarem, sistema está 100% funcional!**
