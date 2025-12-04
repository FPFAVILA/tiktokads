# Como Testar o Sistema

## 1. Deploy na Vercel

```bash
# Se ainda não fez:
git add .
git commit -m "Sistema de cloaking simples"
git push

# Ou via CLI:
vercel --prod
```

## 2. Testar no Navegador

### Teste 1: Página Inicial
Acesse: `https://seu-dominio.vercel.app/`

**Resultado esperado:** "Fora do Ar"

### Teste 2: Verificação
Acesse: `https://seu-dominio.vercel.app/acesso`

**Resultado esperado:**
- Loading 1-2 segundos
- "Verificando acesso"
- Redirect automático para `/resgate`

### Teste 3: Site Completo
Após a verificação, você estará em: `https://seu-dominio.vercel.app/resgate`

**Resultado esperado:** Seu site TikTok Bônus completo funcionando!

### Teste 4: Cookie Funcionando
Feche o navegador e abra novamente.
Acesse direto: `https://seu-dominio.vercel.app/resgate`

**Resultado esperado:** Site carrega direto (cookie ainda válido por 24h)

## 3. Testar como Bot

```bash
# Simular bot
curl https://seu-dominio.vercel.app/

# Resultado esperado: HTML de "Fora do Ar"

# Tentar acessar /resgate diretamente
curl https://seu-dominio.vercel.app/resgate

# Resultado esperado: Redirect para /fora-do-ar.html
```

## 4. Verificar Cookie

Abra DevTools (F12) → Application → Cookies

Deve ter:
- Nome: `_access_ok`
- Valor: `true`
- Path: `/`
- Max-Age: `86400` (24 horas)

## 5. Compartilhar para Usuários

Opção 1: Enviar direto `/acesso`
```
https://seu-dominio.vercel.app/acesso
```
Usuário faz verificação e vai para o site.

Opção 2: Deixar eles descobrirem
Pode deixar no "Fora do Ar" e quem souber acessa `/acesso`.

## Problemas?

### Verificação não funciona
- Limpe cookies (F12 → Application → Clear cookies)
- Tente em aba anônima
- Verifique se JavaScript está habilitado

### Redirect infinito
- Limpe cache: Ctrl+Shift+R (Windows) ou Cmd+Shift+R (Mac)
- Tente outro navegador

### "Fora do Ar" sempre
- Acesse `/acesso` primeiro
- Depois acesse `/resgate`

Pronto! Sistema funcionando perfeitamente para TikTok Ads.
