# Arquitetura do Sistema de Pagamento PIX

Este documento explica a arquitetura completa do sistema de pagamento PIX integrado.

## Visão Geral

```
┌─────────────────────────────────────────────────────────────┐
│                        USUÁRIO                               │
│                     (Navegador Web)                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ 1. Clica em "Pagar"
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND (HTML/JS)                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ index.html                                           │   │
│  │  - Botão de pagamento                                │   │
│  │  - Event listener                                    │   │
│  └─────────────────┬───────────────────────────────────┘   │
│                    │ 2. Abre modal                          │
│  ┌─────────────────▼───────────────────────────────────┐   │
│  │ pix-modal.js                                         │   │
│  │  - Exibe modal                                       │   │
│  │  - Renderiza QR Code                                 │   │
│  │  - Gerencia UI                                       │   │
│  └─────────────────┬───────────────────────────────────┘   │
│                    │ 3. Solicita criação do PIX             │
│  ┌─────────────────▼───────────────────────────────────┐   │
│  │ pix-manager.js                                       │   │
│  │  - Gerencia estado                                   │   │
│  │  - Faz chamadas API                                  │   │
│  │  - Controla polling                                  │   │
│  └─────────────────┬───────────────────────────────────┘   │
└────────────────────┼────────────────────────────────────────┘
                     │
                     │ 4. POST /api/create-pix
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              VERCEL SERVERLESS FUNCTIONS                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ /api/create-pix.js                                   │   │
│  │  - Valida valor                                      │   │
│  │  - Converte para centavos                            │   │
│  │  - Chama PushinPay API                               │◄──┼── PUSHINPAY_TOKEN
│  │  - Retorna QR Code                                   │   │
│  └─────────────────┬───────────────────────────────────┘   │
│                    │ 5. Retorna dados do PIX                │
│                    │                                         │
│  ┌─────────────────▼───────────────────────────────────┐   │
│  │ /api/check-pix.js                                    │   │
│  │  - Recebe transaction ID                             │   │
│  │  - Consulta status na PushinPay                      │   │
│  │  - Retorna status atualizado                         │   │
│  └─────────────────┬───────────────────────────────────┘   │
│                    │ 6. Polling a cada 3s                   │
│                    │                                         │
│  ┌─────────────────▼───────────────────────────────────┐   │
│  │ /api/webhook.js                                      │   │
│  │  - Recebe notificações da PushinPay                  │   │
│  │  - Valida token de segurança                         │   │
│  │  - Loga eventos                                      │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ 7. Comunicação com API Externa
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   PUSHINPAY API                              │
│  - https://api.pushinpay.com.br                              │
│  - Gera PIX                                                  │
│  - Processa pagamento                                        │
│  - Envia webhook                                             │
└─────────────────────────────────────────────────────────────┘
```

## Componentes Detalhados

### 1. Frontend (Cliente)

#### **index.html**
- Página principal do site
- Contém botão "Pagar taxa para Liberar Saque"
- Carrega bibliotecas e scripts necessários
- Define valor do pagamento (R$ 27,65)

**Tecnologias:**
- HTML5
- CSS3 (TikTok Bônus design)
- Vanilla JavaScript

#### **pix-modal.js**
Classe que gerencia a interface do modal de pagamento.

**Responsabilidades:**
- Criar estrutura HTML do modal
- Exibir/ocultar modal
- Renderizar QR Code usando biblioteca `qrcode`
- Implementar botão de copiar código
- Gerenciar estados visuais (loading, error, success)
- Executar callback de sucesso

**Métodos principais:**
```javascript
open(amount, onSuccess)     // Abre modal e inicia processo
close()                      // Fecha modal e reseta estado
generatePix()                // Solicita criação do PIX
renderQRCode(code)           // Desenha QR Code no canvas
copyCode()                   // Copia código PIX para clipboard
handlePaymentSuccess()       // Executa quando pago
```

#### **pix-manager.js**
Classe que gerencia a lógica de negócio e comunicação com APIs.

**Responsabilidades:**
- Fazer requisições HTTP para as APIs
- Gerenciar estado do pagamento
- Implementar polling automático (3 em 3 segundos)
- Detectar quando pagamento foi confirmado
- Gerenciar callbacks

