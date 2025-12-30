
import React, { useEffect, useState, useRef } from 'react';
import { getInstances, createInstance, connectInstance, disconnectInstance, deleteInstance, getChats, getMessages, sendMessage, setWebhook } from '../../services/whatsappService';
import { WhatsAppInstance, WhatsAppChat as WhatsAppChatType, WhatsAppMessage } from '../../types';
import { MessageSquare, Plus, RefreshCw, Smartphone, QrCode, Power, Trash2, Search, Send, Paperclip, MoreVertical, X, Check, CheckCheck, Globe, Link as LinkIcon } from 'lucide-react';

export const WhatsAppChat: React.FC = () => {
  // Global State
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<WhatsAppInstance | null>(null);
  const [loadingInstances, setLoadingInstances] = useState(false);
  
  // Tab State: 'chat' | 'settings'
  const [activeTab, setActiveTab] = useState<'chat' | 'settings'>('chat');

  // Instance Management State
  const [newInstanceName, setNewInstanceName] = useState('');
  const [isCreatingInstance, setIsCreatingInstance] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  
  // Webhook State
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isSettingWebhook, setIsSettingWebhook] = useState(false);

  // Chat State
  const [chats, setChats] = useState<WhatsAppChatType[]>([]);
  const [selectedChat, setSelectedChat] = useState<WhatsAppChatType | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchChatTerm, setSearchChatTerm] = useState('');
  const [newMessageText, setNewMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadInstances();
  }, []);

  useEffect(() => {
    if (selectedInstance && selectedInstance.status === 'connected') {
      loadChats(selectedInstance.token);
    } else {
        setChats([]);
        setSelectedChat(null);
    }
  }, [selectedInstance]);

  useEffect(() => {
    if (selectedInstance && selectedChat) {
      loadMessages(selectedInstance.token, selectedChat.id);
      // Setup simple polling for demo purposes (real app should use webhooks/SSE)
      const interval = setInterval(() => {
          loadMessages(selectedInstance.token, selectedChat.id);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedChat, selectedInstance]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadInstances = async () => {
    setLoadingInstances(true);
    const data = await getInstances();
    setInstances(data);
    
    // Auto-select first connected instance if none selected
    if (!selectedInstance && data.length > 0) {
        const connected = data.find(i => i.status === 'connected');
        if (connected) setSelectedInstance(connected);
        else setSelectedInstance(data[0]);
    } else if (selectedInstance) {
        // Update selected instance data
        const updated = data.find(i => i.id === selectedInstance.id);
        if (updated) setSelectedInstance(updated);
    }
    
    setLoadingInstances(false);
  };

  const handleCreateInstance = async () => {
    if (!newInstanceName) return;
    setIsCreatingInstance(true);
    const newInst = await createInstance(newInstanceName);
    if (newInst) {
        setNewInstanceName('');
        loadInstances();
        setActiveTab('settings'); // Switch to settings to see new instance
    } else {
        alert('Erro ao criar instância. Verifique o console.');
    }
    setIsCreatingInstance(false);
  };

  const handleConnectInstance = async (instance: WhatsAppInstance) => {
    const result = await connectInstance(instance.token);
    if (result.qrcode) {
        setQrCodeData(result.qrcode);
    } else if (result.status === 'connected') {
        alert('Instância já conectada!');
        loadInstances();
    }
  };

  const handleDisconnectInstance = async (instance: WhatsAppInstance) => {
      if (window.confirm(`Desconectar ${instance.name}?`)) {
          await disconnectInstance(instance.token);
          loadInstances();
      }
  };

  const handleDeleteInstance = async (instance: WhatsAppInstance) => {
      if (window.confirm(`Excluir instância ${instance.name} permanentemente?`)) {
          await deleteInstance(instance.token);
          if (selectedInstance?.id === instance.id) setSelectedInstance(null);
          loadInstances();
      }
  };

  const handleSetWebhook = async (instance: WhatsAppInstance) => {
      if (!webhookUrl) return;
      setIsSettingWebhook(true);
      const success = await setWebhook(instance.token, webhookUrl);
      if (success) {
          alert('Webhook configurado com sucesso!');
          setWebhookUrl('');
      } else {
          alert('Erro ao configurar webhook.');
      }
      setIsSettingWebhook(false);
  };

  const closeQrModal = () => {
      setQrCodeData(null);
      loadInstances(); // Refresh status
  };

  const loadChats = async (token: string) => {
      setLoadingChats(true);
      const data = await getChats(token);
      setChats(data);
      setLoadingChats(false);
  };

  const loadMessages = async (token: string, chatId: string) => {
      // Don't show loading on polling updates if we already have messages
      if (messages.length === 0) setLoadingMessages(true);
      const data = await getMessages(token, chatId);
      setMessages(data);
      setLoadingMessages(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedInstance || !selectedChat || !newMessageText.trim()) return;

      setSendingMessage(true);
      const success = await sendMessage(selectedInstance.token, selectedChat.id, newMessageText);
      if (success) {
          setNewMessageText('');
          loadMessages(selectedInstance.token, selectedChat.id); // Refresh immediately
      } else {
          alert('Erro ao enviar mensagem');
      }
      setSendingMessage(false);
  };

  const filteredChats = chats.filter(c => c.name.toLowerCase().includes(searchChatTerm.toLowerCase()));

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      
      {/* Header Bar */}
      <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-slate-800">
                  <MessageSquare className="text-green-600" />
                  <h1 className="text-lg font-bold">WhatsApp</h1>
              </div>
              
              {/* Instance Selector */}
              <div className="relative">
                  <select 
                    value={selectedInstance?.id || ''}
                    onChange={(e) => {
                        const inst = instances.find(i => i.id === e.target.value);
                        setSelectedInstance(inst || null);
                    }}
                    className="pl-3 pr-8 py-1.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-green-500 outline-none appearance-none cursor-pointer min-w-[200px]"
                  >
                      <option value="" disabled>Selecione uma Instância</option>
                      {instances.map(inst => (
                          <option key={inst.id} value={inst.id}>
                              {inst.name} ({inst.status === 'connected' ? 'Online' : 'Offline'})
                          </option>
                      ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <div className={`w-2.5 h-2.5 rounded-full ${selectedInstance?.status === 'connected' ? 'bg-green-500' : 'bg-red-400'}`}></div>
                  </div>
              </div>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-lg">
              <button 
                onClick={() => setActiveTab('chat')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'chat' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  Conversas
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'settings' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  Gerenciar Instâncias
              </button>
          </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
          
          {/* TAB: SETTINGS (Instances) */}
          {activeTab === 'settings' && (
              <div className="p-8 h-full overflow-y-auto">
                  <div className="max-w-4xl mx-auto">
                      <div className="flex justify-between items-end mb-6">
                          <div>
                              <h2 className="text-xl font-bold text-slate-900">Gerenciar Instâncias</h2>
                              <p className="text-slate-500 text-sm">Crie e conecte novas instâncias do WhatsApp.</p>
                          </div>
                          
                          <div className="flex gap-2">
                              <input 
                                type="text" 
                                placeholder="Nome da nova instância" 
                                value={newInstanceName}
                                onChange={e => setNewInstanceName(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                              />
                              <button 
                                onClick={handleCreateInstance}
                                disabled={isCreatingInstance || !newInstanceName}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 disabled:opacity-50"
                              >
                                  <Plus size={18} /> Criar
                              </button>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {instances.map(inst => (
                              <div key={inst.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col">
                                  <div className={`absolute top-0 left-0 w-full h-1 ${inst.status === 'connected' ? 'bg-green-500' : inst.status === 'connecting' ? 'bg-yellow-500' : 'bg-red-400'}`}></div>
                                  
                                  <div className="flex justify-between items-start mb-4">
                                      <div className="flex items-center gap-3">
                                          {inst.profilePicUrl ? (
                                              <img src={inst.profilePicUrl} alt="" className="w-10 h-10 rounded-full" />
                                          ) : (
                                              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                                                  <Smartphone size={20} className="text-slate-400"/>
                                              </div>
                                          )}
                                          <div>
                                              <h3 className="font-bold text-slate-900">{inst.name}</h3>
                                              <p className="text-xs text-slate-500 truncate max-w-[120px]" title={inst.id}>ID: {inst.id}</p>
                                          </div>
                                      </div>
                                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${inst.status === 'connected' ? 'bg-green-100 text-green-700' : inst.status === 'connecting' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                          {inst.status}
                                      </span>
                                  </div>

                                  <div className="flex flex-col gap-2 mt-auto">
                                      {inst.status !== 'connected' && (
                                          <button 
                                            onClick={() => handleConnectInstance(inst)}
                                            className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                                          >
                                              <QrCode size={14} /> Conectar (QR Code)
                                          </button>
                                      )}
                                      
                                      {inst.status === 'connected' && (
                                          <div className="space-y-2">
                                              {/* Webhook Config Input */}
                                              <div className="flex gap-1">
                                                  <input 
                                                    type="text" 
                                                    placeholder="URL do Webhook" 
                                                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-green-500 outline-none"
                                                    value={webhookUrl}
                                                    onChange={e => setWebhookUrl(e.target.value)}
                                                  />
                                                  <button
                                                    onClick={() => handleSetWebhook(inst)}
                                                    disabled={isSettingWebhook || !webhookUrl}
                                                    className="px-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                                                    title="Configurar Webhook"
                                                  >
                                                      <Globe size={14} />
                                                  </button>
                                              </div>

                                              <button 
                                                onClick={() => handleDisconnectInstance(inst)}
                                                className="w-full py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                                              >
                                                  <Power size={14} /> Desconectar
                                              </button>
                                          </div>
                                      )}

                                      <button 
                                        onClick={() => handleDeleteInstance(inst)}
                                        className="w-full py-2 border border-red-100 text-red-600 bg-red-50 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                                      >
                                          <Trash2 size={14} /> Excluir
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          {/* TAB: CHAT */}
          {activeTab === 'chat' && (
              <div className="flex h-full">
                  {/* Sidebar Chats */}
                  <div className="w-80 border-r border-gray-200 flex flex-col bg-slate-50">
                      <div className="p-4 border-b border-gray-200 bg-white">
                          <div className="relative">
                              <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                              <input 
                                type="text" 
                                placeholder="Buscar conversas..." 
                                value={searchChatTerm}
                                onChange={e => setSearchChatTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                              />
                          </div>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto custom-scrollbar">
                          {!selectedInstance ? (
                              <div className="p-8 text-center text-slate-400 text-sm">Selecione uma instância acima para ver as conversas.</div>
                          ) : selectedInstance.status !== 'connected' ? (
                              <div className="p-8 text-center text-red-400 text-sm font-medium">Instância desconectada. Vá em "Gerenciar Instâncias" para reconectar.</div>
                          ) : loadingChats ? (
                              <div className="p-8 text-center text-slate-400 text-sm">Carregando conversas...</div>
                          ) : filteredChats.length === 0 ? (
                              <div className="p-8 text-center text-slate-400 text-sm">Nenhuma conversa encontrada.</div>
                          ) : (
                              filteredChats.map(chat => (
                                  <div 
                                    key={chat.id} 
                                    onClick={() => setSelectedChat(chat)}
                                    className={`p-3 border-b border-gray-100 cursor-pointer transition-colors flex gap-3 ${selectedChat?.id === chat.id ? 'bg-green-50' : 'hover:bg-white bg-white'}`}
                                  >
                                      {chat.image ? (
                                          <img src={chat.image} className="w-12 h-12 rounded-full object-cover" alt="" />
                                      ) : (
                                          <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-lg">
                                              {chat.name.charAt(0)}
                                          </div>
                                      )}
                                      <div className="flex-1 min-w-0">
                                          <div className="flex justify-between items-start">
                                              <h4 className="font-bold text-slate-900 text-sm truncate">{chat.name}</h4>
                                              {chat.lastMessageTimestamp && (
                                                  <span className="text-[10px] text-slate-400">
                                                      {new Date(chat.lastMessageTimestamp * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                  </span>
                                              )}
                                          </div>
                                          <p className="text-xs text-slate-500 truncate mt-0.5">{chat.lastMessage}</p>
                                      </div>
                                  </div>
                              ))
                          )}
                      </div>
                  </div>

                  {/* Main Chat Area */}
                  <div className="flex-1 flex flex-col bg-[#efeae2]">
                      {selectedChat ? (
                          <>
                              {/* Chat Header */}
                              <div className="bg-gray-100 p-3 flex justify-between items-center border-b border-gray-200 shadow-sm">
                                  <div className="flex items-center gap-3">
                                      {selectedChat.image ? (
                                          <img src={selectedChat.image} className="w-10 h-10 rounded-full object-cover" alt="" />
                                      ) : (
                                          <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center text-slate-600 font-bold">
                                              {selectedChat.name.charAt(0)}
                                          </div>
                                      )}
                                      <div>
                                          <h3 className="font-bold text-slate-900">{selectedChat.name}</h3>
                                          <p className="text-xs text-slate-500">{selectedChat.phone}</p>
                                      </div>
                                  </div>
                                  <div className="flex gap-2">
                                      <button className="p-2 text-slate-500 hover:bg-gray-200 rounded-full"><Search size={20} /></button>
                                      <button className="p-2 text-slate-500 hover:bg-gray-200 rounded-full"><MoreVertical size={20} /></button>
                                  </div>
                              </div>

                              {/* Messages */}
                              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundRepeat: 'repeat', backgroundSize: '400px' }}>
                                  {loadingMessages && messages.length === 0 ? (
                                      <div className="flex justify-center mt-10"><div className="bg-white/80 px-4 py-2 rounded-full text-xs font-bold text-slate-500 shadow-sm">Carregando mensagens...</div></div>
                                  ) : (
                                      messages.map(msg => (
                                          <div key={msg.id} className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}>
                                              <div className={`max-w-[70%] p-2 rounded-lg shadow-sm text-sm relative ${msg.fromMe ? 'bg-[#d9fdd3] text-slate-900 rounded-tr-none' : 'bg-white text-slate-900 rounded-tl-none'}`}>
                                                  <p className="whitespace-pre-wrap">{msg.text || (msg.type === 'image' ? '📷 Imagem' : '📁 Arquivo')}</p>
                                                  <div className="text-[10px] text-slate-400 text-right mt-1 flex items-center justify-end gap-1">
                                                      {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                      {msg.fromMe && (
                                                          <span>
                                                              {msg.status === 'read' ? <CheckCheck size={12} className="text-blue-500" /> : <Check size={12} />}
                                                          </span>
                                                      )}
                                                  </div>
                                              </div>
                                          </div>
                                      ))
                                  )}
                                  <div ref={messagesEndRef} />
                              </div>

                              {/* Input */}
                              <form onSubmit={handleSendMessage} className="bg-gray-100 p-3 flex items-center gap-2">
                                  <button type="button" className="p-2 text-slate-500 hover:bg-gray-200 rounded-full"><Plus size={24} /></button>
                                  <input 
                                    type="text" 
                                    value={newMessageText}
                                    onChange={e => setNewMessageText(e.target.value)}
                                    placeholder="Digite uma mensagem" 
                                    className="flex-1 py-2 px-4 rounded-lg border border-gray-300 focus:outline-none focus:border-green-500"
                                  />
                                  {newMessageText.trim() ? (
                                      <button type="submit" disabled={sendingMessage} className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors shadow-sm disabled:opacity-50">
                                          <Send size={20} className={sendingMessage ? 'animate-pulse' : ''} />
                                      </button>
                                  ) : (
                                      <button type="button" className="p-2 text-slate-500 hover:bg-gray-200 rounded-full">
                                          <Smartphone size={24} /> {/* Placeholder for voice note */}
                                      </button>
                                  )}
                              </form>
                          </>
                      ) : (
                          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#f0f2f5] border-b-[6px] border-green-500">
                              <Smartphone size={64} className="text-slate-300 mb-4" />
                              <h2 className="text-2xl font-light text-slate-600 mb-2">WhatsApp Web</h2>
                              <p className="text-sm text-slate-500 max-w-md">Envie e receba mensagens sem precisar manter seu celular conectado.</p>
                          </div>
                      )}
                  </div>
              </div>
          )}
      </div>

      {/* QR Code Modal */}
      {qrCodeData && (
          <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl relative">
                  <button onClick={closeQrModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={24}/></button>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Conectar WhatsApp</h3>
                  <p className="text-sm text-slate-500 mb-6">Abra o WhatsApp no seu celular, vá em Dispositivos Conectados e escaneie o código abaixo.</p>
                  
                  <div className="bg-white p-2 border border-gray-200 rounded-xl inline-block shadow-sm mb-4">
                      {/* Using img tag directly for base64 data string */}
                      <img src={qrCodeData} alt="QR Code" className="w-64 h-64" />
                  </div>
                  
                  <div className="animate-pulse text-xs font-bold text-green-600 flex items-center justify-center gap-2">
                      <RefreshCw size={12} className="animate-spin" /> Aguardando leitura...
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
