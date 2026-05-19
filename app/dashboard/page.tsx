"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

type Log = {
  id: number;
  pergunta: string;
  resposta: string;
  sucesso: boolean;
  created_at: string;
};

type Metricas = {
  total_perguntas: number;
  total_sucesso: number;
  total_falhas: number;
};

type UsoPorDia = {
  data: string;
  total: number;
  sucesso: number;
  falhas: number;
};

type RankingItem = {
  pergunta?: string;
  intent?: string;
  total: number;
};

const API = process.env.NEXT_PUBLIC_API_URL || "/api";

export default function Dashboard() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [semResposta, setSemResposta] = useState<Log[]>([]);
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [usoPorDia, setUsoPorDia] = useState<UsoPorDia[]>([]);

  const [topPerguntas, setTopPerguntas] = useState<RankingItem[]>([]);
  const [rankingIntents, setRankingIntents] = useState<RankingItem[]>([]);
  const [topSemResposta, setTopSemResposta] = useState<RankingItem[]>([]);

  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");

  const [modalAberto, setModalAberto] = useState(false);
  const [perguntaSelecionada, setPerguntaSelecionada] = useState<Log | null>(null);
  const [perguntaChave, setPerguntaChave] = useState("");
  const [respostaAprendida, setRespostaAprendida] = useState("");
  const [salvandoAprendizado, setSalvandoAprendizado] = useState(false);

  const carregarDados = useCallback(async () => {
    const params = new URLSearchParams();

    if (inicio) params.append("inicio", inicio);
    if (fim) params.append("fim", fim);

    const query = params.toString() ? `?${params.toString()}` : "";

    const [
      metricasRes,
      logsRes,
      semRespostaRes,
      usoPorDiaRes,
      topPerguntasRes,
      rankingIntentsRes,
      topSemRespostaRes,
    ] = await Promise.all([
      fetch(`${API}/chat/dashboard/metricas${query}`),
      fetch(`${API}/chat/dashboard/logs${query}`),
      fetch(`${API}/chat/dashboard/sem-resposta${query}`),
      fetch(`${API}/chat/dashboard/uso-por-dia${query}`),
      fetch(`${API}/chat/dashboard/top-perguntas${query}`),
      fetch(`${API}/chat/dashboard/ranking-intents${query}`),
      fetch(`${API}/chat/dashboard/top-sem-resposta${query}`),
    ]);

    const metricasJson = await metricasRes.json();
    const logsJson = await logsRes.json();
    const semRespostaJson = await semRespostaRes.json();
    const usoPorDiaJson = await usoPorDiaRes.json();
    const topPerguntasJson = await topPerguntasRes.json();
    const rankingIntentsJson = await rankingIntentsRes.json();
    const topSemRespostaJson = await topSemRespostaRes.json();

    setMetricas(metricasJson.data || null);
    setLogs(logsJson.data || []);
    setSemResposta(semRespostaJson.data || []);
    setUsoPorDia(usoPorDiaJson.data || []);
    setTopPerguntas(topPerguntasJson.data || []);
    setRankingIntents(rankingIntentsJson.data || []);
    setTopSemResposta(topSemRespostaJson.data || []);
  }, [fim, inicio]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void carregarDados();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [carregarDados]);

  const abrirModalAprendizado = (log: Log) => {
    setPerguntaSelecionada(log);
    setPerguntaChave(log.pergunta.toLowerCase().trim());
    setRespostaAprendida("");
    setModalAberto(true);
  };

  const fecharModalAprendizado = () => {
    setModalAberto(false);
    setPerguntaSelecionada(null);
    setPerguntaChave("");
    setRespostaAprendida("");
  };

  const salvarAprendizado = async () => {
    if (!perguntaSelecionada || !perguntaChave || !respostaAprendida) {
      alert("Preencha a pergunta chave e a resposta.");
      return;
    }

    try {
      setSalvandoAprendizado(true);

      const response = await fetch(`${API}/chat/dashboard/aprendizados`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pergunta_original: perguntaSelecionada.pergunta,
          pergunta_chave: perguntaChave,
          resposta: respostaAprendida,
          intent: {
            origem: "dashboard",
            tipo: "aprendizado_manual",
          },
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error("Erro ao salvar aprendizado.");
      }

      fecharModalAprendizado();
      await carregarDados();

      alert("Aprendizado salvo com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Não foi possível salvar o aprendizado.");
    } finally {
      setSalvandoAprendizado(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <Header
          inicio={inicio}
          fim={fim}
          setInicio={setInicio}
          setFim={setFim}
          onFiltrar={carregarDados}
        />

        {metricas && (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <MetricCard
              title="Total de perguntas"
              value={metricas.total_perguntas}
              description="Consultas recebidas"
            />
            <MetricCard
              title="Sucesso"
              value={metricas.total_sucesso}
              description="Respostas encontradas"
              accent="green"
            />
            <MetricCard
              title="Falhas"
              value={metricas.total_falhas}
              description="Sem resposta ou erro"
              accent="red"
            />
          </section>
        )}

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <RankingCard
            title="Top perguntas"
            subtitle="Perguntas mais repetidas"
            data={topPerguntas}
            labelKey="pergunta"
          />

          <RankingCard
            title="Ranking de intents"
            subtitle="Intenções mais detectadas"
            data={rankingIntents}
            labelKey="intent"
          />

          <RankingCard
            title="Top sem resposta"
            subtitle="Prioridade para melhorar a IA"
            data={topSemResposta}
            labelKey="pergunta"
            danger
          />
        </section>

        <ChartCard data={usoPorDia} />

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <LogSection title="Últimas perguntas" logs={logs} />

          <LogSection
            title="Perguntas sem resposta"
            logs={semResposta}
            danger
            showAprender
            onAprender={abrirModalAprendizado}
          />
        </section>
      </div>

      {modalAberto && perguntaSelecionada && (
        <AprendizadoModal
          perguntaSelecionada={perguntaSelecionada}
          perguntaChave={perguntaChave}
          respostaAprendida={respostaAprendida}
          salvandoAprendizado={salvandoAprendizado}
          setPerguntaChave={setPerguntaChave}
          setRespostaAprendida={setRespostaAprendida}
          onClose={fecharModalAprendizado}
          onSave={salvarAprendizado}
        />
      )}
    </main>
  );
}

function Header({
  inicio,
  fim,
  setInicio,
  setFim,
  onFiltrar,
}: {
  inicio: string;
  fim: string;
  setInicio: (value: string) => void;
  setFim: (value: string) => void;
  onFiltrar: () => void;
}) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-sm font-medium text-blue-400">
          Chatbot Grupo Solar
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
          Dashboard de Inteligência
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Acompanhe uso, falhas, perguntas recorrentes e intenções mais usadas.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <DateInput label="Início" value={inicio} onChange={setInicio} />
          <DateInput label="Fim" value={fim} onChange={setFim} />

          <button
            onClick={onFiltrar}
            className="h-10 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Filtrar
          </button>
        </div>
      </div>
    </header>
  );
}

function DateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-400">
        {label}
      </label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none transition focus:border-blue-500"
      />
    </div>
  );
}

function MetricCard({
  title,
  value,
  description,
  accent = "blue",
}: {
  title: string;
  value: number;
  description: string;
  accent?: "blue" | "green" | "red";
}) {
  const color = {
    blue: "bg-blue-500/10 text-blue-400",
    green: "bg-emerald-500/10 text-emerald-400",
    red: "bg-red-500/10 text-red-400",
  }[accent];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <strong className="mt-2 block text-3xl font-bold text-white">
            {value}
          </strong>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>

        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${color}`}>
          KPI
        </span>
      </div>
    </div>
  );
}

function RankingCard({
  title,
  subtitle,
  data,
  labelKey,
  danger = false,
}: {
  title: string;
  subtitle: string;
  data: RankingItem[];
  labelKey: "pergunta" | "intent";
  danger?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="text-sm text-slate-400">{subtitle}</p>
      </div>

      <div className="space-y-3">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/70 p-3"
          >
            <p className="truncate text-sm font-medium text-slate-100">
              {item[labelKey] || "Não identificado"}
            </p>

            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${danger
                  ? "bg-red-500/10 text-red-400"
                  : "bg-blue-500/10 text-blue-400"
                }`}
            >
              {item.total}
            </span>
          </div>
        ))}

        {data.length === 0 && (
          <EmptyMessage>Nenhum dado encontrado.</EmptyMessage>
        )}
      </div>
    </div>
  );
}

