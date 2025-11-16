import React, { useState, useEffect, useRef } from 'react';
import { ReactWidget } from '@jupyterlab/apputils';
import { requestAPI } from './handler';

/**
 * Message interface for chat messages
 */
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  error?: boolean;
}

/**
 * Chat component
 */
const ChatComponent: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agentStatus, setAgentStatus] = useState<'unknown' | 'healthy' | 'error'>('unknown');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check agent health on mount
  useEffect(() => {
    checkAgentHealth();
  }, []);

  const checkAgentHealth = async () => {
    try {
      const response = await requestAPI<any>('health', {
        method: 'GET'
      });

      if (response.agent_loaded) {
        setAgentStatus('healthy');
        addSystemMessage('Agent is ready and connected');
      } else {
        setAgentStatus('error');
        addSystemMessage('Agent not loaded. Please ensure my_agent.py is configured correctly.');
      }
    } catch (error) {
      console.error('Error checking agent health:', error);
      setAgentStatus('error');
      addSystemMessage('Failed to connect to agent service');
    }
  };

  const addSystemMessage = (content: string) => {
    const systemMessage: Message = {
      id: Date.now().toString(),
      role: 'system',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, systemMessage]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await requestAPI<any>('chat', {
        method: 'POST',
        body: JSON.stringify({
          message: inputValue,
          stream: false
        })
      });

      let assistantContent = '';
      let hasError = false;

      if (response.status === 'error') {
        assistantContent = response.error || 'An error occurred';
        hasError = true;
      } else {
        assistantContent = response.response || JSON.stringify(response);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
        error: hasError
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to send message'}`,
        timestamp: new Date(),
        error: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReloadAgent = async () => {
    setIsLoading(true);
    try {
      await requestAPI<any>('reload', {
        method: 'POST'
      });
      addSystemMessage('Agent reloaded successfully');
      await checkAgentHealth();
    } catch (error) {
      console.error('Error reloading agent:', error);
      addSystemMessage('Failed to reload agent');
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="deepagents-chat-container">
      {/* Header */}
      <div className="deepagents-chat-header">
        <h2 className="deepagents-chat-title">Agent</h2>
        <div className="deepagents-chat-controls">
          <span
            className={`deepagents-status-indicator deepagents-status-${agentStatus}`}
            title={agentStatus === 'healthy' ? 'Agent connected' : 'Agent not available'}
          />
          <button
            className="deepagents-icon-button"
            onClick={handleReloadAgent}
            disabled={isLoading}
            title="Reload agent"
          >
            ↻
          </button>
          <button
            className="deepagents-icon-button"
            onClick={clearChat}
            title="Clear chat"
          >
            🗑
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="deepagents-chat-messages">
        {messages.length === 0 ? (
          <div className="deepagents-chat-empty">
            <p>Start a conversation with your agent</p>
          </div>
        ) : (
          messages.map(message => (
            <div
              key={message.id}
              className={`deepagents-message deepagents-message-${message.role} ${
                message.error ? 'deepagents-message-error' : ''
              }`}
            >
              <div className="deepagents-message-header">
                <span className="deepagents-message-role">
                  {message.role === 'user' ? 'You' : message.role === 'assistant' ? 'Agent' : 'System'}
                </span>
                <span className="deepagents-message-time">
                  {formatTime(message.timestamp)}
                </span>
              </div>
              <div className="deepagents-message-content">
                {message.content}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="deepagents-message deepagents-message-assistant">
            <div className="deepagents-message-header">
              <span className="deepagents-message-role">Agent</span>
            </div>
            <div className="deepagents-message-content deepagents-typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="deepagents-chat-input-container">
        <input
          ref={inputRef}
          type="text"
          className="deepagents-chat-input"
          placeholder="Type your message..."
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
        />
        <button
          className="deepagents-send-button"
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isLoading}
        >
          Send
        </button>
      </div>
    </div>
  );
};

/**
 * A Lumino Widget that wraps a ChatComponent.
 */
export class ChatWidget extends ReactWidget {
  constructor() {
    super();
    this.addClass('deepagents-chat-widget');
  }

  render(): JSX.Element {
    return <ChatComponent />;
  }
}
