import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Users, Rocket, ArrowRight } from 'lucide-react';

export default function Landing({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="min-h-screen bg-neutral-900 text-white relative selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {/* Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/30 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 container mx-auto px-6 min-h-screen flex flex-col justify-center items-center text-center py-12 md:py-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md mb-8 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
            <Sparkles size={16} className="text-indigo-300" />
            <span className="text-sm font-medium tracking-wide text-indigo-100">Laboratório de Inteligência Coletiva</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-8xl font-bold tracking-tight mb-6 md:mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white via-indigo-100 to-indigo-200/50 drop-shadow-sm"
        >
          Colabilidades
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg md:text-2xl text-neutral-300 max-w-3xl mb-10 md:mb-12 leading-relaxed font-light"
        >
          Onde grandes mentes se encontram para transformar ideias em impacto real. <br className="hidden md:block" />
          <span className="text-white font-medium">Conecte-se</span>, <span className="text-white font-medium">colabore</span> e <span className="text-white font-medium">construa o futuro</span>.
        </motion.p>

        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
          onClick={onEnter}
          className="group relative px-8 py-4 bg-white text-neutral-900 rounded-full font-bold text-lg shadow-xl shadow-white/10 hover:shadow-white/20 transition-all flex items-center gap-3 cursor-pointer"
        >
          Entrar no Laboratório
          <ArrowRight className="group-hover:translate-x-1 transition-transform" />
        </motion.button>

        {/* Features Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mt-16 md:mt-20 max-w-4xl w-full text-left"
        >
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400 mb-4">
              <Users size={20} />
            </div>
            <h3 className="font-semibold text-lg mb-2">Conexão Humana</h3>
            <p className="text-sm text-neutral-400">Encontre parceiros com as habilidades exatas que seu projeto precisa.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center text-violet-400 mb-4">
              <Sparkles size={20} />
            </div>
            <h3 className="font-semibold text-lg mb-2">Ideação Coletiva</h3>
            <p className="text-sm text-neutral-400">Evolua suas ideias com feedback e contribuições de toda a comunidade.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400 mb-4">
              <Rocket size={20} />
            </div>
            <h3 className="font-semibold text-lg mb-2">Inovação Real</h3>
            <p className="text-sm text-neutral-400">Transforme conceitos abstratos em projetos estruturados e viáveis.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
