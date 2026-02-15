import { useState, useCallback } from 'react';
import Chat from './components/Chat';
import ClassMode from './components/ClassMode';
import MoleculeBuilder from './components/MoleculeBuilder';

export default function App() {
  const [activeTab, setActiveTab] = useState('simulator');
  const [chatInput, setChatInput] = useState(null);
  const [moleculeData, setMoleculeData] = useState(null);
  const [bohrElement, setBohrElement] = useState(null);
  const [mode, setMode] = useState('chat');

  const handleExplainWithAI = useCallback((text) => {
    setChatInput(text);
    setMode('chat');
    setActiveTab('chat');
  }, []);

  const handleDrawMolecule = useCallback((data) => {
    setMoleculeData(data);
    setBohrElement(null);
    setActiveTab('simulator');
  }, []);

  const handleShowBohrModel = useCallback((element) => {
    setBohrElement(element);
    setMoleculeData(null);
    setActiveTab('simulator');
  }, []);

  const handleMoleculeLoaded = useCallback(() => {
    setMoleculeData(null);
  }, []);

  const handleBohrViewed = useCallback(() => {
    setBohrElement(null);
  }, []);

  const rightTabLabel = mode === 'class' ? 'Modo Clase' : 'Chat IA';

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3 shrink-0">
        <span className="text-2xl">⚗️</span>
        <h1 className="text-lg font-bold text-white">Quimica Chat</h1>
        <span className="text-sm text-gray-400 hidden sm:inline">
          Tutor de Quimica Organica + Constructor
        </span>
        <div className="ml-auto flex bg-gray-800 rounded-lg p-0.5">
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
      </header>

      {/* Mobile tabs */}
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

      {/* Desktop: side by side / Mobile: tabs */}
      <div className="flex-1 flex overflow-hidden">
        <div
          className={`w-full sm:w-[42%] sm:border-r sm:border-gray-800 ${
            activeTab === 'simulator' ? 'flex' : 'hidden sm:flex'
          } flex-col`}
        >
          <MoleculeBuilder
            onExplainWithAI={handleExplainWithAI}
            moleculeData={moleculeData}
            onMoleculeLoaded={handleMoleculeLoaded}
            bohrElement={bohrElement}
            onBohrViewed={handleBohrViewed}
          />
        </div>
        <div
          className={`w-full sm:w-[58%] ${
            activeTab === 'chat' ? 'flex' : 'hidden sm:flex'
          } flex-col`}
        >
          {mode === 'chat' ? (
            <Chat
              injectedInput={chatInput}
              onInputConsumed={() => setChatInput(null)}
              onDrawMolecule={handleDrawMolecule}
              onShowBohrModel={handleShowBohrModel}
            />
          ) : (
            <ClassMode
              onDrawMolecule={handleDrawMolecule}
              onShowBohrModel={handleShowBohrModel}
            />
          )}
        </div>
      </div>
    </div>
  );
}
