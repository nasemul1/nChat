import { useState, useCallback, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PROVIDERS } from '../utils/providers';
import { sendMessage, streamToString } from '../utils/api';
import useStore from '../store';
import ModelPickerModal from './ModelPickerModal';
import FileAttachment, { AttachmentPreview } from './FileAttachment';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button className="copy-code-btn" onClick={handleCopy}>
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function MarkdownContent({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const codeString = String(children).replace(/\n$/, '');
          if (!inline && (match || codeString.includes('\n'))) {
            return (
              <div className="code-block-wrapper">
                <CopyButton text={codeString} />
                <pre className={className}>
                  <code className={className} {...props}>
                    {codeString}
                  </code>
                </pre>
              </div>
            );
          }
          return (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
        table({ children, ...props }) {
          return (
            <div style={{ overflowX: 'auto' }}>
              <table {...props}>{children}</table>
            </div>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function WelcomeScreen() {
  const createConversation = useStore((s) => s.createConversation);
  const prompts = [
    'Explain quantum computing in simple terms',
    'Write a Python function to sort a list',
    'What are the best practices for REST API design?',
    'Help me debug this error: Cannot read property of undefined',
  ];

  const handlePrompt = (prompt) => {
    const id = createConversation();
    setTimeout(() => {
      const event = new CustomEvent('send-welcome-prompt', { detail: { convoId: id, prompt } });
      window.dispatchEvent(event);
    }, 50);
  };

  return (
    <div className="welcome">
      <div className="welcome-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
      </div>
      <h2>What can I help with?</h2>
      <p>Start a conversation. I'm connected to your API keys and ready to assist with anything.</p>
      <div className="welcome-prompts">
        {prompts.map((p) => (
          <button key={p} className="welcome-prompt" onClick={() => handlePrompt(p)}>
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="msg assistant">
      <div className="msg-avatar">AI</div>
      <div className="msg-body">
        <div className="msg-role">AI</div>
        <div className="msg-content">
          <div className="typing-indicator"><span></span><span></span><span></span></div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ role, content, time, files }) {
  const label = role === 'user' ? 'You' : 'AI';
  const avatar = role === 'user' ? 'Y' : 'AI';
  return (
    <div className={`msg ${role}`}>
      <div className="msg-avatar">{avatar}</div>
      <div className="msg-body">
        <div className="msg-role">{label}</div>
        {files && files.length > 0 && (
          <div className="msg-attachments">
            {files.map((f, i) => (
              f.type?.startsWith('image/') ? (
                <img key={i} src={f.dataUrl} alt={f.name} className="msg-attachment-img" />
              ) : (
                <div key={i} className="msg-attachment-file">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                  </svg>
                  {f.name}
                </div>
              )
            ))}
          </div>
        )}
        <div className="msg-content">
          {role === 'assistant' ? <MarkdownContent content={content} /> : content}
        </div>
        <div className="msg-timestamp">{time}</div>
      </div>
    </div>
  );
}

export default function ChatArea() {
  const {
    conversations, activeConvo, provider, model,
    apiKeys, customEndpoints, accountIds, modelSupportsFiles, addMessage,
  } = useStore();

  const [input, setInput] = useState('');
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatAreaRef = useRef(null);
  const abortRef = useRef(null);

  const convo = conversations.find((c) => c.id === activeConvo);

  // Clear attached files when switching to a non-vision model
  useEffect(() => {
    if (!modelSupportsFiles && files.length > 0) {
      setFiles([]);
    }
  }, [modelSupportsFiles]);

  // Auto-scroll
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [convo?.messages?.length]);

  const handleSend = useCallback(async (text) => {
    if (!text.trim() && files.length === 0) return;

    const state = useStore.getState();
    let currentConvo = state.conversations.find((c) => c.id === state.activeConvo);
    if (!currentConvo) {
      const newId = useStore.getState().createConversation();
      currentConvo = useStore.getState().conversations.find((c) => c.id === newId);
    }

    const apiKey = state.apiKeys[state.provider];
    const accountId = state.accountIds?.[state.provider];
    if (PROVIDERS[state.provider]?.needsKey && !apiKey) {
      alert('Please set your API key in Settings first.');
      return;
    }
    if (PROVIDERS[state.provider]?.needsAccountId && !accountId) {
      alert('Please set your Cloudflare Account ID in Settings first.');
      return;
    }

    const attachedFiles = [...files];
    state.addMessage(currentConvo.id, 'user', text || '(sent files)', attachedFiles);
    setInput('');
    setFiles([]);
    setIsLoading(true);

    const allMessages = [
      { role: 'system', content: 'You are a helpful AI assistant. Format your responses using markdown when appropriate, including code blocks with language specifications.' },
      ...currentConvo.messages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: text || 'Please analyze the attached files.', files: attachedFiles.length > 0 ? attachedFiles : undefined },
    ];

    try {
      const endpoint = state.customEndpoints[state.provider] || undefined;
      const controller = new AbortController();
      abortRef.current = controller;

      const stream = await sendMessage({
        provider: state.provider,
        model: state.model,
        apiKey,
        accountId,
        messages: allMessages,
        endpoint,
        signal: controller.signal,
      });

      const fullText = await streamToString(stream);
      state.addMessage(currentConvo.id, 'assistant', fullText);
    } catch (err) {
      console.error('Chat send error:', err);
      if (err.name !== 'AbortError') {
        let msg = err.message;
        if (msg.includes('image input') || msg.includes('image') && msg.includes('support')) {
          msg = `This model doesn't support image input. Switch to a vision model like GPT-4o, Claude 3.5 Sonnet, or Gemini 1.5 Pro.`;
        }
        state.addMessage(currentConvo.id, 'assistant', `Error: ${msg}`);
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [files]);

  // Listen for welcome prompts
  useEffect(() => {
    const handler = (e) => {
      const { prompt } = e.detail;
      setTimeout(() => handleSend(prompt), 100);
    };
    window.addEventListener('send-welcome-prompt', handler);
    return () => window.removeEventListener('send-welcome-prompt', handler);
  }, [handleSend]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
  };

  const canSend = (input.trim() || files.length > 0) && !isLoading;

  return (
    <main className="main">
      <div className="main-header">
        <button className="menu-toggle" onClick={() => useStore.getState().toggleSidebar()} aria-label="Toggle sidebar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
        </button>
        <div className="header-title">{convo?.title || 'New conversation'}</div>
        <button className="header-model" onClick={() => useStore.getState().openSettings()}>
          {model || 'Select model'}
        </button>
        <div className={`status-dot${apiKeys[provider] ? '' : ' offline'}`} title={apiKeys[provider] ? 'Connected' : 'No API key'} />
      </div>

      {!convo || convo.messages.length === 0 ? (
        <WelcomeScreen />
      ) : (
        <div className="chat-area" ref={chatAreaRef}>
          <div className="chat-messages">
            {convo.messages.map((m, i) => (
              <MessageBubble key={i} role={m.role} content={m.content} time={m.time} files={m.files} />
            ))}
            {isLoading && <TypingIndicator />}
          </div>
        </div>
      )}

      <div className="input-bar">
        <div className="input-wrapper">
          <AttachmentPreview files={files} setFiles={setFiles} />
          <div className="input-row">
            <FileAttachment files={files} setFiles={setFiles} supportsFiles={modelSupportsFiles} />
            <textarea
              className="input-field"
              rows={1}
              placeholder={files.length > 0 ? `${files.length} file(s) attached — add a message...` : 'Message...'}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button
              className="send-btn"
              disabled={!canSend}
              onClick={() => handleSend(input)}
              aria-label="Send message"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
          <div className="input-footer">
            <ModelPickerModal />
            <span className="input-hint">Enter to send · Shift+Enter new line</span>
          </div>
        </div>
      </div>
    </main>
  );
}
