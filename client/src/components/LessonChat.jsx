import { useState, useRef, useEffect, useCallback } from 'react';
import ChatMessage from './ChatMessage';

export default function LessonChat({ lesson, onDrawMolecule, onShowBohrModel, onShowPeriodicTable, onMarkComplete, onBack }) {
  const [messages, setMessages] = useState([]);       // visible messages
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const inputRef = useRef(null);
  const initRef = useRef(false);
  const apiMessagesRef = useRef([]);                   // full history for API
  const userScrolledUpRef = useRef(false);
  const isAutoScrollingRef = useRef(false);

  // Track if user scrolled up (ignore programmatic scrolls)
  const handleScroll = useCallback(() => {
    if (isAutoScrollingRef.current) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    userScrolledUpRef.current = distanceFromBottom > 80;
  }, []);

  // Smart auto-scroll: only if user hasn't scrolled up
  useEffect(() => {
    if (userScrolledUpRef.current) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    isAutoScrollingRef.current = true;
    el.scrollTop = el.scrollHeight;
    requestAnimationFrame(() => { isAutoScrollingRef.current = false; });
  }, [messages]);

  // Auto-trigger AI greeting on mount (hidden user message)
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const initMsg = { role: 'user', content: 'Hola, estoy listo para aprender.' };
    apiMessagesRef.current = [initMsg];
    streamResponse([initMsg]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function sendMessage(text) {
    if (!text.trim() || isStreaming) return;

    const userMessage = { role: 'user', content: text.trim() };
    apiMessagesRef.current = [...apiMessagesRef.current, userMessage];
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    // Reset scroll tracking when user sends a message
    userScrolledUpRef.current = false;

    streamResponse(apiMessagesRef.current);
  }

  async function streamResponse(apiMessages) {
    setIsStreaming(true);

    const assistantMessage = { role: 'assistant', content: '' };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          systemPrompt: lesson.systemPrompt,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
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
            if (parsed.lessonComplete) {
              setLessonCompleted(true);
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
        accumulated = 'No recibí respuesta del servidor. Intenta de nuevo.';
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: accumulated };
          return updated;
        });
      }
      // Add assistant response to API history
      apiMessagesRef.current = [...apiMessagesRef.current, { role: 'assistant', content: accumulated }];
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

  function handleSend(e) {
    e?.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-gray-800 bg-gray-900/50 shrink-0 flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white text-sm transition-colors"
        >
          ← Volver
        </button>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-emerald-400 truncate">
            Lección {lesson.order}: {lesson.title}
          </h2>
        </div>
      </div>

      {/* Exercise banner */}
      {lesson.exercise && (
        <div className="px-4 py-2 border-b border-amber-900/50 bg-amber-900/20 shrink-0">
          <p className="text-xs font-medium text-amber-400">Ejercicio</p>
          <p className="text-xs text-amber-200/80 mt-0.5">{lesson.exercise.instruction}</p>
          {lesson.exercise.hint && (
            <p className="text-xs text-gray-500 mt-0.5 italic">{lesson.exercise.hint}</p>
          )}
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {messages.map((msg, i) => (
          <ChatMessage
            key={i}
            message={msg}
            isStreaming={isStreaming && i === messages.length - 1 && msg.role === 'assistant'}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Completion banner */}
      {lessonCompleted && (
        <div className="px-4 py-3 border-t border-emerald-800/50 bg-emerald-900/30 shrink-0">
          <p className="text-sm text-emerald-300 font-medium text-center">El tutor ha marcado esta lección como completada</p>
          <button
            onClick={onMarkComplete}
            className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Continuar a la siguiente lección
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-gray-800 bg-gray-900/50 shrink-0">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu pregunta..."
            disabled={isStreaming}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
