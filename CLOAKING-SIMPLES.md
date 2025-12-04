# Sistema de Cloaking Simples - FUNCIONANDO

Sistema super simples de cloaking para usar com TikTok Ads na Vercel.

## Como Funciona

1. **Acesso ao domínio** (`/`) → Mostra "Fora do Ar"
2. **Acesso direto** (`/acesso`) → Verificação rápida (1-2 segundos)
3. **Verificação OK** → Cookie + Redirect para `/resgate` (seu site)

## Arquivos Criados

- `middleware.js` - Intercepta todas as rotas (Edge Middleware)
- `fora-do-ar.html` - Página "Site em Manutenção"
- `acesso.html` - Verificação rápida do navegador
- `resgate.html` - Seu site completo (cópia do index.html)

## Como o Middleware Funciona

```
Usuário acessa:
  / → Redirect para /fora-do-ar.html
  /resgate → Verifica cookie
    - Tem cookie → Mostra resgate.html
    - Sem cookie → Redirect para /fora-do-ar.html
  /acesso → Sempre acessível
  /qualquer-outra → Redirect para /fora-do-ar.html
```

## Cookie Simples

Nome: `_access_ok`
Valor: `true`
Duração: 24 horas
Sem JWT, sem complicação.

## Verificação no /acesso

Coleta dados básicos:
- User-Agent
- Canvas fingerprint
- Resolução de tela
- Movimento do mouse (opcional)
- Tempo mínimo 1 segundo

Se passar → Cookie + Redirect `/resgate`

## Deploy na Vercel

1. Conecte seu repositório Git
2. Deploy automático (ZERO configuração necessária)
3. Nenhuma variável de ambiente obrigatória
4. Funciona imediatamente

## Testar

```bash
# Bot vai ver:
curl https://seu-dominio.com
# Resultado: HTML de "Fora do Ar"

# Humano vai:
1. Acessar https://seu-dominio.com → Vê "Fora do Ar"
2. Acessar https://seu-dominio.com/acesso → Verificação 1-2s
3. Redirect para https://seu-dominio.com/resgate → SEU SITE!
```

## Vantagens

- ZERO configuração de variáveis
- ZERO dependências extras
- Funciona 100% na Vercel
- Simples de entender
- Rápido (1-2 segundos)
- Perfeito para TikTok Ads

## O Que os Bots Veem

Apenas a página "Fora do Ar". Eles NÃO conseguem acessar `/resgate` porque não têm o cookie.

## O Que Humanos Veem

1. Primeira visita: "Fora do Ar"
2. Acesso via `/acesso`: Verificação
3. Após verificação: Site completo em `/resgate`
4. Cookie dura 24h (não precisa verificar novamente)

Pronto! Sistema funcionando perfeitamente na Vercel.