function ChartCard({ data }: { data: UsoPorDia[] }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-white">Uso por dia</h2>
        <p className="text-sm text-slate-400">
          Evolução de perguntas, sucessos e falhas
        </p>
      </div>

      <div className="w-full min-w-0 h-75">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="data" tick={{ fill: "#94a3b8" }} />
            <YAxis tick={{ fill: "#94a3b8" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#020617",
                color: "#f8fafc",
                border: "1px solid #334155",
                borderRadius: "12px",
              }}
              labelStyle={{ color: "#f8fafc" }}
            />
            <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Total" />
            <Line type="monotone" dataKey="sucesso" stroke="#22c55e" name="Sucesso" />
            <Line type="monotone" dataKey="falhas" stroke="#ef4444" name="Falhas" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function LogSection({
  title,
  logs,
  danger = false,
  showAprender = false,
  onAprender,
}: {
  title: string;
  logs: Log[];
  danger?: boolean;
  showAprender?: boolean;
  onAprender?: (log: Log) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
      <div className="mb-4">
        <h2 className={`text-lg font-semibold ${danger ? "text-red-400" : "text-white"}`}>
          {title}
        </h2>
        <p className="text-sm text-slate-400">
          Últimos registros salvos no banco
        </p>
      </div>

      <LogTable logs={logs} showAprender={showAprender} onAprender={onAprender} />
    </div>
  );
}

function LogTable({
  logs,
  showAprender = false,
  onAprender,
}: {
  logs: Log[];
  showAprender?: boolean;
  onAprender?: (log: Log) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800">
      <div className="max-h-[420px] overflow-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="sticky top-0 bg-slate-800 text-slate-300">
            <tr>
              <th className="p-3 text-left font-semibold">Pergunta</th>
              <th className="p-3 text-left font-semibold">Resposta</th>
              <th className="p-3 text-center font-semibold">Status</th>
              {showAprender && (
                <th className="p-3 text-center font-semibold">Ação</th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800 bg-slate-950/60">
            {logs.map((log) => (
              <tr key={log.id} className="transition hover:bg-slate-800/60">
                <td className="max-w-[260px] p-3 text-slate-100">
                  {log.pergunta}
                </td>

                <td className="max-w-[360px] p-3 text-slate-400">
                  {log.resposta}
                </td>

                <td className="p-3 text-center">
                  {log.sucesso ? (
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                      Sucesso
                    </span>
                  ) : (
                    <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400">
                      Falha
                    </span>
                  )}
                </td>

                {showAprender && (
                  <td className="p-3 text-center">
                    <button
                      onClick={() => onAprender?.(log)}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500"
                    >
                      Ensinar
                    </button>
                  </td>
                )}
              </tr>
            ))}

            {logs.length === 0 && (
              <tr>
                <td
                  colSpan={showAprender ? 4 : 3}
                  className="p-6 text-center text-slate-500"
                >
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AprendizadoModal({
  perguntaSelecionada,
  perguntaChave,
  respostaAprendida,
  salvandoAprendizado,
  setPerguntaChave,
  setRespostaAprendida,
  onClose,
  onSave,
}: {
  perguntaSelecionada: Log;
  perguntaChave: string;
  respostaAprendida: string;
  salvandoAprendizado: boolean;
  setPerguntaChave: (value: string) => void;
  setRespostaAprendida: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-100 shadow-2xl">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-white">Ensinar o bot</h2>
          <p className="mt-1 text-sm text-slate-400">
            Cadastre uma resposta manual para esta pergunta sem resposta.
          </p>
        </div>

        <div className="space-y-4">
          <FieldLabel label="Pergunta original">
            <div className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-200">
              {perguntaSelecionada.pergunta}
            </div>
          </FieldLabel>

          <FieldLabel label="Pergunta chave">
            <input
              value={perguntaChave}
              onChange={(e) => setPerguntaChave(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white outline-none focus:border-blue-500"
              placeholder="Ex: loja que mais vendeu"
            />
          </FieldLabel>

          <FieldLabel label="Resposta ensinada">
            <textarea
              value={respostaAprendida}
              onChange={(e) => setRespostaAprendida(e.target.value)}
              rows={5}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white outline-none focus:border-blue-500"
              placeholder="Digite a resposta que o bot deve retornar..."
            />
          </FieldLabel>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
          >
            Cancelar
          </button>

          <button
            onClick={onSave}
            disabled={salvandoAprendizado}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
          >
            {salvandoAprendizado ? "Salvando..." : "Salvar aprendizado"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-300">
        {label}
      </label>
      {children}
    </div>
  );
}

function EmptyMessage({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center text-sm text-slate-500">
      {children}
    </p>
  );
}
