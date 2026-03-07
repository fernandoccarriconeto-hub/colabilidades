import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Plus, Save, X, User as UserIcon, Trash2, ArrowLeft } from 'lucide-react';
import { useApp } from '../context';

interface Task {
  id: number;
  title: string;
  description: string;
  responsible_id: number | null;
  responsible_name?: string;
  responsible_avatar?: string;
  status: string;
  position_x: number;
  position_y: number;
  color: string;
}

interface Project {
  id: number;
  title: string;
  description: string;
  objective: string;
  group_id: number;
}

interface Member {
  id: number;
  name: string;
  avatar?: string;
  role: string;
}

export default function ProjectCanvas({ projectId, onBack }: { projectId: number, onBack: () => void }) {
  const { user } = useApp();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // New task state
  const [newTaskPos, setNewTaskPos] = useState({ x: 100, y: 100 });

  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      const data = await res.json();
      setProject(data);
      setTasks(data.tasks);
      setMembers(data.members);
    } catch (error) {
      console.error("Failed to fetch project", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (id: number, info: any) => {
    // We need to calculate the new position relative to the canvas
    // However, framer-motion drag constraints might be tricky with absolute positioning updates
    // A simpler way is to just use the offset from the drag event if we were tracking it, 
    // but framer-motion handles the visual drag.
    // To persist, we need the final x/y. 
    // For this prototype, let's assume the visual position is enough for the session, 
    // but to save, we should ideally track it.
    // Actually, info.point is global. info.offset is relative to start.
    
    // Let's try to update the local state first to reflect the new "base" position
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newX = task.position_x + info.offset.x;
    const newY = task.position_y + info.offset.y;

    // Update locally
    setTasks(tasks.map(t => t.id === id ? { ...t, position_x: newX, position_y: newY } : t));

    // Save to DB
    await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ position_x: newX, position_y: newY })
    });
  };

  const handleAddTask = async () => {
    const newTask = {
      title: 'Nova Tarefa',
      description: 'Descrição da tarefa...',
      project_id: projectId,
      position_x: 100 + Math.random() * 50,
      position_y: 100 + Math.random() * 50,
      color: '#ffffff',
      status: 'pending'
    };

    const res = await fetch(`/api/projects/${projectId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask)
    });
    const data = await res.json();
    
    setTasks([...tasks, { ...newTask, id: data.id, responsible_id: null }]);
  };

  const handleUpdateTask = async (task: Task) => {
    setTasks(tasks.map(t => t.id === task.id ? task : t));
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    });
    setIsEditing(false);
    setSelectedTask(null);
  };

  const handleDeleteTask = async (id: number) => {
    setTasks(tasks.filter(t => t.id !== id));
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    setIsEditing(false);
    setSelectedTask(null);
  };

  if (loading) return <div className="p-8 text-center">Carregando Canvas...</div>;

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-neutral-100 overflow-hidden relative">
      {/* Toolbar */}
      <div className="bg-white border-b border-neutral-200 p-4 flex justify-between items-center z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-neutral-100 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="font-bold text-lg">{project?.title}</h2>
            <p className="text-xs text-neutral-500">Canvas de Implementação</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleAddTask}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-sm"
          >
            <Plus size={18} />
            Adicionar Tarefa
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div 
        ref={canvasRef}
        className="flex-grow relative overflow-auto bg-neutral-100 p-8"
        style={{ 
          backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', 
          backgroundSize: '20px 20px' 
        }}
      >
        {tasks.map(task => (
          <motion.div
            key={task.id}
            drag
            dragMomentum={false}
            onDragEnd={(e, info) => handleDragEnd(task.id, info)}
            initial={{ x: task.position_x, y: task.position_y }}
            className="absolute w-64 bg-white rounded-lg shadow-md border border-neutral-200 cursor-move group"
            style={{ backgroundColor: task.color }}
            onDoubleClick={() => {
              setSelectedTask(task);
              setIsEditing(true);
            }}
          >
            <div className={`h-2 rounded-t-lg w-full ${
              task.status === 'done' ? 'bg-green-500' : 
              task.status === 'in_progress' ? 'bg-blue-500' : 'bg-neutral-300'
            }`}></div>
            <div className="p-4">
              <h4 className="font-bold text-neutral-800 mb-2">{task.title}</h4>
              <p className="text-sm text-neutral-600 line-clamp-3">{task.description}</p>
              
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {task.responsible_avatar ? (
                    <img src={task.responsible_avatar} className="w-6 h-6 rounded-full" title={task.responsible_name} />
                  ) : task.responsible_id ? (
                    <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-xs text-indigo-600 font-bold" title={task.responsible_name}>
                      {task.responsible_name?.charAt(0)}
                    </div>
                  ) : (
                    <div className="w-6 h-6 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-400">
                      <UserIcon size={12} />
                    </div>
                  )}
                  <span className="text-xs text-neutral-500 truncate max-w-[80px]">
                    {task.responsible_name || 'Sem dono'}
                  </span>
                </div>
                <div className={`w-2 h-2 rounded-full ${
                   task.status === 'done' ? 'bg-green-500' : 
                   task.status === 'in_progress' ? 'bg-blue-500' : 'bg-neutral-300'
                }`}></div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Edit Modal */}
      {isEditing && selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Editar Tarefa</h3>
              <button onClick={() => setIsEditing(false)} className="text-neutral-400 hover:text-neutral-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Título</label>
                <input 
                  value={selectedTask.title}
                  onChange={e => setSelectedTask({...selectedTask, title: e.target.value})}
                  className="w-full p-2 border border-neutral-200 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Descrição</label>
                <textarea 
                  value={selectedTask.description}
                  onChange={e => setSelectedTask({...selectedTask, description: e.target.value})}
                  className="w-full p-2 border border-neutral-200 rounded-lg h-24"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Responsável</label>
                  <select 
                    value={selectedTask.responsible_id || ''}
                    onChange={e => {
                        const userId = Number(e.target.value);
                        const user = members.find(m => m.id === userId);
                        setSelectedTask({
                            ...selectedTask, 
                            responsible_id: userId || null,
                            responsible_name: user?.name
                        });
                    }}
                    className="w-full p-2 border border-neutral-200 rounded-lg"
                  >
                    <option value="">Selecione...</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
                  <select 
                    value={selectedTask.status}
                    onChange={e => setSelectedTask({...selectedTask, status: e.target.value})}
                    className="w-full p-2 border border-neutral-200 rounded-lg"
                  >
                    <option value="pending">Pendente</option>
                    <option value="in_progress">Em Progresso</option>
                    <option value="done">Concluído</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Cor do Cartão</label>
                <div className="flex gap-2">
                  {['#ffffff', '#fef3c7', '#dbeafe', '#dcfce7', '#fce7f3'].map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedTask({...selectedTask, color})}
                      className={`w-8 h-8 rounded-full border ${selectedTask.color === color ? 'ring-2 ring-indigo-500' : 'border-neutral-200'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button 
                  onClick={() => handleDeleteTask(selectedTask.id)}
                  className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Trash2 size={18} />
                  Excluir
                </button>
                <button 
                  onClick={() => handleUpdateTask(selectedTask)}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                >
                  <Save size={18} />
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
