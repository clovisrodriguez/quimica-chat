import { useState, useCallback } from 'react';
import { useAuth } from './contexts/AuthContext';
import Chat from './components/Chat';
import ClassMode from './components/ClassMode';
import MoleculeBuilder from './components/MoleculeBuilder';
import Login from './components/Login';

function AppContent() {
  const { user, authEnabled, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('simulator');
  const [chatInput, setChatInput] = useState(null);
  const [moleculeData, setMoleculeData] = useState(null);
  const [bohrElement, setBohrElement] = useState(null);
  const [periodicTableData, setPeriodicTableData] = useState(null);
  const [mode, setMode] = useState('chat');
  const [constructorOpen, setConstructorOpen] = useState(false);

  const handleExplainWithAI = useCallback((text) => {
    setChatInput(text);
    setMode('chat');
    setActiveTab('chat');
  }, []);

  const handleDrawMolecule = useCallback((data) => {
    setMoleculeData(data);
    setBohrElement(null);
    setConstructorOpen(true);
    setActiveTab('simulator');
  }, []);

  const handleShowBohrModel = useCallback((element) => {
    setBohrElement(element);
    setMoleculeData(null);
    setPeriodicTableData(null);
    setConstructorOpen(true);
    setActiveTab('simulator');
  }, []);

  const handleShowPeriodicTable = useCallback((data) => {
    setPeriodicTableData(data);
    setMoleculeData(null);
    setBohrElement(null);
    setConstructorOpen(true);
    setActiveTab('simulator');
  }, []);

  const handlePeriodicTableViewed = useCallback(() => {
    setPeriodicTableData(null);
  }, []);

  const handleMoleculeLoaded = useCallback(() => {
    setMoleculeData(null);
  }, []);

  const handleBohrViewed = useCallback(() => {
    setBohrElement(null);
  }, []);

  const handleClearConstructor = useCallback(() => {
    setMoleculeData({ atoms: [], bonds: [] });
    setBohrElement(null);
    setConstructorOpen(false);
  }, []);

  const handleCollapseConstructor = useCallback(() => {
    setConstructorOpen(false);
  }, []);

  const rightTabLabel = mode === 'class' ? 'Modo Clase' : 'Chat IA';
  const isClassMode = mode === 'class';
  const showConstructor = isClassMode ? constructorOpen : true;

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3 shrink-0">
        <span className="text-2xl">⚗️</span>
        <h1 className="text-lg font-bold text-white">Quimica Chat</h1>
        <span className="text-sm text-gray-400 hidden sm:inline">
          Tutor de Quimica Organica + Constructor
        </span>
        <div className="ml-auto flex items-center gap-2">
          {authEnabled && user && (
            <div className="hidden sm:flex items-center gap-2 mr-2">
              <span className="text-xs text-gray-400">{user.email}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${user.tier === 'paid' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-gray-800 text-gray-400'}`}>
                {user.tier === 'paid' ? 'Pro' : 'Free'}
              </span>
              <button
                onClick={logout}
                className="text-xs text-gray-500 hover:text-white transition-colors"
              >
                Salir
              </button>
            </div>
          )}
          <div className="flex bg-gray-800 rounded-lg p-0.5">
            <button
              onClick={() => setMode('chat')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                mode === 'chat'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Chat IA
            </button>
            <button
              onClick={() => setMode('class')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                mode === 'class'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Modo Clase
            </button>
          </div>
        </div>
      </header>

      {(!isClassMode || constructorOpen) && (
        <div className="sm:hidden flex border-b border-gray-800 bg-gray-900">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'simulator'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-gray-400'
            }`}
          >
            Constructor
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'chat'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400'
            }`}
          >
            {rightTabLabel}
          </button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {showConstructor && (
          <div
            className={`w-full ${isClassMode ? 'sm:w-1/2' : 'sm:w-[42%]'} sm:border-r sm:border-gray-800 ${
              activeTab === 'simulator' ? 'flex' : 'hidden sm:flex'
            } flex-col relative`}
          >
            {isClassMode && (
              <button
                onClick={handleCollapseConstructor}
                className="absolute top-2 right-2 z-20 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-xs px-2 py-1 rounded-lg transition-colors"
              >
                ✕ Cerrar
              </button>
            )}
            <MoleculeBuilder
              onExplainWithAI={handleExplainWithAI}
              moleculeData={moleculeData}
              onMoleculeLoaded={handleMoleculeLoaded}
              bohrElement={bohrElement}
              onBohrViewed={handleBohrViewed}
              periodicTableData={periodicTableData}
              onPeriodicTableViewed={handlePeriodicTableViewed}
            />
          </div>
        )}

        <div
          className={`w-full ${showConstructor ? (isClassMode ? 'sm:w-1/2' : 'sm:w-[58%]') : 'sm:w-full'} ${
            activeTab === 'chat' || (!showConstructor) ? 'flex' : 'hidden sm:flex'
          } flex-col`}
        >
          {mode === 'chat' ? (
            <Chat
              injectedInput={chatInput}
              onInputConsumed={() => setChatInput(null)}
              onDrawMolecule={handleDrawMolecule}
              onShowBohrModel={handleShowBohrModel}
              onShowPeriodicTable={handleShowPeriodicTable}
            />
          ) : (
            <ClassMode
              onDrawMolecule={handleDrawMolecule}
              onShowBohrModel={handleShowBohrModel}
              onShowPeriodicTable={handleShowPeriodicTable}
              onClearConstructor={handleClearConstructor}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { loading, authEnabled, user } = useAuth();

  if (loading) {
    return (
      <div className="h-screen bg-gray-950 flex items-center justify-center">
        <span className="text-gray-500 text-sm">Cargando...</span>
      </div>
    );
  }

  if (authEnabled && !user) {
    return <Login />;
  }

  return <AppContent />;
}
