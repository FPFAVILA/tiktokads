# Configuração da PushinPay

Este guia explica como obter e configurar suas credenciais da API PushinPay.

## Passo 1: Criar Conta na PushinPay

1. Acesse https://pushinpay.com.br
2. Clique em "Criar Conta" ou "Cadastre-se"
3. Preencha seus dados:
   - Nome completo
   - E-mail
   - Telefone
   - Senha
4. Confirme seu e-mail
5. Complete o processo de verificação de identidade (KYC)

## Passo 2: Obter Token da API

1. Faça login no painel da PushinPay
2. Vá em **Configurações** ou **API**
3. Procure por **"Token de API"** ou **"Chave de API"**
4. Copie o token fornecido
5. Guarde em local seguro (nunca compartilhe!)

### Formato do Token

O token geralmente tem este formato:
```
pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
ou
```
pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Importante:**
- `pk_test_*` = Ambiente de testes (sandbox)
- `pk_live_*` = Ambiente de produção

## Passo 3: Configurar Webhook (Opcional)

Para receber notificações automáticas quando um pagamento é confirmado:

1. No painel da PushinPay, vá em **Webhooks** ou **Notificações**
2. Adicione uma nova URL de webhook:
   ```
   https://seu-projeto.vercel.app/api/webhook
   ```
3. Escolha os eventos:
   - ✅ Pagamento confirmado
   - ✅ Pagamento expirado
   - ✅ Pagamento cancelado
4. (Opcional) Configure um token de segurança
5. Salve as configurações

## Passo 4: Adicionar Token no Projeto

### Via Vercel Dashboard

1. Acesse https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** > **Environment Variables**
4. Adicione:
   - **Variable name:** `PUSHINPAY_TOKEN`
   - **Value:** Cole seu token da PushinPay
   - **Environments:** Selecione todas (Production, Preview, Development)
5. Clique em **Save**

### Via Vercel CLI

```bash
vercel env add PUSHINPAY_TOKEN
```

Digite o token quando solicitado.

### Para Desenvolvimento Local

Crie um arquivo `.env` na raiz do projeto:

```env
PUSHINPAY_TOKEN=pk_live_seu_token_aqui
PUSHINPAY_WEBHOOK_TOKEN=seu_token_webhook_opcional
```

**Importante:** Nunca faça commit do arquivo `.env`! Ele já está no `.gitignore`.

## Passo 5: Testar a Integração

### Modo Teste (Sandbox)

Use um token `pk_test_*` para testar sem cobrar de verdade:

1. Configure `PUSHINPAY_TOKEN` com token de teste
2. Faça deploy na Vercel
3. Acesse seu site e tente fazer um pagamento
4. Use a ferramenta de simulação da PushinPay para "pagar" o PIX

### Modo Produção

Quando estiver pronto para aceitar pagamentos reais:

1. Substitua `PUSHINPAY_TOKEN` pelo token de produção (`pk_live_*`)
2. Faça redeploy:
   ```bash
   vercel --prod
   ```
3. Teste com um pagamento real de baixo valor

## Limites e Taxas

Consulte a PushinPay para informações sobre:

- Taxa por transação
- Valor mínimo de PIX
- Valor máximo por transação
- Limite diário
- Prazo para recebimento
- Horários de processamento

## Segurança

### Boas Práticas

1. ✅ Nunca exponha o token no frontend
2. ✅ Use HTTPS em produção (Vercel já usa)
3. ✅ Configure webhook token para validar notificações
4. ✅ Monitore os logs de transações
5. ✅ Use token de teste durante desenvolvimento
6. ❌ Nunca faça commit do token no Git
7. ❌ Nunca compartilhe seu token

### Validação de Webhook

Para maior segurança, configure um token de webhook:

1. Gere um token aleatório:
   ```bash
   openssl rand -hex 32
   ```
2. Configure na PushinPay
3. Adicione na Vercel como `PUSHINPAY_WEBHOOK_TOKEN`

O sistema validará automaticamente as notificações recebidas.

## Suporte

### Documentação da PushinPay

- [Documentação Oficial](https://docs.pushinpay.com.br)
- [API Reference](https://docs.pushinpay.com.br/api)
- [Exemplos de Código](https://docs.pushinpay.com.br/examples)

### Contato

- **E-mail:** suporte@pushinpay.com.br
- **WhatsApp:** (verifique no painel)
- **Chat:** Disponível no painel da PushinPay

### Problemas Comuns

#### "Unauthorized" ou "Invalid token"

- Verifique se o token está correto
- Certifique-se de que configurou na Vercel
- Confirme que fez redeploy após adicionar a variável

#### "Insufficient funds" ou "Account blocked"

- Verifique seu saldo na PushinPay
- Confirme que sua conta está ativa
- Entre em contato com o suporte

#### PIX não é gerado

- Verifique os logs na Vercel (Dashboard > Functions)
- Confirme que o valor é maior que o mínimo permitido
- Teste com token de sandbox primeiro

## Checklist de Configuração

Antes de ir para produção:

- [ ] Conta PushinPay criada e verificada
- [ ] Token de API copiado
- [ ] Token configurado na Vercel
- [ ] Webhook URL configurada (opcional)
- [ ] Testado em sandbox
- [ ] Verificado logs de transação
- [ ] Confirmado taxa de transação
- [ ] Documentado processo para equipe
- [ ] Configurado token de webhook para segurança
- [ ] Testado com pagamento real de baixo valor

Pronto! Seu sistema está configurado e pronto para aceitar pagamentos PIX via PushinPay.
