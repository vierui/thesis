"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Bookmark, Copy, ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@clerk/nextjs'
import { useNotebookAPI, Document, Message } from '@/lib/api'
import { getChatMessages } from '@/lib/utils'
import { MessageProps } from '@/types'
import { toast } from 'sonner'
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

import { Markmap } from 'markmap-view';
// import { transformer } from './markmap';
import { Toolbar } from 'markmap-toolbar';
import 'markmap-toolbar/dist/style.css';
import { Transformer } from 'markmap-lib';
import useMindMapStore from './markmap'
import { set } from 'react-hook-form'

interface ChatPanelProps {
  sources: Document[]
  selectedSources: string[]
  currentChatBoxId: string
  onChatBoxCreate: (chatBoxId: string) => void
}

interface ChatRequestBody {
    question: string;
    userId: string;
    conversation_history: any[];
    hyde: string;
    reranking: string;
    ultrathink?: string;
    document_ids?: string[];
}

function renderToolbar(mm: Markmap, wrapper: HTMLElement) {
  while (wrapper?.firstChild) wrapper.firstChild.remove();
  if (mm && wrapper) {
    const toolbar = new Toolbar();
    toolbar.attach(mm);
    // Register custom buttons
    toolbar.register({
      id: 'alert',
      title: 'Click to show an alert',
      content: 'Alert',
      onClick: () => alert('You made it!'),
    });
    toolbar.setItems([...Toolbar.defaultItems, 'alert']);
    wrapper.append(toolbar.render());
  }
}


