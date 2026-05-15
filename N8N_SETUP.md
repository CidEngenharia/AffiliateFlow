# Guia de Configuração n8n - Affilehub

Este guia explica como instalar, configurar e integrar o n8n para automatizar o envio de links para WhatsApp e Telegram.

## 1. Instalação Local (Desenvolvimento)

A maneira mais rápida de rodar o n8n localmente é usando o `npx`:

```bash
npx n8n
```

Após rodar o comando, o n8n estará acessível em `http://localhost:5678`.

## 2. Configuração no Affilehub

1. No seu arquivo `.env`, certifique-se de que a URL do webhook do n8n está configurada:
   ```env
   VITE_N8N_WEBHOOK_URL=http://localhost:5678/webhook/affilehub-automation
   ```

2. No código do projeto, o `automationService.ts` utiliza esta URL para disparar as automações.

## 3. Criando seu primeiro Workflow no n8n

### Gatilho (Webhook)
1. No n8n, crie um novo workflow.
2. Adicione um nó de **Webhook**.
3. Configure o **HTTP Method** como `POST`.
4. O **Path** deve ser `affilehub-automation`.

### Lógica de Envio
Você pode adicionar nós condicionais para decidir se envia para WhatsApp ou Telegram baseado no payload:

```json
{
  "platform": "whatsapp",
  "linkTitle": "Oferta Especial",
  "shortUrl": "https://af.hub/abcd",
  "message": "Confira esta oferta!"
}
```

### Integração com WhatsApp (Evolution API ou similar)
1. Adicione um nó **HTTP Request**.
2. Configure para a URL da sua API de WhatsApp.
3. Use os dados do Webhook para montar a mensagem.

### Integração com Telegram
1. Adicione o nó **Telegram**.
2. Use um Bot Token (obtido via @BotFather).
3. Selecione a operação **Send Message**.

## 4. Testando a Automação
No Affilehub, vá para a seção de Campanhas ou Links, selecione um link e clique em "Automatizar". O sistema enviará um POST para o seu n8n local, que processará o envio conforme configurado no seu workflow.

---
**Nota:** Para produção, recomenda-se hospedar o n8n em um servidor (Docker, Railway, DigitalOcean) para que os webhooks funcionem 24/7.
