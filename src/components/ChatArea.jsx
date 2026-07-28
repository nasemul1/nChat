import { useState, useCallback, useEffect, useRef, memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import oneDark from 'react-syntax-highlighter/dist/esm/styles/prism/one-dark';
import oneLight from 'react-syntax-highlighter/dist/esm/styles/prism/one-light';
import remarkGfm from 'remark-gfm';
import { useShallow } from 'zustand/react/shallow';
import { PROVIDERS } from '../utils/providers';
import { sendMessage, streamToString } from '../utils/api';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import cpp from 'react-syntax-highlighter/dist/esm/languages/prism/cpp';
import c from 'react-syntax-highlighter/dist/esm/languages/prism/c';
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java';
import rust from 'react-syntax-highlighter/dist/esm/languages/prism/rust';
import go from 'react-syntax-highlighter/dist/esm/languages/prism/go';
import ruby from 'react-syntax-highlighter/dist/esm/languages/prism/ruby';
import php from 'react-syntax-highlighter/dist/esm/languages/prism/php';
import swift from 'react-syntax-highlighter/dist/esm/languages/prism/swift';
import kotlin from 'react-syntax-highlighter/dist/esm/languages/prism/kotlin';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import shell from 'react-syntax-highlighter/dist/esm/languages/prism/shell-session';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import docker from 'react-syntax-highlighter/dist/esm/languages/prism/docker';
import graphql from 'react-syntax-highlighter/dist/esm/languages/prism/graphql';
import diff from 'react-syntax-highlighter/dist/esm/languages/prism/diff';

SyntaxHighlighter.registerLanguage('jsx', jsx);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('js', javascript);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('ts', typescript);
SyntaxHighlighter.registerLanguage('tsx', tsx);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('py', python);
SyntaxHighlighter.registerLanguage('cpp', cpp);
SyntaxHighlighter.registerLanguage('c', c);
SyntaxHighlighter.registerLanguage('java', java);
SyntaxHighlighter.registerLanguage('rust', rust);
SyntaxHighlighter.registerLanguage('go', go);
SyntaxHighlighter.registerLanguage('ruby', ruby);
SyntaxHighlighter.registerLanguage('php', php);
SyntaxHighlighter.registerLanguage('swift', swift);
SyntaxHighlighter.registerLanguage('kotlin', kotlin);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('shell', shell);
SyntaxHighlighter.registerLanguage('sql', sql);
SyntaxHighlighter.registerLanguage('markdown', markdown);
SyntaxHighlighter.registerLanguage('yaml', yaml);
SyntaxHighlighter.registerLanguage('yml', yaml);
SyntaxHighlighter.registerLanguage('xml', markup);
SyntaxHighlighter.registerLanguage('html', markup);
SyntaxHighlighter.registerLanguage('docker', docker);
SyntaxHighlighter.registerLanguage('graphql', graphql);
SyntaxHighlighter.registerLanguage('diff', diff);
import useStore from '../store';
import ModelPickerModal from './ModelPickerModal';
import FileAttachment, { AttachmentPreview } from './FileAttachment';

const CopyButton = memo(function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [text]);
  return (
    <button className="copy-code-btn" onClick={handleCopy}>
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
});

const MAX_CONTEXT_MESSAGES = 20;

const MarkdownContent = memo(function MarkdownContent({ content }) {
  const theme = useStore((s) => s.theme);
  const highlightStyle = theme === 'dark' ? oneDark : oneLight;

  const components = useMemo(() => ({
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const codeString = String(children).replace(/\n$/, '');
      if (!inline && (match || codeString.includes('\n'))) {
        return (
          <div className="code-block-wrapper">
            <CopyButton text={codeString} />
            <SyntaxHighlighter
              style={highlightStyle}
              language={match?.[1] || 'text'}
              PreTag="div"
              codeTagProps={{
                style: { background: 'transparent' },
              }}
              customStyle={{
                margin: 0,
                borderRadius: 0,
                padding: '16px',
                fontSize: '13px',
                lineHeight: '1.5',
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border)',
              }}
            >
              {codeString}
            </SyntaxHighlighter>
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
  }), [highlightStyle]);

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  );
});

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

const TypingIndicator = memo(function TypingIndicator() {
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
});

const MessageBubble = memo(function MessageBubble({ role, content, time, files }) {
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
});

