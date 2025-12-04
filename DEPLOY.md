# Guia Rápido de Deploy na Vercel

## Passo 1: Preparar o Projeto

O projeto já está pronto! Todas as dependências foram instaladas.

## Passo 2: Fazer Login na Vercel

Se ainda não tiver a CLI da Vercel instalada:

```bash
npm install -g vercel
```

Faça login:

```bash
vercel login
```

## Passo 3: Fazer Deploy

No diretório do projeto, execute:

```bash
vercel
```

Siga as instruções no terminal. Quando perguntado:
- "Set up and deploy?" → **Yes**
- "Which scope?" → Escolha sua conta
- "Link to existing project?" → **No**
- "What's your project's name?" → Digite um nome ou pressione Enter
- "In which directory is your code located?" → **./** (diretório atual)

O Vercel fará o deploy automaticamente.

## Passo 4: Configurar Variáveis de Ambiente

Após o deploy, você precisa configurar as variáveis de ambiente:

### Opção 1: Via Dashboard da Vercel

1. Acesse https://vercel.com/dashboard
2. Clique no seu projeto
3. Vá em **Settings** > **Environment Variables**
4. Adicione:
   - **Name:** `PUSHINPAY_TOKEN`
   - **Value:** Seu token da PushinPay
   - **Environments:** Selecione todas (Production, Preview, Development)
5. Clique em **Save**
6. (Opcional) Adicione `PUSHINPAY_WEBHOOK_TOKEN` seguindo os mesmos passos

### Opção 2: Via CLI

```bash
vercel env add PUSHINPAY_TOKEN
```

Digite o valor quando solicitado e selecione os ambientes.

## Passo 5: Redeploy

Após adicionar as variáveis de ambiente, faça um redeploy:

```bash
vercel --prod
```

## Passo 6: Testar

Acesse sua URL da Vercel (fornecida no terminal após o deploy) e teste o sistema de pagamento PIX!

## Estrutura de URLs

Após o deploy, você terá:

- **Site principal:** `https://seu-projeto.vercel.app`
- **API Create PIX:** `https://seu-projeto.vercel.app/api/create-pix`
- **API Check PIX:** `https://seu-projeto.vercel.app/api/check-pix`
- **Webhook:** `https://seu-projeto.vercel.app/api/webhook`

## Domínio Customizado (Opcional)

Para usar um domínio próprio:

1. Vá em **Settings** > **Domains**
2. Adicione seu domínio
3. Configure os DNS conforme instruções
4. Aguarde propagação (pode levar até 48h)

## Troubleshooting

### Erro: "Missing PUSHINPAY_TOKEN"

Certifique-se de que configurou a variável de ambiente e fez redeploy.

### Erro: "Function invocation failed"

Verifique os logs no dashboard da Vercel:
1. Vá em **Deployments**
2. Clique no deployment mais recente
3. Clique em **Functions**
4. Veja os logs de cada função

### Modal não abre

Verifique o console do navegador (F12) para erros JavaScript.

## Atualizações Futuras

Para atualizar o código:

1. Faça suas alterações
2. Execute `vercel --prod` no terminal
3. Confirme o deploy

Pronto! Seu sistema está no ar.
