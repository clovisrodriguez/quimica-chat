import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChatMessage from './ChatMessage';

describe('ChatMessage', () => {
  it('renders user message text', () => {
    render(<ChatMessage message={{ role: 'user', content: 'Hello world' }} isStreaming={false} />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('applies user bubble class for user messages', () => {
    const { container } = render(
      <ChatMessage message={{ role: 'user', content: 'Test' }} isStreaming={false} />
    );
    expect(container.querySelector('.chat-bubble-user')).toBeInTheDocument();
  });

  it('applies assistant bubble class for assistant messages', () => {
    const { container } = render(
      <ChatMessage message={{ role: 'assistant', content: 'Response' }} isStreaming={false} />
    );
    expect(container.querySelector('.chat-bubble-assistant')).toBeInTheDocument();
  });

  it('renders assistant content with markdown', () => {
    render(
      <ChatMessage message={{ role: 'assistant', content: '**bold text**' }} isStreaming={false} />
    );
    const bold = screen.getByText('bold text');
    expect(bold.tagName).toBe('STRONG');
  });

  it('shows typing dots when streaming with content', () => {
    const { container } = render(
      <ChatMessage message={{ role: 'assistant', content: 'Loading...' }} isStreaming={true} />
    );
    const dots = container.querySelectorAll('.typing-dot');
    expect(dots.length).toBe(3);
  });

  it('shows typing dots when streaming without content', () => {
    const { container } = render(
      <ChatMessage message={{ role: 'assistant', content: '' }} isStreaming={true} />
    );
    const dots = container.querySelectorAll('.typing-dot');
    expect(dots.length).toBe(3);
  });

  it('does not show typing dots when not streaming', () => {
    const { container } = render(
      <ChatMessage message={{ role: 'assistant', content: 'Done' }} isStreaming={false} />
    );
    const dots = container.querySelectorAll('.typing-dot');
    expect(dots.length).toBe(0);
  });

  it('aligns user messages to the right', () => {
    const { container } = render(
      <ChatMessage message={{ role: 'user', content: 'Hi' }} isStreaming={false} />
    );
    expect(container.firstChild).toHaveClass('justify-end');
  });

  it('aligns assistant messages to the left', () => {
    const { container } = render(
      <ChatMessage message={{ role: 'assistant', content: 'Hi' }} isStreaming={false} />
    );
    expect(container.firstChild).toHaveClass('justify-start');
  });
});
