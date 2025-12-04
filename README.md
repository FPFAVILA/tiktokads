# Sistema de Pagamento PIX com PushinPay

Sistema integrado de pagamento PIX utilizando a API PushinPay, hospedado na Vercel com serverless functions.

## Recursos

- Geração de QR Code PIX em tempo real
- Código PIX copia/cola
- Polling automático para verificar pagamento (a cada 3 segundos)
- Interface responsiva e integrada ao design existente
- Sem banco de dados necessário
- Deploy simples na Vercel

## Instalação

1. Instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente (veja seção abaixo)

3. Faça o deploy na Vercel:
```bash
npm run deploy
```

## Configuração das Variáveis de Ambiente

### No Painel da Vercel

1. Acesse seu projeto na Vercel
2. Vá em **Settings** > **Environment Variables**
3. Adicione as seguintes variáveis:

**Obrigatória:**
- `PUSHINPAY_TOKEN` - Token de autenticação da API PushinPay

**Opcional:**
- `PUSHINPAY_WEBHOOK_TOKEN` - Token para validar webhooks (recomendado para produção)

### Exemplo local (.env)

Copie o arquivo `.env.example` para `.env` e preencha com seus valores:

```bash
cp .env.example .env
```

## Como Funciona

### Fluxo de Pagamento

1. Usuário clica no botão "Pagar taxa para Liberar Saque"
2. Modal abre e chama `/api/create-pix` com o valor (R$ 27,65)
3. API cria o PIX na PushinPay e retorna QR Code + código copia/cola
4. Modal exibe QR Code e inicia polling automático
5. A cada 3 segundos, verifica status em `/api/check-pix`
6. Quando status = 'paid', exibe confirmação e executa callback de sucesso
7. Webhook `/api/webhook` recebe notificação da PushinPay (opcional)

### Arquivos Principais

**Serverless Functions:**
- `/api/create-pix.js` - Cria PIX na PushinPay
- `/api/check-pix.js` - Verifica status do pagamento
- `/api/webhook.js` - Recebe webhooks da PushinPay

**Frontend:**
- `/assets/js/pix-manager.js` - Gerencia estado e polling
- `/assets/js/pix-modal.js` - Modal de pagamento
- `/assets/css/pix-modal.css` - Estilos do modal

## API PushinPay

### Documentação

- [Documentação Oficial](https://docs.pushinpay.com.br)
- Endpoint base: `https://api.pushinpay.com.br`

### Criar PIX

```javascript
POST /api/pix/cashIn
Headers:
  Authorization: Bearer {token}
  Content-Type: application/json
Body:
  {
    "value": 2765,  // Valor em centavos
    "webhook_url": "https://seu-dominio.vercel.app/api/webhook"
  }
```

### Consultar Status

```javascript
GET /api/transactions/{id}
Headers:
  Authorization: Bearer {token}
```

### Status Possíveis

- `pending` - Aguardando pagamento
- `paid` - Pago
- `expired` - Expirado
- `cancelled` - Cancelado

## Customização

### Alterar Valor do Pagamento

No arquivo `index.html`, linha 983:
```javascript
const paymentAmount = 27.65; // Altere aqui
```

### Alterar Intervalo de Polling

No arquivo `assets/js/pix-manager.js`, linha 77:
```javascript
}, 3000); // Intervalo em milissegundos (3000 = 3 segundos)
```

### Customizar Design

Edite o arquivo `assets/css/pix-modal.css` para ajustar cores, tamanhos e animações.

## Desenvolvimento Local

Para testar localmente com as serverless functions:

```bash
npm run dev
```

Isso iniciará o Vercel Dev Server em `http://localhost:3000`

## Deploy na Vercel

### Via CLI

```bash
npm run deploy
```

### Via Dashboard

1. Conecte seu repositório Git na Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

## Suporte

Para problemas com:
- **PushinPay API**: Entre em contato com o suporte da PushinPay
- **Vercel**: Consulte a [documentação da Vercel](https://vercel.com/docs)
- **Código**: Revise os logs no painel da Vercel

## Segurança

- Nunca exponha o `PUSHINPAY_TOKEN` no frontend
- Use `PUSHINPAY_WEBHOOK_TOKEN` para validar webhooks
- Todas as chamadas à API são feitas via serverless functions
- Tokens ficam seguros nas variáveis de ambiente da Vercel

## Licença

Código proprietário. Todos os direitos reservados.
