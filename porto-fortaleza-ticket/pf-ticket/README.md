# Porto Fortaleza – Gerador de Ticket

Sistema automático de geração de ticket de pesagem a partir de Notas Fiscais em PDF.

## Como funciona

1. Operador faz upload do PDF da Nota Fiscal
2. A IA extrai automaticamente: número da NF, data, peso da carga, placa, material
3. O sistema cruza a placa com a tabela de tara cadastrada
4. Operador confere os dados e gera o Ticket PDF pronto para impressão

---

## Deploy no Vercel (passo a passo)

### 1. Criar conta no Vercel
Acesse [vercel.com](https://vercel.com) e crie uma conta gratuita (pode entrar com GitHub, GitLab ou Google).

### 2. Instalar o Vercel CLI (opcional mas mais fácil)
```bash
npm install -g vercel
```

### 3. Fazer deploy

**Opção A — via CLI (terminal):**
```bash
# Na pasta do projeto:
vercel

# Siga as perguntas:
# - Set up and deploy? Y
# - Which scope? (sua conta)
# - Link to existing project? N
# - Project name? porto-fortaleza-ticket
# - Directory? ./
# - Override settings? N
```

**Opção B — via GitHub:**
1. Suba este projeto para um repositório no GitHub
2. Em vercel.com → "Add New Project" → importe o repositório
3. Clique em Deploy

### 4. Configurar a chave da API (OBRIGATÓRIO)

Após o deploy, vá em:
**Vercel Dashboard → seu projeto → Settings → Environment Variables**

Adicione:
| Nome | Valor |
|------|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` (sua chave da Anthropic) |

> ⚠️ A chave nunca fica exposta no navegador — ela fica segura no servidor.

### 5. Fazer redeploy
Após adicionar a variável de ambiente, clique em **Deployments → Redeploy** para aplicar.

### 6. Pronto!
Sua URL será algo como: `https://porto-fortaleza-ticket.vercel.app`

---

## Estrutura do projeto

```
porto-fortaleza-ticket/
├── api/
│   └── extract.js      ← Servidor: chama a API da Anthropic com segurança
├── public/
│   └── index.html      ← Frontend completo
├── vercel.json         ← Configuração do Vercel
└── package.json
```

## Onde obter a chave da API Anthropic

1. Acesse [console.anthropic.com](https://console.anthropic.com)
2. Vá em **API Keys → Create Key**
3. Copie a chave (começa com `sk-ant-`)
4. Cole no Vercel conforme instruções acima
