import React, { useState, useRef } from 'react';
import { useApp } from '../context';
import { Camera, Upload, X, Save, Loader2, AlertCircle } from 'lucide-react';
import { SKILL_CATEGORIES } from '../constants';

interface EditProfileProps {
  onClose: () => void;
}

export default function EditProfile({ onClose }: EditProfileProps) {
  const { user, setUser } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'skills'>('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    avatar: user?.avatar || '',
    academic_bg: user?.academic_bg || '',
    professional_history: user?.professional_history || '',
    skills: user?.skills || []
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("A imagem deve ter no máximo 5MB.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleSkill = (category: string, skill: string) => {
    const exists = formData.skills.find(s => s.name === skill);
    if (exists) {
      setFormData({ ...formData, skills: formData.skills.filter(s => s.name !== skill) });
    } else {
      setFormData({ ...formData, skills: [...formData.skills, { name: skill, category }] });
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        localStorage.setItem('colabilidades_user', JSON.stringify(updatedUser));
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao atualizar perfil.');
      }
    } catch (err) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-neutral-900">Editar Perfil</h2>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full text-neutral-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-100 shrink-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'profile' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Dados Pessoais
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'skills' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Habilidades e Competências
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg mb-6 text-sm">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'profile' ? (
            <div className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-4">
                <div 
                  className="relative group cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {formData.avatar ? (
                    <img 
                      src={formData.avatar} 
                      alt="Avatar Preview" 
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg group-hover:opacity-90 transition-opacity"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 border-4 border-white shadow-lg group-hover:bg-neutral-200 transition-colors">
                      <Camera size={32} />
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full shadow-md hover:bg-indigo-700 transition-colors">
                    <Upload size={14} />
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <p className="text-xs text-neutral-500">Clique na imagem para alterar</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Formação Acadêmica</label>
                  <textarea
                    name="academic_bg"
                    value={formData.academic_bg}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                    placeholder="Ex: Graduação em Design, Pós em UX..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Histórico Profissional</label>
                  <textarea
                    name="professional_history"
                    value={formData.professional_history}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                    placeholder="Resumo das suas experiências..."
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(SKILL_CATEGORIES).map(([category, skills]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider mb-3">{category}</h3>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => {
                      const isSelected = formData.skills.some(s => s.name === skill);
                      return (
                        <button
                          key={skill}
                          onClick={() => toggleSkill(category, skill)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                              : 'bg-white border border-neutral-200 text-neutral-600 hover:border-indigo-300 hover:bg-indigo-50'
                          }`}
                        >
                          {skill}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-100 flex justify-end gap-3 shrink-0 bg-neutral-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-neutral-600 font-medium hover:bg-neutral-200 rounded-lg transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>Salvar Alterações</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