**Métodos principais:**
```javascript
createPix(amount)            // Cria PIX via API
checkPixStatus(id)           // Verifica status do pagamento
startPolling(id)             // Inicia verificação automática
stopPolling()                // Para verificação
reset()                      // Limpa estado
```

**Estados gerenciados:**
- `loading` - Carregando
- `error` - Erro ocorreu
- `pixData` - Dados do PIX (QR Code, ID, etc)
- `isPaid` - Pagamento confirmado

#### **pix-modal.css**
Estilos do modal seguindo design do TikTok Bônus.

**Características:**
- Cores do tema TikTok (#fe2c55)
- Responsivo mobile-first
- Animações suaves
- Estados de loading/error/success
- Acessibilidade (ARIA labels)

### 2. Backend (Serverless Functions)

#### **/api/create-pix.js**
Endpoint para criar um novo PIX.

**Request:**
```javascript
POST /api/create-pix
Content-Type: application/json
{
  "value": 27.65  // Valor em reais
}
```

**Response (sucesso):**
```javascript
{
  "id": "abc123",
  "qr_code": "00020126...",  // Código PIX copia/cola
  "qr_code_base64": "data:image/png;base64...",
  "status": "pending",
  "value": 2765  // Valor em centavos
}
```

**Fluxo:**
1. Valida valor (mínimo R$ 0,01)
2. Converte reais para centavos
3. Monta URL do webhook
4. Chama PushinPay API
5. Retorna dados do PIX

#### **/api/check-pix.js**
Endpoint para verificar status de um pagamento.

**Request:**
```javascript
GET /api/check-pix?id=abc123
```

**Response:**
```javascript
{
  "id": "abc123",
  "status": "paid",  // ou "pending", "expired", "cancelled"
  "value": 2765,
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:05:00Z"
}
```

**Fluxo:**
1. Recebe transaction ID
2. Consulta PushinPay API
3. Retorna status atualizado

#### **/api/webhook.js**
Endpoint para receber notificações da PushinPay.

**Request (vindo da PushinPay):**
```javascript
POST /api/webhook
Content-Type: application/json
X-PushinPay-Token: optional_webhook_token
{
  "id": "abc123",
  "status": "paid",
  "value": 2765,
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:05:00Z"
}
```

**Response:**
```javascript
{
  "received": true,
  "transaction_id": "abc123",
  "status": "paid"
}
```

**Fluxo:**
1. Recebe notificação da PushinPay
2. (Opcional) Valida token de segurança
3. Loga evento no console
4. Retorna confirmação

**Nota:** Este endpoint é passivo. O polling no frontend já detecta o pagamento, mas o webhook é útil para logs e integrações futuras.

### 3. API Externa (PushinPay)

#### **Criar PIX**
```
POST https://api.pushinpay.com.br/api/pix/cashIn
Authorization: Bearer {token}
{
  "value": 2765,
  "webhook_url": "https://seu-site.vercel.app/api/webhook"
}
```

#### **Consultar Transação**
```
GET https://api.pushinpay.com.br/api/transactions/{id}
Authorization: Bearer {token}
```

## Fluxo Completo de Pagamento

### 1. Usuário Inicia Pagamento

```
Usuário clica em "Pagar taxa para Liberar Saque"
        ↓
index.html event listener detecta clique
        ↓
Chama pixPaymentModal.open(27.65, callback)
```

### 2. Modal Abre e Gera PIX

```
Modal exibe estado de loading
        ↓
pix-manager.js chama createPix(27.65)
        ↓
Faz POST para /api/create-pix
        ↓
API converte 27.65 → 2765 centavos
        ↓
API chama PushinPay para criar PIX
        ↓
PushinPay retorna QR Code e ID
        ↓
API retorna dados para frontend
        ↓
Modal renderiza QR Code no canvas
        ↓
Exibe código copia/cola
        ↓
Inicia polling (3 em 3 segundos)
```

### 3. Usuário Paga PIX

```
Usuário abre app do banco
        ↓
Escaneia QR Code ou cola código
        ↓
Confirma pagamento no banco
        ↓
Banco processa pagamento
        ↓
PushinPay recebe confirmação
        ↓
Status muda de "pending" para "paid"
```

### 4. Sistema Detecta Pagamento

**Via Polling (principal):**
```
A cada 3 segundos:
  pix-manager.js chama checkPixStatus()
        ↓
  Faz GET para /api/check-pix?id=abc123
        ↓
  API consulta PushinPay
        ↓
  Retorna status atualizado
        ↓
  Se status === "paid":
    - Para polling
    - Chama callback de sucesso
    - Modal exibe confirmação
    - Após 2s fecha modal
```

**Via Webhook (secundário):**
```
PushinPay envia POST para /api/webhook
        ↓
API loga evento no console
        ↓
Retorna confirmação
(Não afeta UI diretamente, mas útil para logs)
```

## Segurança

### 1. Token de API

- Armazenado em variável de ambiente na Vercel
- Nunca exposto no frontend
- Usado apenas nas serverless functions
- Criptografado pela Vercel

### 2. CORS

Todas as APIs incluem headers CORS:
```javascript
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

### 3. Validação

**No frontend:**
- Valida valor mínimo (R$ 0,01)
- Valida tipos de dados

**No backend:**
- Valida valor mínimo
- Valida requisição HTTP
- Valida resposta da PushinPay

### 4. Webhook Token

Opcional mas recomendado:
```javascript
if (webhookToken !== process.env.PUSHINPAY_WEBHOOK_TOKEN) {
  // Rejeita notificação não autenticada
}
```

## Performance

### Otimizações

1. **QR Code via CDN** - Carrega biblioteca externa
2. **Polling inteligente** - Para quando pago ou expirado
3. **Cache do modal** - Criado uma vez, reutilizado
4. **Lazy loading** - Scripts carregam sob demanda

### Métricas

- **Tempo para gerar PIX:** ~1-2 segundos
- **Tempo para detectar pagamento:** ~3-6 segundos (polling)
- **Tamanho do QR Code:** 240x240px (~5KB)
- **Timeout das APIs:** 10 segundos (configurado em vercel.json)

## Escalabilidade

### Limitações

- **Serverless functions:** 10s timeout por requisição
- **PushinPay API:** Rate limits (consulte documentação)
- **Vercel free tier:** 100GB bandwidth/mês

### Para Escalar

1. Implementar cache de transações
2. Usar banco de dados para histórico
3. Implementar rate limiting
4. Monitorar erros com Sentry
5. Usar CDN para assets

## Monitoramento

### Logs Disponíveis

**Vercel Dashboard:**
1. Vá em **Deployments**
2. Clique no deployment
3. Veja **Functions** para logs

**Console do Navegador:**
- Erros de JavaScript
- Requisições de rede
- Estados do PIX manager

### Eventos Logados

```javascript
// No backend
console.log('PIX criado:', data.id)
console.error('Erro ao criar PIX:', error)

// No frontend
console.log('Pagamento confirmado!')
console.error('Erro ao gerar QR Code')
```

## Manutenção

### Atualizações Futuras

**Adicionar funcionalidades:**
1. Histórico de transações
2. Múltiplos métodos de pagamento
3. Desconto por tempo limitado
4. Integração com email

**Melhorias de UX:**
1. Animação do QR Code
2. Som de confirmação
3. Compartilhar código via WhatsApp
4. Timer de expiração visual

**Otimizações:**
1. Server-Sent Events ao invés de polling
2. WebSocket para atualizações real-time
3. Service Worker para offline support

## Troubleshooting

### Problemas Comuns

| Problema | Causa | Solução |
|----------|-------|---------|
| "Missing PUSHINPAY_TOKEN" | Variável não configurada | Configure na Vercel |
| Modal não abre | JavaScript não carregou | Verifique console |
| QR Code não aparece | Biblioteca QRCode não carregou | Verifique CDN |
| Polling não para | Status nunca muda | Verifique webhook |
| Erro CORS | Headers incorretos | Verifique APIs |

### Debug

1. **Abra DevTools (F12)**
2. **Vá em Network**
3. **Tente fazer pagamento**
4. **Veja requisições:**
   - `/api/create-pix` - Deve retornar 200
   - `/api/check-pix` - Deve retornar 200 a cada 3s

5. **Veja Console** para erros JavaScript

## Conclusão

Este sistema é:
- ✅ **Simples** - Sem banco de dados
- ✅ **Rápido** - Serverless com baixa latência
- ✅ **Seguro** - Tokens protegidos, HTTPS
- ✅ **Escalável** - Auto-scaling da Vercel
- ✅ **Manutenível** - Código modular e documentado

Perfeito para aceitar pagamentos PIX de forma rápida e confiável.
