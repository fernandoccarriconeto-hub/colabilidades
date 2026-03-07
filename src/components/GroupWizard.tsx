import React, { useState, useEffect } from 'react';
import { useApp } from '../context';
import { motion } from 'motion/react';
import { User } from '../types';
import { Bot, Check, UserPlus, AlertCircle, Loader2 } from 'lucide-react';

async function readApiError(res: Response, fallback: string) {
  try {
    const data = await res.json();
    return data?.error || fallback;
  } catch {
    return fallback;
  }
}

export default function GroupWizard({ onComplete }: { onComplete: () => void }) {
  const { user, setActiveGroup } = useApp();
  const [step, setStep] = useState(1);
  const [projectDesc, setProjectDesc] = useState('');
  const [groupName, setGroupName] = useState('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await fetch('/api/users');
        if (!res.ok) {
          throw new Error(await readApiError(res, 'Falha ao carregar usuários.'));
        }
        const data = await res.json();
        setAvailableUsers(data.filter((u: User) => u.id !== user?.id));
      } catch (err: any) {
        setError(err.message || 'Falha ao carregar usuários.');
      }
    };
    loadUsers();
  }, [user]);

  const [roleAssignments, setRoleAssignments] = useState<any[]>([]);

  const handleAssignRoles = async () => {
    if (!projectDesc.trim()) {
      setError('Descreva o projeto antes de definir papéis.');
      return;
    }
    if (selectedUsers.length === 0) {
      setError('Selecione pelo menos um integrante.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Fetch details of selected users to send to AI
      const teamMembers = availableUsers.filter(u => selectedUsers.includes(u.id));
      
      const res = await fetch('/api/ai/assign-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_description: projectDesc, team_members: teamMembers })
      });
      if (!res.ok) {
        throw new Error(await readApiError(res, 'Falha ao definir papéis com IA.'));
      }
      const data = await res.json();
      setRoleAssignments(data.assignments || []);
      setStep(4);
    } catch (err: any) {
      setError(err.message || 'Falha ao definir papéis com IA.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeGroup = async () => {
    const normalizedGroupName = groupName.trim();
    const normalizedProjectDesc = projectDesc.trim();
    if (!normalizedGroupName || !normalizedProjectDesc) {
      setError('Nome do grupo e descrição do projeto são obrigatórios.');
      return;
    }
    if (!user?.id) {
      setError('Usuário não autenticado.');
      return;
    }

    setFinalizing(true);
    setError('');

    try {
      // 1. Create Group
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: normalizedGroupName, description: normalizedProjectDesc, admin_id: user.id })
      });
      if (!res.ok) {
        throw new Error(await readApiError(res, 'Falha ao criar grupo.'));
      }
      const groupData = await res.json();

      // 2. Add Members with Roles
      for (const userId of selectedUsers) {
        const assignment = roleAssignments.find((a: any) => a.user_id === userId);
        const role = assignment ? assignment.role : 'Member';

        const memberRes = await fetch(`/api/groups/${groupData.id}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, role: role })
        });
        if (!memberRes.ok) {
          throw new Error(await readApiError(memberRes, 'Falha ao adicionar integrante ao grupo.'));
        }
      }

      // 3. Register an initial idea for the new group
      const ideaRes = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            title: `Projeto: ${normalizedGroupName}`, 
            description: normalizedProjectDesc, 
            area: 'Inovação', 
            author_id: user.id,
            group_id: groupData.id 
        })
      });
      if (!ideaRes.ok) {
        throw new Error(await readApiError(ideaRes, 'Grupo criado, mas falha ao registrar ideia inicial.'));
      }

      setActiveGroup({ id: groupData.id, name: normalizedGroupName, description: normalizedProjectDesc, admin_id: user.id });
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Falha ao finalizar grupo.');
    } finally {
      setFinalizing(false);
    }
  };

  const getAiSuggestions = async () => {
    if (!projectDesc.trim()) {
      setError('Descreva o projeto antes de solicitar sugestões da IA.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai/suggest-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_description: projectDesc.trim(), count: 3 })
      });
      if (!res.ok) {
        throw new Error(await readApiError(res, 'Falha ao buscar sugestões da IA.'));
      }
      const data = await res.json();
      setAiSuggestions(data.candidates || []);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Falha ao buscar sugestões da IA.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-900">Novo Grupo de Inovação</h2>
        <p className="text-neutral-500">Vamos montar o time perfeito para sua ideia.</p>
      </div>
      {error && (
        <div className="mb-6 flex items-center gap-2 text-red-700 bg-red-50 border border-red-100 p-3 rounded-xl">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {step === 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Nome do Grupo</label>
            <input 
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full p-3 border border-neutral-200 rounded-xl"
              placeholder="Ex: Squad Sustentabilidade"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Sobre o Projeto</label>
            <textarea 
              value={projectDesc}
              onChange={(e) => setProjectDesc(e.target.value)}
              className="w-full p-3 border border-neutral-200 rounded-xl h-32"
              placeholder="Descreva o desafio ou ideia inicial..."
            />
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <button 
              onClick={() => setStep(2)}
              className="flex-1 bg-neutral-100 text-neutral-900 p-3 rounded-xl font-medium hover:bg-neutral-200"
            >
              Escolher Manualmente
            </button>
            <button 
              onClick={getAiSuggestions}
              disabled={!projectDesc || loading}
              className="flex-1 bg-indigo-600 text-white p-3 rounded-xl font-medium hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Bot size={20} />
              {loading ? 'Analisando...' : 'Pedir Ajuda à IA'}
            </button>
          </div>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <h3 className="text-lg font-semibold">Selecione os Integrantes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableUsers.map(u => (
              <div 
                key={u.id}
                onClick={() => {
                  if (selectedUsers.includes(u.id)) {
                    setSelectedUsers(selectedUsers.filter(id => id !== u.id));
                  } else {
                    setSelectedUsers([...selectedUsers, u.id]);
                  }
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedUsers.includes(u.id) 
                    ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' 
                    : 'border-neutral-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{u.name}</span>
                  {selectedUsers.includes(u.id) && <Check size={16} className="text-indigo-600" />}
                </div>
                <p className="text-xs text-neutral-500 mt-1 truncate">{u.academic_bg}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {u.skills.slice(0, 3).map(s => (
                    <span key={s.name} className="text-[10px] bg-white px-2 py-1 rounded-full border border-neutral-100">
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={handleAssignRoles}
            disabled={selectedUsers.length === 0 || loading}
            className="w-full bg-indigo-600 text-white p-3 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Definindo Papéis...' : 'Definir Papéis com IA'}
          </button>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex gap-3">
            <Bot className="text-indigo-600 shrink-0" />
            <div>
              <h3 className="font-semibold text-indigo-900">Sugestão da IA</h3>
              <p className="text-sm text-indigo-700">Com base no seu projeto, encontrei estes perfis ideais:</p>
            </div>
          </div>

          <div className="space-y-4">
            {aiSuggestions.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 bg-neutral-50 rounded-xl border border-neutral-200">
                <p className="text-lg font-medium">Desculpe, não achei um perfil para seu projeto.</p>
                <button 
                  onClick={() => setStep(2)}
                  className="mt-4 text-indigo-600 font-medium hover:underline"
                >
                  Tentar selecionar manualmente
                </button>
              </div>
            ) : (
              aiSuggestions.map((s, idx) => (
                <div key={idx} className="p-4 bg-white rounded-xl border border-neutral-200 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-lg">{s.name}</h4>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                      {s.suggested_role}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600 mb-3">{s.reason}</p>
                  <button 
                    onClick={() => {
                      if (!selectedUsers.includes(s.user_id)) {
                        setSelectedUsers([...selectedUsers, s.user_id]);
                      }
                    }}
                    className={`text-sm font-medium flex items-center gap-2 ${
                      selectedUsers.includes(s.user_id) ? 'text-green-600' : 'text-indigo-600 hover:underline'
                    }`}
                  >
                    {selectedUsers.includes(s.user_id) ? <Check size={16} /> : <UserPlus size={16} />}
                    {selectedUsers.includes(s.user_id) ? 'Selecionado' : 'Adicionar ao Time'}
                  </button>
                </div>
              ))
            )}
          </div>

          {aiSuggestions.length > 0 && (
            <button 
              onClick={handleAssignRoles}
              disabled={selectedUsers.length === 0 || loading}
              className="w-full bg-indigo-600 text-white p-3 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
               {loading ? 'Definindo Papéis...' : 'Definir Papéis com IA'}
            </button>
          )}
        </motion.div>
      )}

      {step === 4 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex gap-3">
             <Check className="text-green-600 shrink-0" />
             <div>
               <h3 className="font-semibold text-green-900">Time Definido!</h3>
               <p className="text-sm text-green-700">Aqui estão as funções sugeridas para cada integrante.</p>
             </div>
           </div>

           <div className="space-y-4">
             {roleAssignments.map((assignment, idx) => {
               const user = availableUsers.find(u => u.id === assignment.user_id);
               return (
                 <div key={idx} className="p-4 bg-white rounded-xl border border-neutral-200 shadow-sm">
                   <h4 className="font-bold text-lg mb-1">{user?.name}</h4>
                   <div className="mb-2">
                     <span className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Função Sugerida</span>
                     <p className="text-indigo-600 font-medium">{assignment.role}</p>
                   </div>
                   <div>
                     <span className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Responsabilidades</span>
                     <p className="text-sm text-neutral-600">{assignment.function}</p>
                   </div>
                 </div>
               );
             })}
           </div>

           <button 
             onClick={handleFinalizeGroup}
             disabled={finalizing}
             className="w-full bg-indigo-600 text-white p-3 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2"
           >
             {finalizing && <Loader2 size={16} className="animate-spin" />}
             Confirmar e Iniciar Projeto
           </button>
        </motion.div>
      )}
    </div>
  );
}
