import React, { useState, useRef } from 'react';
import { SKILL_CATEGORIES } from '../constants';
import { useApp } from '../context';
import { motion } from 'motion/react';
import { Camera, Upload, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function Register({ onBack }: { onBack?: () => void }) {
  const { setUser } = useApp();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatar: '',
    academic_bg: '',
    professional_history: '',
    skills: [] as { name: string; category: string }[]
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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

  const handleNextStep = () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      setError("Por favor, preencha seu nome e email para continuar.");
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      setError("Nome e email são obrigatórios.");
      setStep(1);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        const data = await res.json();
        // Simulate "Welcome Email"
        alert(`Bem-vindo ao Colabilidades, ${formData.name}! Um email de boas-vindas foi enviado para ${formData.email}.`);
        
        // Auto login
        const userRes = await fetch(`/api/users/${formData.email}`);
        const userData = await userRes.json();
        setUser(userData);
        localStorage.setItem('colabilidades_user', JSON.stringify(userData));
      } else if (res.status === 409) {
        // User already exists, try to login
        try {
          const userRes = await fetch(`/api/users/${formData.email}`);
          if (userRes.ok) {
            const userData = await userRes.json();
            setUser(userData);
            localStorage.setItem('colabilidades_user', JSON.stringify(userData));
            alert(`Bem-vindo de volta, ${userData.name}!`);
          } else {
            setError('Este email já está cadastrado, mas não conseguimos recuperar seus dados.');
          }
        } catch (e) {
          setError('Erro ao tentar fazer login automático.');
        }
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Erro ao cadastrar. Tente novamente.');
      }
    } catch (error) {
      console.error("Registration error", error);
      setError("Erro ao conectar com o servidor. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 md:p-8 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden relative"
      >
        {onBack && step === 1 && (
          <button 
            onClick={onBack}
            className="absolute top-4 left-4 p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors z-10"
            title="Voltar para o início"
          >
            <ArrowLeft size={24} />
          </button>
        )}

        <div className="shrink-0 text-center mt-2">
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2">Colabilidades</h1>
          <p className="text-neutral-500 mb-6">Laboratório Digital de Ideias</p>
        </div>

        {step === 1 && (
          <div className="space-y-4 overflow-y-auto px-1 flex-1 min-h-0">
            <h2 className="text-xl font-semibold">Quem é você?</h2>
            
            <div className="flex justify-center mb-6">
              <div 
                className="relative w-24 h-24 rounded-full bg-neutral-100 border-2 border-dashed border-neutral-300 flex items-center justify-center cursor-pointer overflow-hidden hover:bg-neutral-50 transition-colors shrink-0"
                onClick={() => fileInputRef.current?.click()}
              >
                {formData.avatar ? (
                  <img src={formData.avatar} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-neutral-400">
                    <Camera size={24} className="mx-auto mb-1" />
                    <span className="text-[10px]">Foto</span>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            <input 
              name="name" 
              placeholder="Nome Completo" 
              className="w-full p-3 border border-neutral-200 rounded-xl"
              value={formData.name}
              onChange={handleInputChange}
            />
            <input 
              name="email" 
              placeholder="Email" 
              className="w-full p-3 border border-neutral-200 rounded-xl"
              value={formData.email}
              onChange={handleInputChange}
            />
            <input 
              name="academic_bg" 
              placeholder="Formação Acadêmica" 
              className="w-full p-3 border border-neutral-200 rounded-xl"
              value={formData.academic_bg}
              onChange={handleInputChange}
            />
            <textarea 
              name="professional_history" 
              placeholder="Breve Histórico Profissional" 
              className="w-full p-3 border border-neutral-200 rounded-xl h-24"
              value={formData.professional_history}
              onChange={handleInputChange}
            />
            <div className="pt-2">
              {error && step === 1 && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg mb-3 text-sm">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}
              <button 
                onClick={handleNextStep}
                className="w-full bg-indigo-600 text-white p-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
              >
                Próximo: Suas Habilidades
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col flex-1 min-h-0">
            <h2 className="text-xl font-semibold mb-4 shrink-0">Quais são seus superpoderes?</h2>
            <div className="flex-grow overflow-y-auto pr-2 space-y-6 min-h-0">
              {Object.entries(SKILL_CATEGORIES).map(([category, skills]) => (
                <div key={category}>
                  <h3 className="font-medium text-neutral-700 mb-2 sticky top-0 bg-white py-1 z-10">{category}</h3>
                  <div className="flex flex-wrap gap-2">
                    {skills.map(skill => (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(category, skill)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                          formData.skills.find(s => s.name === skill)
                            ? 'bg-indigo-100 border-indigo-200 text-indigo-800'
                            : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 shrink-0 pt-4 border-t border-neutral-100">
              {error && step === 2 && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg mb-3 text-sm">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}
              <div className="flex gap-3">
                <button 
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="flex-1 bg-neutral-100 text-neutral-700 p-3 rounded-xl font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50"
                >
                  Voltar
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-indigo-600 text-white p-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      <span>Cadastrando...</span>
                    </>
                  ) : (
                    'Finalizar Cadastro'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
