import React, { useState, useEffect } from 'react';
import { useApp } from '../context';
import { Idea, Improvement } from '../types';
import { motion } from 'motion/react';
import { MessageSquare, Star, Zap, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

type VoteDraft = {
  impact: number;
  viability: number;
  innovation: number;
};

const initialVoteDraft: VoteDraft = {
  impact: 0,
  viability: 0,
  innovation: 0,
};

async function readApiError(res: Response, fallback: string) {
  try {
    const data = await res.json();
    return data?.error || fallback;
  } catch {
    return fallback;
  }
}

export default function IdeaBoard() {
  const { user } = useApp();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [showNewIdea, setShowNewIdea] = useState(false);
  const [newIdea, setNewIdea] = useState({ title: '', description: '', area: '' });
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [improvements, setImprovements] = useState<Improvement[]>([]);
  const [newImprovement, setNewImprovement] = useState('');
  const [voteDraft, setVoteDraft] = useState<VoteDraft>(initialVoteDraft);
  const [loadingIdeas, setLoadingIdeas] = useState(false);
  const [savingIdea, setSavingIdea] = useState(false);
  const [savingVote, setSavingVote] = useState(false);
  const [savingImprovement, setSavingImprovement] = useState(false);
  const [promotingIdea, setPromotingIdea] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchIdeas = async (): Promise<Idea[]> => {
    setLoadingIdeas(true);
    try {
      const res = await fetch('/api/ideas');
      if (!res.ok) {
        throw new Error(await readApiError(res, 'Falha ao carregar ideias.'));
      }
      const data = await res.json();
      setIdeas(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar ideias.');
      return [];
    } finally {
      setLoadingIdeas(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, []);

  const loadImprovements = async (ideaId: number) => {
    try {
      const res = await fetch(`/api/ideas/${ideaId}/improvements`);
      if (!res.ok) {
        throw new Error(await readApiError(res, 'Falha ao carregar melhorias.'));
      }
      const data = await res.json();
      setImprovements(data);
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar melhorias.');
      setImprovements([]);
    }
  };

  const openIdeaDetails = async (idea: Idea) => {
    setSelectedIdea(idea);
    setNewImprovement('');
    setVoteDraft(initialVoteDraft);
    setSuccess('');
    await loadImprovements(idea.id);
  };

  const handleCreateIdea = async () => {
    if (!user?.id) {
      setError('Você precisa estar autenticado para publicar uma ideia.');
      return;
    }

    const title = newIdea.title.trim();
    const description = newIdea.description.trim();
    const area = newIdea.area.trim();

    if (!title || !description || !area) {
      setError('Preencha título, descrição e área da ideia.');
      return;
    }

    setSavingIdea(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, area, author_id: user.id })
      });
      if (!res.ok) {
        throw new Error(await readApiError(res, 'Não foi possível criar a ideia.'));
      }

      setShowNewIdea(false);
      setNewIdea({ title: '', description: '', area: '' });
      setSuccess('Ideia publicada com sucesso.');
      await fetchIdeas();
    } catch (err: any) {
      setError(err.message || 'Não foi possível criar a ideia.');
    } finally {
      setSavingIdea(false);
    }
  };

  const handleSubmitVote = async () => {
    if (!selectedIdea || !user?.id) {
      setError('Selecione uma ideia e faça login para votar.');
      return;
    }

    if (!voteDraft.impact || !voteDraft.viability || !voteDraft.innovation) {
      setError('Defina as 3 notas antes de enviar o voto.');
      return;
    }

    setSavingVote(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/ideas/${selectedIdea.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          impact: voteDraft.impact,
          viability: voteDraft.viability,
          innovation: voteDraft.innovation
        })
      });
      if (!res.ok) {
        throw new Error(await readApiError(res, 'Falha ao registrar voto.'));
      }

      setSuccess('Voto registrado com sucesso.');
      const updatedIdeas = await fetchIdeas();
      const updatedIdea = updatedIdeas.find((idea) => idea.id === selectedIdea.id);
      if (updatedIdea) {
        setSelectedIdea(updatedIdea);
      }
    } catch (err: any) {
      setError(err.message || 'Falha ao registrar voto.');
    } finally {
      setSavingVote(false);
    }
  };

  const handleAddImprovement = async () => {
    if (!selectedIdea || !user?.id) {
      return;
    }
    const description = newImprovement.trim();
    if (!description) {
      setError('Digite uma melhoria antes de enviar.');
      return;
    }

    setSavingImprovement(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/ideas/${selectedIdea.id}/improvements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author_id: user.id, description })
      });
      if (!res.ok) {
        throw new Error(await readApiError(res, 'Falha ao adicionar melhoria.'));
      }

      setNewImprovement('');
      setSuccess('Melhoria adicionada com sucesso.');
      await loadImprovements(selectedIdea.id);
    } catch (err: any) {
      setError(err.message || 'Falha ao adicionar melhoria.');
    } finally {
      setSavingImprovement(false);
    }
  };

  const handlePromoteIdea = async () => {
    if (!selectedIdea) {
      return;
    }
    setPromotingIdea(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/ideas/${selectedIdea.id}/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objective: selectedIdea.description })
      });
      if (!res.ok) {
        throw new Error(await readApiError(res, 'Não foi possível promover a ideia.'));
      }

      setSuccess('Ideia promovida para projeto com sucesso.');
      const updatedIdeas = await fetchIdeas();
      const updatedIdea = updatedIdeas.find((idea) => idea.id === selectedIdea.id);
      if (updatedIdea) {
        setSelectedIdea(updatedIdea);
      }
    } catch (err: any) {
      setError(err.message || 'Não foi possível promover a ideia.');
    } finally {
      setPromotingIdea(false);
    }
  };

  const setScore = (criteria: keyof VoteDraft, value: number) => {
    setVoteDraft((prev) => ({ ...prev, [criteria]: value }));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-neutral-900">Mural de Ideias</h2>
        <button
          onClick={() => {
            setError('');
            setSuccess('');
            setShowNewIdea(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-indigo-700"
        >
          + Nova Ideia
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 text-red-700 bg-red-50 border border-red-100 p-3 rounded-xl">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 flex items-center gap-2 text-green-700 bg-green-50 border border-green-100 p-3 rounded-xl">
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {showNewIdea && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
          <h3 className="font-semibold mb-4">Registrar Ideia</h3>
          <div className="space-y-4">
            <input
              placeholder="Título da Ideia"
              className="w-full p-3 border rounded-xl"
              value={newIdea.title}
              onChange={e => setNewIdea({ ...newIdea, title: e.target.value })}
            />
            <textarea
              placeholder="Descrição: Qual problema resolve? Como funciona?"
              className="w-full p-3 border rounded-xl h-24"
              value={newIdea.description}
              onChange={e => setNewIdea({ ...newIdea, description: e.target.value })}
            />
            <input
              placeholder="Área (Ex: Tecnologia, Social, Saúde)"
              className="w-full p-3 border rounded-xl"
              value={newIdea.area}
              onChange={e => setNewIdea({ ...newIdea, area: e.target.value })}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNewIdea(false)}
                className="px-4 py-2 text-neutral-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateIdea}
                disabled={savingIdea}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl disabled:opacity-60 flex items-center gap-2"
              >
                {savingIdea && <Loader2 size={16} className="animate-spin" />}
                Publicar
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {loadingIdeas ? (
        <div className="flex items-center justify-center text-neutral-500 py-16 gap-2">
          <Loader2 size={18} className="animate-spin" />
          <span>Carregando ideias...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ideas.map(idea => (
            <motion.div
              key={idea.id}
              layoutId={`idea-${idea.id}`}
              className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full uppercase tracking-wide">
                  {idea.area}
                </span>
                {idea.status === 'project' && (
                  <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
                    <Zap size={12} /> Projeto Ativo
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">{idea.title}</h3>
              <p className="text-neutral-600 text-sm mb-4 flex-grow">{idea.description}</p>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100">
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <Star size={16} className="text-yellow-400 fill-yellow-400" />
                  <span className="font-medium text-neutral-900">{idea.score ? idea.score.toFixed(1) : 'N/A'}</span>
                </div>
                <button
                  onClick={() => openIdeaDetails(idea)}
                  className="text-indigo-600 text-sm font-medium hover:underline"
                >
                  Detalhes & Votar
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {selectedIdea && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8"
          >
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold">{selectedIdea.title}</h2>
              <button onClick={() => setSelectedIdea(null)} className="text-neutral-400 hover:text-neutral-600">✕</button>
            </div>

            <div className="mb-8">
              <h3 className="font-semibold text-neutral-900 mb-2">Descrição</h3>
              <p className="text-neutral-600">{selectedIdea.description}</p>
            </div>

            <div className="mb-8">
              <h3 className="font-semibold text-neutral-900 mb-4">Votar na Ideia</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4">
                {[
                  { label: 'Impacto', key: 'impact' as const },
                  { label: 'Viabilidade', key: 'viability' as const },
                  { label: 'Inovação', key: 'innovation' as const }
                ].map((criteria) => (
                  <div key={criteria.key} className="text-center">
                    <p className="text-sm font-medium mb-2">{criteria.label}</p>
                    <div className="flex justify-center gap-1">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          onClick={() => setScore(criteria.key, value)}
                          className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                            voteDraft[criteria.key] === value
                              ? 'bg-indigo-600 text-white'
                              : 'bg-neutral-100 hover:bg-indigo-100 hover:text-indigo-600'
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={handleSubmitVote}
                disabled={savingVote}
                className="mt-4 w-full bg-indigo-600 text-white p-3 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {savingVote && <Loader2 size={16} className="animate-spin" />}
                Enviar Voto
              </button>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <MessageSquare size={18} />
                Evolução Colaborativa
              </h3>
              <div className="space-y-4 mb-4">
                {improvements.length === 0 && (
                  <div className="bg-neutral-50 p-3 rounded-xl text-sm text-neutral-500">
                    Ainda não há melhorias para esta ideia.
                  </div>
                )}
                {improvements.map((imp) => (
                  <div key={imp.id} className="bg-neutral-50 p-3 rounded-xl text-sm">
                    <p className="font-medium text-neutral-900 mb-1">{imp.author_name}</p>
                    <p className="text-neutral-600">{imp.description}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newImprovement}
                  onChange={e => setNewImprovement(e.target.value)}
                  placeholder="Sugira uma melhoria..."
                  className="flex-1 p-2 border rounded-xl text-sm"
                />
                <button
                  onClick={handleAddImprovement}
                  disabled={savingImprovement}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-60 flex items-center gap-2"
                >
                  {savingImprovement && <Loader2 size={14} className="animate-spin" />}
                  Enviar
                </button>
              </div>
            </div>

            {selectedIdea.status !== 'project' && selectedIdea.score && selectedIdea.score >= 4 && (
              <div className="mt-8 pt-6 border-t border-neutral-100">
                <div className="bg-green-50 p-4 rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-green-900">Potencial de Projeto Detectado!</h4>
                    <p className="text-sm text-green-700">Esta ideia tem alta pontuação. Vamos transformá-la em realidade?</p>
                  </div>
                  <button
                    onClick={handlePromoteIdea}
                    disabled={promotingIdea}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-60 flex items-center gap-2"
                  >
                    {promotingIdea && <Loader2 size={14} className="animate-spin" />}
                    Promover a Projeto
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
