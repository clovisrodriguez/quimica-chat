import ReactMarkdown from 'react-markdown';

export default function ChatMessage({ message, isStreaming }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'}>
        {isUser ? (
          <p className="text-sm">{message.content}</p>
        ) : (
          <>
            <div className="text-sm prose prose-invert prose-sm max-w-none">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
            {isStreaming && message.content && (
              <span className="inline-flex gap-1 ml-1">
                <span className="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full inline-block" />
                <span className="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full inline-block" />
                <span className="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full inline-block" />
              </span>
            )}
            {isStreaming && !message.content && (
              <div className="flex gap-1 py-1">
                <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
                <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
                <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
