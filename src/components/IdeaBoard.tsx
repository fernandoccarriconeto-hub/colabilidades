import React, { useState, useEffect } from 'react';
import { useApp } from '../context';
import { Idea, Improvement } from '../types';
import { motion } from 'motion/react';
import { MessageSquare, Star, Zap, Activity } from 'lucide-react';

export default function IdeaBoard() {
  const { user } = useApp();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [showNewIdea, setShowNewIdea] = useState(false);
  const [newIdea, setNewIdea] = useState({ title: '', description: '', area: '' });
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [improvements, setImprovements] = useState<Improvement[]>([]);
  const [newImprovement, setNewImprovement] = useState('');

  const fetchIdeas = () => {
    fetch('/api/ideas')
      .then(res => res.json())
      .then(setIdeas);
  };

  useEffect(() => {
    fetchIdeas();
  }, []);

  const handleCreateIdea = async () => {
    await fetch('/api/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newIdea, author_id: user?.id })
    });
    setShowNewIdea(false);
    setNewIdea({ title: '', description: '', area: '' });
    fetchIdeas();
  };

  const handleVote = async (ideaId: number, scores: { impact: number, viability: number, innovation: number }) => {
    await fetch(`/api/ideas/${ideaId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user?.id, ...scores })
    });
    fetchIdeas();
    alert('Voto registrado!');
  };

  const loadImprovements = (ideaId: number) => {
    fetch(`/api/ideas/${ideaId}/improvements`)
      .then(res => res.json())
      .then(setImprovements);
  };

  const handleAddImprovement = async () => {
    if (!selectedIdea || !newImprovement) return;
    await fetch(`/api/ideas/${selectedIdea.id}/improvements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author_id: user?.id, description: newImprovement })
    });
    setNewImprovement('');
    loadImprovements(selectedIdea.id);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-neutral-900">Mural de Ideias</h2>
        <button 
          onClick={() => setShowNewIdea(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-indigo-700"
        >
          + Nova Ideia
        </button>
      </div>

      {showNewIdea && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
          <h3 className="font-semibold mb-4">Registrar Ideia</h3>
          <div className="space-y-4">
            <input 
              placeholder="Título da Ideia" 
              className="w-full p-3 border rounded-xl"
              value={newIdea.title}
              onChange={e => setNewIdea({...newIdea, title: e.target.value})}
            />
            <textarea 
              placeholder="Descrição: Qual problema resolve? Como funciona?" 
              className="w-full p-3 border rounded-xl h-24"
              value={newIdea.description}
              onChange={e => setNewIdea({...newIdea, description: e.target.value})}
            />
            <input 
              placeholder="Área (Ex: Tecnologia, Social, Saúde)" 
              className="w-full p-3 border rounded-xl"
              value={newIdea.area}
              onChange={e => setNewIdea({...newIdea, area: e.target.value})}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowNewIdea(false)} className="px-4 py-2 text-neutral-600">Cancelar</button>
              <button onClick={handleCreateIdea} className="bg-indigo-600 text-white px-4 py-2 rounded-xl">Publicar</button>
            </div>
          </div>
        </motion.div>
      )}

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
                onClick={() => {
                  setSelectedIdea(idea);
                  loadImprovements(idea.id);
                }}
                className="text-indigo-600 text-sm font-medium hover:underline"
              >
                Detalhes & Votar
              </button>
            </div>
          </motion.div>
        ))}
      </div>

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
                {['Impacto', 'Viabilidade', 'Inovação'].map((criteria, idx) => (
                  <div key={criteria} className="text-center">
                    <p className="text-sm font-medium mb-2">{criteria}</p>
                    <div className="flex justify-center gap-1">
                      {[1, 2, 3, 4, 5].map(val => (
                        <button 
                          key={val}
                          onClick={() => handleVote(selectedIdea.id, { 
                            impact: idx === 0 ? val : 0, // Simplified for demo, ideally state managed
                            viability: idx === 1 ? val : 0,
                            innovation: idx === 2 ? val : 0
                          })}
                          className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-indigo-100 hover:text-indigo-600 text-sm font-medium transition-colors"
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <MessageSquare size={18} />
                Evolução Colaborativa
              </h3>
              <div className="space-y-4 mb-4">
                {improvements.map(imp => (
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
                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium"
                >
                  Enviar
                </button>
              </div>
            </div>

            {selectedIdea.status !== 'project' && selectedIdea.score && selectedIdea.score >= 4 && (
                <div className="mt-8 pt-6 border-t border-neutral-100">
                    <div className="bg-green-50 p-4 rounded-xl flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-green-900">Potencial de Projeto Detectado!</h4>
                            <p className="text-sm text-green-700">Esta ideia tem alta pontuação. Vamos transformá-la em realidade?</p>
                        </div>
                        <button 
                            onClick={async () => {
                                // In a real app, this would call an endpoint to update status
                                // For now, we'll just alert
                                alert("Ideia promovida a Projeto! (Simulação)");
                                setSelectedIdea(null);
                                fetchIdeas();
                            }}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700"
                        >
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
