# Guia Completo de Deploy na Vercel

Este guia detalha o processo completo de deploy do sistema de cloaking na Vercel.

## 📋 Pré-requisitos

- Conta na Vercel (gratuita)
- Git instalado
- Node.js 18+ instalado
- Projeto pronto para deploy

## 🚀 Deploy Rápido (3 minutos)

### Opção 1: Deploy via GitHub (Recomendado)

#### Passo 1: Criar Repositório no GitHub

```bash
cd cloaking-system

# Inicializar git
git init

# Adicionar todos os arquivos
git add .

# Fazer commit
git commit -m "Initial commit: Sistema de cloaking completo"

# Adicionar remote (crie o repo no GitHub primeiro)
git remote add origin https://github.com/seu-usuario/cloaking-system.git

# Push
git push -u origin main
```

#### Passo 2: Importar na Vercel

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Clique em **Import Git Repository**
3. Selecione seu repositório `cloaking-system`
4. Clique em **Import**

#### Passo 3: Configurar Projeto

Na tela de configuração:

**Framework Preset**: `Next.js` (detectado automaticamente)

**Root Directory**: `./` (deixe vazio ou raiz)

**Build Command**: (deixe padrão)
```bash
next build
```

**Output Directory**: (deixe padrão)
```bash
.next
```

**Install Command**: (deixe padrão)
```bash
npm install
```

#### Passo 4: Variáveis de Ambiente

Antes de clicar em "Deploy", adicione:

1. Clique em **Environment Variables**
2. Adicione:
   - **Name**: `JWT_SECRET`
   - **Value**: Cole uma chave secreta forte (veja como gerar abaixo)
   - **Environments**: Selecione `Production`, `Preview`, `Development`
3. Clique em **Add**

**Gerar JWT_SECRET seguro**:

```bash
# No terminal local
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Exemplo de saída:
f8e7d6c5b4a3928170f9e8d7c6b5a4938271f0e9d8c7b6a59483726f1e0d9c8b
```

#### Passo 5: Deploy

1. Clique em **Deploy**
2. Aguarde 1-2 minutos
3. Pronto! Seu site está no ar

### Opção 2: Deploy via CLI da Vercel

#### Passo 1: Instalar Vercel CLI

```bash
npm install -g vercel
```

#### Passo 2: Login

```bash
vercel login
```

Escolha o método de login (GitHub, GitLab, Bitbucket, Email)

#### Passo 3: Deploy

```bash
cd cloaking-system

# Deploy
vercel
```

Responda as perguntas:

```
? Set up and deploy "~/cloaking-system"? [Y/n] Y
? Which scope do you want to deploy to? [Seu usuário]
? Link to existing project? [y/N] N
? What's your project's name? cloaking-system
? In which directory is your code located? ./
```

#### Passo 4: Adicionar Variável de Ambiente

```bash
# Adicionar JWT_SECRET
vercel env add JWT_SECRET

# Cole a chave secreta quando solicitado
# Selecione os ambientes: Production, Preview, Development
```

#### Passo 5: Deploy em Produção

```bash
vercel --prod
```

## 🔧 Configuração Pós-Deploy

### 1. Verificar Deploy

Acesse a URL fornecida pela Vercel:

```
https://cloaking-system-xxx.vercel.app
```

Você deve ver a tela "Access Restricted"

### 2. Testar Fluxo Completo

#### Teste 1: Tela de Bloqueio

```bash
curl https://seu-dominio.vercel.app
```

Deve retornar HTML da página de bloqueio.

#### Teste 2: Acesso Direto Protegido

```bash
curl https://seu-dominio.vercel.app/resgate
```

Deve redirecionar para `/` (bloqueado)

#### Teste 3: Verificação Manual

1. Abra `https://seu-dominio.vercel.app/acesso` no navegador
2. Aguarde 2-3 segundos
3. Deve redirecionar para `/resgate` automaticamente

### 3. Verificar Logs

