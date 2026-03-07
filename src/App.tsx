import React, { useState } from 'react';
import { AppProvider, useApp } from './context';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import GroupWizard from './components/GroupWizard';
import IdeaBoard from './components/IdeaBoard';
import Landing from './components/Landing';
import EditProfile from './components/EditProfile';
import { LogOut, Home, Lightbulb, Menu, X, Settings } from 'lucide-react';

function Main() {
  const { user, logout } = useApp();
  const [currentView, setCurrentView] = useState('dashboard');
  const [showLanding, setShowLanding] = useState(true);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (showLanding) {
    return <Landing onEnter={() => setShowLanding(false)} />;
  }

  if (!user) {
    return <Register onBack={() => setShowLanding(true)} />;
  }

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 flex flex-col">
      {/* Desktop Navigation */}
      <nav className="bg-white border-b border-neutral-200 sticky top-0 z-40 hidden md:block">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => setCurrentView('dashboard')}
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">C</div>
            <span className="font-bold text-xl tracking-tight">Colabilidades</span>
          </div>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setCurrentView('dashboard')}
              className={`text-sm font-medium flex items-center gap-2 ${currentView === 'dashboard' ? 'text-indigo-600' : 'text-neutral-500 hover:text-neutral-900'}`}
            >
              <Home size={18} />
              Início
            </button>
            <button 
              onClick={() => setCurrentView('ideas')}
              className={`text-sm font-medium flex items-center gap-2 ${currentView === 'ideas' ? 'text-indigo-600' : 'text-neutral-500 hover:text-neutral-900'}`}
            >
              <Lightbulb size={18} />
              Mural de Ideias
            </button>
            <div className="h-6 w-px bg-neutral-200"></div>
            <div className="flex items-center gap-3">
              <div 
                className="text-right cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setShowEditProfile(true)}
              >
                <p className="text-sm font-medium text-neutral-900">{user.name}</p>
                <p className="text-xs text-neutral-500">{user.email}</p>
              </div>
              <div 
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setShowEditProfile(true)}
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-neutral-200" />
                ) : (
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                    {user.name.charAt(0)}
                  </div>
                )}
              </div>
              <button 
                onClick={logout}
                className="p-2 hover:bg-neutral-100 rounded-full text-neutral-500 transition-colors"
                title="Sair"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Header */}
      <nav className="bg-white border-b border-neutral-200 sticky top-0 z-40 md:hidden flex justify-between items-center px-4 py-3">
        <div 
          className="flex items-center gap-2" 
          onClick={() => setCurrentView('dashboard')}
        >
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">C</div>
          <span className="font-bold text-lg tracking-tight">Colabilidades</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-neutral-600">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-[60px] bg-white z-30 md:hidden flex flex-col p-4 space-y-4 border-t border-neutral-100">
           <div 
             className="flex items-center gap-3 p-4 bg-neutral-50 rounded-xl mb-2 cursor-pointer active:bg-neutral-100 transition-colors"
             onClick={() => {
               setShowEditProfile(true);
               setMobileMenuOpen(false);
             }}
           >
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover border border-neutral-200" />
              ) : (
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg">
                  {user.name.charAt(0)}
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium text-neutral-900">{user.name}</p>
                <p className="text-xs text-neutral-500">{user.email}</p>
              </div>
           </div>
           
           <button 
              onClick={() => { setCurrentView('dashboard'); setMobileMenuOpen(false); }}
              className={`p-4 rounded-xl flex items-center gap-3 font-medium ${currentView === 'dashboard' ? 'bg-indigo-50 text-indigo-600' : 'text-neutral-600 hover:bg-neutral-50'}`}
            >
              <Home size={20} />
              Início
            </button>
            <button 
              onClick={() => { setCurrentView('ideas'); setMobileMenuOpen(false); }}
              className={`p-4 rounded-xl flex items-center gap-3 font-medium ${currentView === 'ideas' ? 'bg-indigo-50 text-indigo-600' : 'text-neutral-600 hover:bg-neutral-50'}`}
            >
              <Lightbulb size={20} />
              Mural de Ideias
            </button>
            
            <div className="flex-grow"></div>
            
            <button 
              onClick={logout}
              className="p-4 rounded-xl flex items-center gap-3 font-medium text-red-600 hover:bg-red-50"
            >
              <LogOut size={20} />
              Sair
            </button>
        </div>
      )}

      <main className="flex-grow py-6 md:py-8 px-4 md:px-0">
        {currentView === 'dashboard' && <Dashboard onViewChange={setCurrentView} />}
        {currentView === 'group-wizard' && <GroupWizard onComplete={() => setCurrentView('dashboard')} />}
        {currentView === 'ideas' && <IdeaBoard />}
      </main>

      {showEditProfile && (
        <EditProfile onClose={() => setShowEditProfile(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Main />
    </AppProvider>
  );
}
