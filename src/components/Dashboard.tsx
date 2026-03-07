import React, { useState, useEffect } from 'react';
import { useApp } from '../context';
import { motion } from 'motion/react';
import { Plus, Users, Lightbulb, Rocket, ArrowRight, CheckCircle, Kanban } from 'lucide-react';

export default function Dashboard({ onViewChange, onOpenProject }: { onViewChange: (view: string) => void, onOpenProject: (id: number) => void }) {
  const { user, activeGroup } = useApp();
  const [stats, setStats] = useState({ ideas: 0, projects: 0 });
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/ideas')
      .then(res => res.json())
      .then(data => {
        const ideas = data.length;
        const projectsCount = data.filter((i: any) => i.status === 'project').length;
        setStats({ ideas, projects: projectsCount });
      });

    fetch('/api/projects')
      .then(res => res.json())
      .then(data => setProjects(data));
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <header className="mb-8 flex items-center gap-4">
        {user?.avatar && (
          <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md" />
        )}
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Olá, {user?.name.split(' ')[0]}!</h1>
          <p className="text-neutral-500 mt-2 text-lg">
            "Uma ideia pode começar pequena, mas quando pessoas se unem, ela pode transformar o mundo."
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100"
        >
          <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-yellow-600 mb-4">
            <Lightbulb size={24} />
          </div>
          <h3 className="text-2xl font-bold text-neutral-900">{stats.ideas}</h3>
          <p className="text-neutral-500">Ideias Cadastradas</p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100"
        >
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-4">
            <Rocket size={24} />
          </div>
          <h3 className="text-2xl font-bold text-neutral-900">{stats.projects}</h3>
          <p className="text-neutral-500">Projetos Ativos</p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-indigo-600 to-violet-600 p-6 rounded-2xl shadow-lg text-white cursor-pointer"
          onClick={() => onViewChange('group-wizard')}
        >
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white mb-4">
            <Plus size={24} />
          </div>
          <h3 className="text-xl font-bold">Novo Grupo</h3>
          <p className="text-indigo-100 text-sm mt-1">Crie um time e comece a inovar</p>
        </motion.div>
      </div>

      {/* Active Projects Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-neutral-900">Meus Projetos</h2>
        
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <motion.div
                key={project.id}
                whileHover={{ scale: 1.02 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 cursor-pointer hover:border-indigo-300 transition-colors"
                onClick={() => onOpenProject(project.id)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                    <Kanban size={20} />
                  </div>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                    Em Andamento
                  </span>
                </div>
                <h3 className="font-bold text-lg text-neutral-900 mb-2">{project.title}</h3>
                <p className="text-sm text-neutral-500 line-clamp-2 mb-4">{project.objective}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                  <span className="text-xs text-neutral-400">Grupo: {project.group_name || 'N/A'}</span>
                  <div className="flex items-center text-indigo-600 text-sm font-medium gap-1">
                    Abrir Canvas <ArrowRight size={16} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-neutral-50 border-2 border-dashed border-neutral-200 rounded-2xl p-8 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-400 mb-4">
              <Rocket size={32} />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-2">Nenhum projeto ativo</h3>
            <p className="text-neutral-500 max-w-md mb-6">
              Você ainda não tem projetos em andamento. Crie um novo grupo para iniciar um projeto e acessar o Canvas.
            </p>
            <button 
              onClick={() => onViewChange('group-wizard')}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Plus size={18} />
              Iniciar Novo Projeto
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-neutral-900">Ações Rápidas</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={() => onViewChange('ideas')}
            className="flex items-center gap-4 p-4 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors text-left"
          >
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
              <Lightbulb size={20} />
            </div>
            <div>
              <h4 className="font-semibold text-neutral-900">Explorar Ideias</h4>
              <p className="text-sm text-neutral-500">Vote e colabore com outros</p>
            </div>
            <ArrowRight size={20} className="ml-auto text-neutral-300" />
          </button>

          <button 
            onClick={() => onViewChange('group-wizard')}
            className="flex items-center gap-4 p-4 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors text-left"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <Users size={20} />
            </div>
            <div>
              <h4 className="font-semibold text-neutral-900">Formar Equipe</h4>
              <p className="text-sm text-neutral-500">Use IA para encontrar talentos</p>
            </div>
            <ArrowRight size={20} className="ml-auto text-neutral-300" />
          </button>
        </div>
      </div>
    </div>
  );
}