1. Acesse o [dashboard da Vercel](https://vercel.com/dashboard)
2. Selecione seu projeto
3. Clique em **Deployments**
4. Selecione o deployment mais recente
5. Clique em **Functions**
6. Selecione `api/validate-access`
7. Veja os logs:

```
[VALIDATION] IP: 192.168.1.1, Score: 85, Valid: true
```

### 4. Configurar Domínio Customizado (Opcional)

#### No Dashboard da Vercel:

1. Vá em **Settings** → **Domains**
2. Clique em **Add**
3. Digite seu domínio: `seusite.com`
4. Clique em **Add**

#### Configure DNS:

A Vercel fornecerá registros DNS para adicionar:

**Opção A: CNAME (Recomendado)**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**Opção B: A Record**
```
Type: A
Name: @
Value: 76.76.21.21
```

Aguarde propagação DNS (até 48 horas, geralmente < 30 minutos)

### 5. Configurar SSL (Automático)

A Vercel configura SSL automaticamente:
- Certificado Let's Encrypt
- Renovação automática
- HTTPS forçado

Não é necessária configuração manual.

## 🎨 Personalizações Pós-Deploy

### Alterar Conteúdo da Página Protegida

Edite `pages/resgate/index.tsx`:

```typescript
// Adicione seu conteúdo real aqui
<div className="prose prose-invert max-w-none">
  <h2>Seu Conteúdo Exclusivo</h2>
  <p>Adicione vídeos, downloads, textos, etc.</p>
</div>
```

Faça commit e push:

```bash
git add .
git commit -m "Atualizar conteúdo protegido"
git push
```

Deploy automático será iniciado.

### Adicionar Novas Rotas Protegidas

Crie novos arquivos em `pages/resgate/`:

```bash
# Criar nova página
touch pages/resgate/premium.tsx
```

```typescript
// pages/resgate/premium.tsx
export default function PremiumContent() {
  return (
    <div>
      <h1>Conteúdo Premium</h1>
      <p>Disponível em /resgate/premium</p>
    </div>
  );
}
```

Todas as rotas dentro de `/resgate` são automaticamente protegidas pelo middleware.

### Ajustar Score de Validação

Edite `lib/validator.ts`:

```typescript
// Linha ~45
return {
  isValid: finalScore >= 70,  // Mude para 80, 60, etc.
  score: finalScore,
  reasons,
};
```

## 🔄 Atualizações e Manutenção

### Deploy de Atualizações

#### Via GitHub (automático):

```bash
# Fazer alterações
git add .
git commit -m "Descrição das alterações"
git push
```

Deploy automático inicia em segundos.

#### Via CLI:

```bash
vercel --prod
```

### Rollback (Reverter Deploy)

1. Dashboard da Vercel
2. **Deployments**
3. Encontre deployment anterior
4. Clique nos três pontos (`...`)
5. **Promote to Production**

### Variáveis de Ambiente

#### Adicionar Nova Variável:

```bash
# Via CLI
vercel env add NOVA_VARIAVEL

# Ou via Dashboard
Settings → Environment Variables → Add
```

#### Editar Variável:

```bash
# Remove antiga
vercel env rm JWT_SECRET

# Adiciona nova
vercel env add JWT_SECRET
```

#### ⚠️ Importante:
Após alterar variáveis de ambiente, faça redeploy:

```bash
vercel --prod
```

## 📊 Monitoramento

### Analytics da Vercel (Gratuito)

1. Dashboard → Seu Projeto → **Analytics**
2. Veja:
   - Pageviews
   - Top pages
   - Top referrers
   - Devices/Browsers

### Logs em Tempo Real

```bash
# Via CLI
vercel logs --follow
```

Ou via Dashboard:
1. **Deployments** → Deployment atual
2. **Functions** → Selecione função
3. Logs aparecem em tempo real

### Métricas de Performance

Dashboard → **Speed Insights** (pode ser pago)

Métricas:
- Time to First Byte (TTFB)
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)

## 🐛 Troubleshooting no Deploy

### Erro: "Build Failed"

**Causa**: Erro de TypeScript ou falta de dependência

**Solução**:
```bash
# Teste build localmente
npm run build

# Corrija erros
# Faça commit e push novamente
```

### Erro: "Missing JWT_SECRET"

**Causa**: Variável de ambiente não configurada

**Solução**:
```bash
vercel env add JWT_SECRET
# Cole a chave secreta
# Faça redeploy: vercel --prod
```

### Erro: "Module not found"

**Causa**: Dependência não instalada

**Solução**:
```bash
# Verifique package.json
npm install

# Commit e push
git add package.json package-lock.json
git commit -m "Fix dependencies"
git push
```

### Erro: "Function Timeout"

**Causa**: Função levou > 10 segundos

**Solução**:

Edite `vercel.json`:
```json
{
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

(Nota: Pode requerer plano pago)

### Redirecionamento Infinito

**Causa**: Middleware com loop

**Solução**:
1. Verifique `middleware.ts`
2. Limpe cache: Dashboard → Settings → Clear Build Cache
3. Redeploy

## 💰 Custos da Vercel

### Plano Gratuito (Hobby):

```
✅ Unlimited websites
✅ 100 GB bandwidth/mês
✅ Serverless Functions
✅ Edge Middleware
✅ SSL automático
✅ 1 concurrent build
❌ Sem Analytics avançado
❌ Timeout de 10s em Functions
```

### Plano Pro ($20/mês):

```
✅ Tudo do Free +
✅ 1 TB bandwidth/mês
✅ Timeout de 60s em Functions
✅ Analytics avançado
✅ 3 concurrent builds
✅ Suporte prioritário
```

### Para Este Projeto:

**Hobby é suficiente** para:
- Até 10.000 verificações/dia
- Tráfego médio/baixo
- Projetos pessoais

**Pro necessário** para:
- Tráfego alto (> 100k/mês)
- Necessidade de analytics
- Timeouts maiores

## 🎯 Checklist Final

Antes de considerar deploy completo:

- [ ] Deploy bem-sucedido
- [ ] `JWT_SECRET` configurado
- [ ] HTTPS funcionando
- [ ] Página de bloqueio carregando
- [ ] Verificação funcionando (`/acesso`)
- [ ] Conteúdo protegido acessível (`/resgate`)
- [ ] Middleware bloqueando acessos diretos
- [ ] Logs funcionando
- [ ] Testado em desktop
- [ ] Testado em mobile
- [ ] Testado em múltiplos navegadores
- [ ] Domínio customizado configurado (opcional)
- [ ] Conteúdo personalizado adicionado

## 📞 Suporte

**Vercel**:
- Documentação: https://vercel.com/docs
- Discord: https://vercel.com/discord
- GitHub: https://github.com/vercel/vercel

**Este Projeto**:
- Veja README.md para configuração
- Veja SEGURANCA.md para detalhes de proteção
- Veja logs na Vercel para debugging

---

**Deploy completo em menos de 5 minutos!**
