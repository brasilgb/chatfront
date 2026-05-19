# Guia de conexao com o front

Documento para o front-end integrar com a API do chatbot e dos indicadores.

## Base URL

Em desenvolvimento local:

```txt
http://localhost:8000
```

Em producao, usar a URL publicada da API. A API ja libera CORS para:

```txt
https://chatbot.gruposolar.com.br
http://localhost:3000
http://127.0.0.1:3000
```

## Comandos uteis

Subir a API localmente:

```bash
uvicorn app.main:app --reload
```

Documentacao automatica:

```txt
GET /docs
GET /redoc
```

Health checks:

```txt
GET /
GET /health
GET /health/db
```

## Padroes gerais

- Todas as rotas retornam JSON.
- Datas devem ser enviadas no formato `YYYY-MM-DD`.
- Valores monetarios e percentuais podem chegar como numero ou string decimal, dependendo da serializacao do `Decimal` pelo FastAPI/Pydantic. No front, tratar como `number | string | null` e converter antes de formatar.
- `departamento` e opcional. Quando nao enviado, a rota retorna todos os departamentos ou o ultimo registro geral, conforme o endpoint.
- Departamentos usados hoje:
  - `1`: Lojas
  - `5`: Naturovos

## Chat

### Enviar pergunta

```txt
POST /chat/
Content-Type: application/json
```

Body:

```json
{
  "message": "Qual foi o faturamento das lojas hoje?"
}
```

Resposta de sucesso:

```json
{
  "success": true,
  "answer": "Texto pronto para exibir no chat",
  "intent": {
    "modulo": "resumo_total",
    "tipo": "faturamento",
    "departamento": 1,
    "departamento_nome": "lojas",
    "data": "2026-05-13",
    "data_inicio": "2026-05-13",
    "data_fim": "2026-05-13",
    "pergunta": "Qual foi o faturamento das lojas hoje?"
  }
}
```

Resposta quando a pergunta nao for entendida:

```json
{
  "success": false,
  "answer": "Nao consegui entender sua pergunta.",
  "intent": {
    "modulo": "resumo_total",
    "tipo": "ultimo",
    "departamento": null,
    "departamento_nome": null,
    "data": "2026-05-13",
    "data_inicio": "2026-05-13",
    "data_fim": "2026-05-13",
    "pergunta": "..."
  }
}
```

Exemplo no front:

```ts
export async function sendChatMessage(message: string) {
  const response = await fetch(`${API_URL}/chat/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error("Falha ao enviar mensagem");
  }

  return response.json();
}
```

## Resumo Total

Objeto base retornado por `/resumo-total/ultimo` e `/resumo-total/data`:

```ts
export type ResumoTotal = {
  id: number | null;
  data_chave: number | null;
  data_referencia: string | null;
  departamento: number | null;
  atualizacao: string | null;
  meta: number | string | null;
  faturamento: number | string | null;
  projecao: number | string | null;
  margem: number | string | null;
  preco_medio: number | string | null;
  ticket_medio: number | string | null;
  meta_alcancada: number | string | null;
  faturamento_sem_brasil: number | string | null;
  margem_sem_brasil: number | string | null;
  preco_medio_sem_brasil: number | string | null;
  venda_agora: number | string | null;
  venda_dia: number | string | null;
  margem_media_ano: number | string | null;
  juros_medio_ano: number | string | null;
  juros: number | string | null;
  juro_agora: number | string | null;
};
```

### Ultimo resumo

```txt
GET /resumo-total/ultimo
GET /resumo-total/ultimo?departamento=1
```

Retorna um `ResumoTotal` ou `null`.

### Resumo por data

```txt
GET /resumo-total/data?data=2026-05-13
GET /resumo-total/data?data=2026-05-13&departamento=5
```

Retorna `ResumoTotal[]`.

### Resumo por periodo

```txt
GET /resumo-total/periodo?data_inicio=2026-05-01&data_fim=2026-05-13
GET /resumo-total/periodo?data_inicio=2026-05-01&data_fim=2026-05-13&departamento=1
```

Retorna dados somados por departamento:

```ts
export type ResumoPeriodo = {
  departamento: number | null;
  data_inicio: string | null;
  data_fim: string | null;
  meta: number | string | null;
  faturamento: number | string | null;
  faturamento_sem_brasil: number | string | null;
  venda_agora: number | string | null;
  venda_dia: number | string | null;
  juro_agora: number | string | null;
};
```

### Evolucao de faturamento

```txt
GET /resumo-total/evolucao?data_inicio=2026-05-01&data_fim=2026-05-13
GET /resumo-total/evolucao?data_inicio=2026-05-01&data_fim=2026-05-13&departamento=5
```

Retorna uma lista ordenada por data e departamento:

```ts
export type EvolucaoFaturamento = {
  data_referencia: string | null;
  departamento: number | null;
  faturamento: number | string | null;
  meta: number | string | null;
  projecao: number | string | null;
  margem: number | string | null;
  meta_alcancada: number | string | null;
  venda_agora: number | string | null;
  venda_dia: number | string | null;
};
```

### Meta vs realizado

```txt
GET /resumo-total/meta-vs-realizado?data=2026-05-13
GET /resumo-total/meta-vs-realizado?data=2026-05-13&departamento=1
```

Retorna:

```ts
export type MetaVsRealizado = {
  data_referencia: string | null;
  departamento: number | null;
  meta: number | string | null;
  faturamento: number | string | null;
  projecao: number | string | null;
  meta_alcancada: number | string | null;
};
```

## Cliente HTTP sugerido

```ts
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`);

  if (!response.ok) {
    throw new Error(`Erro na API: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getUltimoResumo(departamento?: number) {
  const params = new URLSearchParams();
  if (departamento) params.set("departamento", String(departamento));

  const query = params.toString();
  return apiGet<ResumoTotal | null>(
    `/resumo-total/ultimo${query ? `?${query}` : ""}`,
  );
}

export function getResumoPorData(data: string, departamento?: number) {
  const params = new URLSearchParams({ data });
  if (departamento) params.set("departamento", String(departamento));

  return apiGet<ResumoTotal[]>(`/resumo-total/data?${params.toString()}`);
}
```

## Formatacao recomendada no front

```ts
export function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  return Number(value);
}

export function formatCurrency(value: number | string | null | undefined) {
  const parsed = toNumber(value);
  if (parsed === null || Number.isNaN(parsed)) return "-";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(parsed);
}

export function formatPercent(value: number | string | null | undefined) {
  const parsed = toNumber(value);
  if (parsed === null || Number.isNaN(parsed)) return "-";

  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parsed);
}
```

## Observacoes para UI

- Para chat, exibir diretamente o campo `answer`.
- Para dashboards/graficos, preferir os endpoints de `/resumo-total/*`, porque retornam dados estruturados.
- Para graficos de linha, usar `/resumo-total/evolucao`.
- Para cards de KPI do dia, usar `/resumo-total/ultimo` ou `/resumo-total/data`.
- Para comparacao meta x realizado, usar `/resumo-total/meta-vs-realizado`.