export default function ChatArea() {
  const {
    conversations, activeConvo, provider, model,
    apiKeys, modelSupportsFiles,
    theme, toggleTheme,
  } = useStore(useShallow((s) => ({
    conversations: s.conversations,
    activeConvo: s.activeConvo,
    provider: s.provider,
    model: s.model,
    apiKeys: s.apiKeys,
    modelSupportsFiles: s.modelSupportsFiles,
    theme: s.theme,
    toggleTheme: s.toggleTheme,
  })));

  const [input, setInput] = useState('');
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatAreaRef = useRef(null);
  const abortRef = useRef(null);
  const inputRef = useRef(null);
  const lastSendTime = useRef(0);
  const COOLDOWN_MS = 2000;

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
  }, [convo?.messages?.length, isLoading]);

  const handleSend = useCallback(async (text) => {
    if (!text.trim() && files.length === 0) return;

    const now = Date.now();
    const elapsed = now - lastSendTime.current;
    if (elapsed < COOLDOWN_MS) {
      const waitSec = ((COOLDOWN_MS - elapsed) / 1000).toFixed(1);
      alert(`Please wait ${waitSec}s before sending again.`);
      return;
    }

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

    // Prevent sending files when model doesn't support them
    if (files.length > 0 && !modelSupportsFiles) {
      alert('This model does not support file/image input. Please switch to a vision-capable model or remove the attachments.');
      return;
    }

    const attachedFiles = [...files];
    state.addMessage(currentConvo.id, 'user', text || '(sent files)', attachedFiles);
    setInput('');
    setFiles([]);
    setIsLoading(true);
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    const recentMessages = currentConvo.messages.slice(-MAX_CONTEXT_MESSAGES);
    const allMessages = [
      { role: 'system', content: 'You are a helpful AI assistant. Format your responses using markdown when appropriate, including code blocks with language specifications.' },
      ...recentMessages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: text || 'Please analyze the attached files.', files: attachedFiles.length > 0 ? attachedFiles : undefined },
    ];

    try {
      const endpoint = state.customEndpoints[state.provider] || undefined;
      const controller = new AbortController();
      abortRef.current = controller;
      lastSendTime.current = Date.now();

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
        // Check for image/vision support errors from API
        const lowerMsg = msg.toLowerCase();
        if (lowerMsg.includes('image input') || 
            lowerMsg.includes('does not support image') || 
            lowerMsg.includes('vision') && lowerMsg.includes('support') ||
            lowerMsg.includes('image') && lowerMsg.includes('support')) {
          msg = `This model doesn't support image input. Switch to a vision model like GPT-4o, Claude 3.5 Sonnet, or Gemini 1.5 Pro.`;
        }
        state.addMessage(currentConvo.id, 'assistant', `Error: ${msg}`);
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [files, modelSupportsFiles]);

  // Listen for welcome prompts
  useEffect(() => {
const handler = (e) => {
      const { prompt } = e.detail;
      setTimeout(() => handleSend(prompt), 100);
    };
    window.addEventListener('send-welcome-prompt', handler);
    return () => window.removeEventListener('send-welcome-prompt', handler);
  }, [handleSend]);

  // Clipboard paste handler for images
  useEffect(() => {
    const handlePaste = async (e) => {
      if (!modelSupportsFiles) return;
      if (isLoading) return;
      if (e.target !== document.body && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT') return;

      const items = e.clipboardData?.items;
      if (!items || items.length === 0) return;

      const imageItems = Array.from(items).filter((item) => item.type.startsWith('image/'));
      if (imageItems.length === 0) return;

      e.preventDefault();
      
      const newFiles = await Promise.all(
        imageItems.map((item) => {
          const file = item.getAsFile();
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve({
              name: file.name || 'pasted-image.png',
              type: file.type,
              size: file.size,
              dataUrl: reader.result,
            });
            reader.readAsDataURL(file);
          });
        })
      );

      setFiles((prev) => [...prev, ...newFiles]);
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [modelSupportsFiles, isLoading]);

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

  const MAX_RENDERED_MESSAGES = 200;
  const renderedMessages = useMemo(() => {
    if (!convo) return [];
    const msgs = convo.messages;
    if (msgs.length <= MAX_RENDERED_MESSAGES) return msgs;
    return msgs.slice(msgs.length - MAX_RENDERED_MESSAGES);
  }, [convo?.messages]);

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
        <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} aria-label="Toggle theme">
          {theme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
          )}
        </button>
      </div>

      {!convo || convo.messages.length === 0 ? (
        <WelcomeScreen />
      ) : (
        <div className="chat-area" ref={chatAreaRef}>
          <div className="chat-messages">
            {convo.messages.length > MAX_RENDERED_MESSAGES && (
              <div className="msg-history-hint">
                Showing last {MAX_RENDERED_MESSAGES} of {convo.messages.length} messages
              </div>
            )}
            {renderedMessages.map((m, i) => (
              <MessageBubble key={m.time + i} role={m.role} content={m.content} time={m.time} files={m.files} />
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
              ref={inputRef}
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