export function ChatPanel({ 
  sources, 
  selectedSources, 
  currentChatBoxId, 
  onChatBoxCreate 
}: ChatPanelProps) {
  const { userId } = useAuth()
  const { api } = useNotebookAPI()
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([])
  const [conversationHistory, setConversationHistory] = useState<MessageProps[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isUltrathinkEnabled, setIsUltrathinkEnabled] = useState(false)
  const [chatBoxName, setChatBoxName] = useState('')
  // const [mindMapData, setMindMapData] = useState('');
  // const [isLoadingMindMap, setIsLoadingMindMap] = useState(false);
  const { mindMapData, setMindMapData, isLoadingMindMap, setIsLoadingMindMap, mindMapDocumentId, setMindMapDocumentId } = useMindMapStore();
  const selectedSourcesData = sources.filter(s => selectedSources.includes(s.id))
  const messageIdCounterRef = useRef<number>(0)

  const transformer = new Transformer();

    const loadConversationHistory = useCallback(async () => {
      if (!currentChatBoxId) return

      try {
        const token = await getToken(); //TOKEN AUTHENTICATION

        if (!token) {
          // Handle kasus kalo user tiba-tiba logout
          toast.error("Your session has expired. Please log in again.");
          return;
        }

        console.log("Calling getChatMessages with ID:", currentChatBoxId); 
        const history = await getChatMessages(currentChatBoxId, token)
        setConversationHistory(history ?? []) 
        
        if(!history || history.length === 0) {
          setMessages([])
          return
        }
        // Convert MessageProps to Message format for display
        const displayMessages: Message[] = []
        for (let i = 0; i < history.length; i += 2) {
          const request = history[i]
          const response = history[i + 1]
          
          if (request && response) {
            displayMessages.push({
              id: parseInt(response.message_id || `${messageIdCounterRef.current++}`),
              request: request.message,
              response: response.message,
              thinking: response.thinking,
              userId: userId || '',
              chatBoxId: parseInt(currentChatBoxId),
              createdAt: new Date(),
              liked: response.liked,
              disliked: response.disliked,
              rating: response.rating,
            })
          }
        }
        setMessages(displayMessages)
      } catch (error) {
        console.error('Failed to load conversation history:', error)
        toast.error('Failed to load conversation history')
      }
    }, [currentChatBoxId, getToken, userId]);

    const createNewChatBox = useCallback(async () => {
      if (!userId) return

      const name = selectedSourcesData.length > 0 
        ? `Chat with ${selectedSourcesData[0].title}${selectedSourcesData.length > 1 ? ` and ${selectedSourcesData.length - 1} more` : ''}`
        : 'New Chat'

      try {
        const response = await api.createChatBox({
          name,
        })
        onChatBoxCreate(response.id)
        setChatBoxName(name)
      } catch (error) {
        console.error('Failed to create chat box:', error)
        toast.error('Failed to create chat session')
      }
    }, [userId, selectedSourcesData, api, onChatBoxCreate])



  // Load conversation history when chatbox changes
  useEffect(() => {
    if (currentChatBoxId) {
      loadConversationHistory()
    } else {
      setMessages([])
      setConversationHistory([])
    }
  }, [currentChatBoxId, loadConversationHistory])

 

  // Create a new chat box if none exists and we have selected sources
  useEffect(() => {
    if (!currentChatBoxId && selectedSources.length > 0 && userId) {
      createNewChatBox()
    }
  }, [selectedSources, userId, currentChatBoxId, createNewChatBox])






  

  const handleSendMessage = useCallback(
    async (messageSend: string) => {
      if (!messageSend.trim() || !userId || !currentChatBoxId) return;

      const userMessage = messageSend;
      setInputValue('');
      setIsLoading(true);

      // Buat pesan pengguna dan pesan AI yang masih kosong
      const tempUserMessageId = messageIdCounterRef.current++;
      const tempAiMessageId = messageIdCounterRef.current++;

      setMessages(prev => [
        ...prev,
        {
          id: tempUserMessageId,
          request: userMessage,
          response: '',
          userId,
          chatBoxId: parseInt(currentChatBoxId),
          createdAt: new Date(),
        },
        {
          id: tempAiMessageId,
          request: '', // AI response tidak punya request
          response: '', // Tampilkan indikator loading awal
          userId,
          chatBoxId: parseInt(currentChatBoxId),
          createdAt: new Date(),
        }
      ]);
      const requestBody: ChatRequestBody = {
        question: userMessage,
        userId,
        conversation_history: conversationHistory,
        hyde: 'true',
        reranking: 'true',
        ultrathink: isUltrathinkEnabled.toString(),
      };

      // Pake `selectedSources` yang isinya list of IDs
      if (selectedSources && selectedSources.length > 0) {
        const idsToSend = selectedSources.map(id => String(id));
        requestBody.document_ids = idsToSend;
      }

      console.log("Request body for LLM:", requestBody);
      try {
        const response = await fetch("/api/chat", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (!response.body) throw new Error("Response body is null");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = "";
        let fullThinking = "";

        setIsLoading(false);

        // Loop untuk membaca stream
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n\n').filter(line => line.trim());

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.substring(6);
              if (dataStr === '[DONE]') {
                // Simpan jawaban lengkap ke database setelah selesai
                // api.createMessage({ ... , response: fullResponse });
                return;
              }

              try {
                const data = JSON.parse(dataStr);

                // Handle answer_token
                if (data.answer_token) {
                  fullResponse += data.answer_token;
                  setMessages(prev =>
                    prev.map(msg =>
                      msg.id === tempAiMessageId
                        ? { ...msg, response: fullResponse, thinking: fullThinking }
                        : msg
                    )
                  );
                }

                // Handle thinking_token
                if (data.thinking_token) {
                  fullThinking += data.thinking_token;
                  setMessages(prev =>
                    prev.map(msg =>
                      msg.id === tempAiMessageId
                        ? { ...msg, thinking: fullThinking, response: fullResponse }
                        : msg
                    )
                  );
                }

                // Handle retrieved document IDs
                if (data.retrieved_doc_ids) {
                  console.log("Retrieved document IDs:", data.retrieved_doc_ids);
                  // You can store IDs in separate state if needed
                }

              } catch (e) {
                console.error("Failed to parse JSON from stream", e);
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to stream message:', error);
        setMessages(prev => prev.map(msg =>
          msg.id === tempAiMessageId ? { ...msg, response: "Sorry, an error occurred." } : msg
        ));
      }
    },
    [userId, currentChatBoxId, conversationHistory, selectedSources, isUltrathinkEnabled, setMessages, setInputValue, setIsLoading]
  );

  useEffect(() => {
    const handleMindMapClick = (event: CustomEvent<string>) => {
      
      const nodeText = event.detail;
      // console.log('Node clicked:', nodeText);
      
      let parsed = JSON.parse(nodeText);

      let node = '';
      let parent = '';
      let prompt = '';
      let docName = sources.find(s => s.id === selectedSources[0])?.title || 'Document';

      try {
        if (!parsed.parentText) {
          prompt = `Discuss what the source explains about ${parsed.nodeText}, in the context of ${docName} document`;
        } else {
          prompt = `Discuss what the source explains about ${parsed.nodeText}, in the context of ${parsed.parentText} in ${docName} document`;
        }
      } catch (e) {
        node = nodeText;
        parent = '';
      }

      handleSendMessage(prompt);
    };

    window.addEventListener('mindmapNodeClick', handleMindMapClick as EventListener);

    return () => {
      window.removeEventListener('mindmapNodeClick', handleMindMapClick as EventListener);
    };
  }, [handleSendMessage, selectedSources, sources]);

  const handleMindMap = async () => {
    // Kalo lagi loading, jangan jalanin fungsi lagi
    if (isLoadingMindMap) return;

    setIsLoadingMindMap(true); // Mulai loading
    // setMindMapData(''); // Bersihin data mind map lama

    try {

      setMindMapDocumentId(selectedSources[0]);

      const mindMap = await api.generateMindMap(
        'private',
        selectedSources[0],
        sources.find(s => s.id === selectedSources[0])?.tag || ''
      );

      console.log('Data mind map:', mindMap);
      
      // Simpan data mind map ke state
      setMindMapData(mindMap);
      // console.log('Sukses dapet data mind map:', data);

    } catch (err) {
      // Kalo ada error di try block (masalah network atau dari throw di atas)
      console.error('Gagal fetch mind map:', err);
    } finally {
      // Apapun yang terjadi (sukses atau gagal), loading selesai
      setIsLoadingMindMap(false);
    }
  };

  const handleMessageFeedback = async (messageId: number, type: 'like' | 'dislike') => {
    try {
      await api.updateMessageFeedback(
        messageId,
        type === 'like' ? true : undefined,
        type === 'dislike' ? true : undefined
      )
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { 
              ...msg, 
              liked: type === 'like' ? true : false,
              disliked: type === 'dislike' ? true : false
            }
          : msg
      ))
    } catch (error) {
      console.error('Failed to update message feedback:', error)
      toast.error('Failed to update feedback')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(inputValue)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard')
    } catch (error) {
      toast.error('Failed to copy')
    }
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-700">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200 dark:hover:text-white">Chat</h2>
          <div className="flex items-center gap-2">
            {selectedSources.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {selectedSources.length} source{selectedSources.length !== 1 ? 's' : ''} selected
              </Badge>
            )}
            {chatBoxName && (
              <Badge variant="secondary" className="text-xs">
                {chatBoxName}
              </Badge>
            )}
            {currentChatBoxId && (
              <Badge variant="outline" className="text-xs">
                Session #{currentChatBoxId}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6 max-w-4xl mx-auto">
          {messages.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2 dark:text-gray-200 dark:hover:text-white">
                Ready to chat with your documents
              </h3>
              <p className="text-gray-600 dark:text-gray-200 dark:hover:text-white">
                {selectedSources.length > 0 
                  ? `Ask questions about your ${selectedSources.length} selected document${selectedSources.length > 1 ? 's' : ''}`
                  : 'Select documents from the sidebar to start chatting'
                }
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className="space-y-3">
              {/* User Message */}
              { message.request &&(
              <div className="flex justify-end">
                <div className="bg-blue-600 text-white rounded-2xl px-4 py-3 max-w-lg">
                  <p className="text-sm">{message.request}</p>
                </div>
              </div>
              )}
              {/* AI Response */}
              {message.response && (
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-2xl p-4 max-w-4xl">
                    {/* Thinking Display */}
                    {message.thinking && message.thinking.trim() && (
                      <details className="mb-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <summary className="cursor-pointer text-xs font-semibold text-purple-800 flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            Thinking Process
                          </span>
                        </summary>
                        <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                          {message.thinking}
                        </div>
                      </details>
                    )}

                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                        {message.response}
                      </p>
                    </div>
                    
                    {selectedSourcesData.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span>Sources:</span>
                          {selectedSourcesData.map(source => (
                            <Badge key={source.id} variant="secondary" className="text-xs">
                              {source.title.length > 30 
                                ? source.title.substring(0, 30) + '...' 
                                : source.title}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {message.responseTime && (
                      <div className="mt-2 text-xs text-gray-500">
                        Response time: {message.responseTime}ms
                      </div>
                    )}
                  </div>
                  
                  {/* Message Actions */}
                  <div className="flex items-center gap-2 pl-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2 text-gray-500 hover:text-gray-700"
                      onClick={() => copyToClipboard(message.response)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-gray-500 hover:text-gray-700">
                      <Bookmark className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`h-8 px-2 ${message.liked ? 'text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                      onClick={() => handleMessageFeedback(message.id, 'like')}
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`h-8 px-2 ${message.disliked ? 'text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
                      onClick={() => handleMessageFeedback(message.id, 'dislike')}
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-50 rounded-2xl p-4 max-w-4xl">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-gray-600">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-600">
        <div className="max-w-4xl mx-auto">
          {selectedSources.length === 0 && (
            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Select sources from the sidebar to start asking questions about your documents.
              </p>
            </div>
          )}

            {selectedSources.length > 0 && selectedSources.length < 2 && (
            <div className="flex justify-start items-center gap-3 mb-3">
              <Button
              type="button"
              variant="outline"
              className="flex items-center gap-2 border-blue-500 text-blue-600 hover:bg-blue-50 hover:border-blue-600 transition"
              onClick={handleMindMap}
              disabled={isLoading || selectedSources.length === 0 || isLoadingMindMap}
              >
              {isLoadingMindMap ? (
                <span className="inline-flex items-center">
                <span className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent mr-2"></span>
                Loading...
                </span>
              ) : (
                <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <circle cx="12" cy="12" r="3" strokeWidth="2" />
                  <circle cx="5" cy="7" r="2" strokeWidth="2" />
                  <circle cx="19" cy="7" r="2" strokeWidth="2" />
                  <circle cx="5" cy="17" r="2" strokeWidth="2" />
                  <circle cx="19" cy="17" r="2" strokeWidth="2" />
                  <line x1="7" y1="7" x2="11" y2="11" strokeWidth="2" />
                  <line x1="17" y1="7" x2="13" y2="11" strokeWidth="2" />
                  <line x1="7" y1="17" x2="11" y2="13" strokeWidth="2" />
                  <line x1="17" y1="17" x2="13" y2="13" strokeWidth="2" />
                </svg>
                Mindmap
                </>
              )}
              </Button>

              <Button
                type="button"
                variant={isUltrathinkEnabled ? "default" : "outline"}
                className={`flex items-center gap-2 transition ${
                  isUltrathinkEnabled
                    ? "border-purple-500 bg-purple-600 text-white hover:bg-purple-700"
                    : "border-purple-500 text-purple-600 hover:bg-purple-50 hover:border-purple-600"
                }`}
                onClick={() => setIsUltrathinkEnabled(!isUltrathinkEnabled)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Ultrathink {isUltrathinkEnabled ? "ON" : "OFF"}
              </Button>
            </div>
            )}


          
          <div className="relative">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={
                selectedSources.length > 0 
                  ? "Ask questions about your selected sources..." 
                  : "Select sources to start chatting..."
              }
              className="min-h-[60px] pr-12 resize-none dark:text-gray-200 dark:hover:text-white"
              disabled={selectedSources.length === 0 || isLoading}
            />
            <Button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim() || selectedSources.length === 0 || isLoading}
              size="sm"
              className="absolute right-2 bottom-2 h-8 w-8 p-0 dark:text-gray-200 dark:hover:text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>
              {selectedSources.length > 0 
                ? `Ready to answer questions from ${selectedSources.length} selected source${selectedSources.length !== 1 ? 's' : ''}`
                : 'Select sources to enable chat'
              }
            </span>
            <span>Press Enter to send, Shift+Enter for new line</span>
          </div>
        </div>
      </div>
    </div>
  )
} 