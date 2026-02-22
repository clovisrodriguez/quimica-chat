import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ChatMessage from './ChatMessage';

export default function Chat({ injectedInput, onInputConsumed, onDrawMolecule, onShowBohrModel, onShowPeriodicTable }) {
  const { user, authEnabled, refreshUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const inputRef = useRef(null);
  const userScrolledUpRef = useRef(false);
  const isAutoScrollingRef = useRef(false);

  const handleScroll = useCallback(() => {
    if (isAutoScrollingRef.current) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    userScrolledUpRef.current = distanceFromBottom > 80;
  }, []);

  useEffect(() => {
    if (userScrolledUpRef.current) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    isAutoScrollingRef.current = true;
    el.scrollTop = el.scrollHeight;
    // Reset flag after a tick so subsequent user scrolls are detected
    requestAnimationFrame(() => { isAutoScrollingRef.current = false; });
  }, [messages]);

  useEffect(() => {
    if (injectedInput) {
      setInput(injectedInput);
      onInputConsumed();
      inputRef.current?.focus();
    }
  }, [injectedInput, onInputConsumed]);

  async function handleSend(e) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMessage = { role: 'user', content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsStreaming(true);

    const assistantMessage = { role: 'assistant', content: '' };
    setMessages([...newMessages, assistantMessage]);
    userScrolledUpRef.current = false;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 429) {
          throw new Error(err.error || 'Límite de mensajes alcanzado. Vuelve mañana o mejora tu plan.');
        }
        if (res.status === 401) {
          throw new Error('Sesión expirada. Recarga la página para iniciar sesión.');
        }
        throw new Error(err.error || 'Error del servidor');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.molecule) {
              onDrawMolecule?.(parsed.molecule);
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                updated[updated.length - 1] = {
                  ...last,
                  content: last.content + '\n\n🧪 *Molécula dibujada en el constructor*',
                };
                return updated;
              });
            }
            if (parsed.bohrModel) {
              onShowBohrModel?.(parsed.bohrModel.element);
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                updated[updated.length - 1] = {
                  ...last,
                  content: last.content + `\n\n⚛️ *Modelo de Bohr de ${parsed.bohrModel.element} mostrado en el constructor*`,
                };
                return updated;
              });
            }
            if (parsed.periodicTable) {
              onShowPeriodicTable?.(parsed.periodicTable);
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                updated[updated.length - 1] = {
                  ...last,
                  content: last.content + '\n\n📋 *Tabla periódica mostrada en el constructor*',
                };
                return updated;
              });
            }
            if (parsed.content) {
              accumulated += parsed.content;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: accumulated,
                };
                return updated;
              });
            }
          } catch {}
        }
      }
      // If no text was accumulated, show a fallback
      if (!accumulated) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: 'No recibí respuesta del servidor. Intenta de nuevo.',
          };
          return updated;
        });
      }
      // Refresh user to update quota display
      if (authEnabled) refreshUser();
    } catch (error) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: `Error: ${error.message}`,
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2.5 border-b border-gray-800 bg-gray-900/50 shrink-0 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-blue-400">Chat con IA</h2>
          <p className="text-xs text-gray-500">
            Pregunta sobre quimica organica
            {authEnabled && user?.usage && (
              <span className="ml-2 text-gray-600">
                {user.usage.used}/{user.usage.limit} mensajes hoy
              </span>
            )}
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => { setMessages([]); setInput(''); }}
            disabled={isStreaming}
            className="text-xs text-gray-400 hover:text-white disabled:text-gray-600 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 px-2.5 py-1 rounded-lg transition-colors"
          >
            Nueva conversación
          </button>
        )}
      </div>

      <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-12 space-y-3">
            <p className="text-4xl">🧪</p>
            <p className="text-sm">Pregunta lo que quieras sobre quimica organica</p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {[
                '¿Que es un grupo funcional?',
                '¿Diferencia entre aldehido y cetona?',
                'Explica la esterificacion',
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-full transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} isStreaming={isStreaming && i === messages.length - 1 && msg.role === 'assistant'} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-gray-800 bg-gray-900/50 shrink-0">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu pregunta..."
            disabled={isStreaming}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            Enviar
          </button>
        </div>
      </form>
    </div>
  );
}
