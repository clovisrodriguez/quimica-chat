import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatMessage({ message, isStreaming }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} chat-message-enter`}>
      <div className={isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'}>
        {isUser ? (
          <p className="text-sm">{message.content}</p>
        ) : (
          <>
            {isStreaming ? (
              // Plain text during streaming — avoids re-parsing markdown on every chunk
              message.content ? (
                <p className="text-sm whitespace-pre-wrap streaming-text">{message.content}</p>
              ) : (
                <div className="flex gap-1 py-1">
                  <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
                  <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
                  <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
                </div>
              )
            ) : (
              // Full markdown after streaming completes
              <div className="text-sm prose prose-invert prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
