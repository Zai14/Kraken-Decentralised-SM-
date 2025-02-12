import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Send, 
  Loader2, 
  Check, 
  CheckCheck, 
  File, 
  Edit3,
  ChevronDown,
  X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase, type Message, type Conversation } from '../lib/supabase';
import { FileUpload } from '../components/FileUpload';

export function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newRecipient, setNewRecipient] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [account, setAccount] = useState<string | null>(null);

  useEffect(() => {
    const getAccount = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setAccount(session.user.id.toLowerCase());
      }
    };
    getAccount();
  }, []);

  useEffect(() => {
    if (account) {
      loadConversations();
      const subscription = supabase
        .channel('messages')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedChat}`,
        }, (payload) => {
          if (payload.new.sender !== account) {
            loadMessages();
          }
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [account, selectedChat]);

  useEffect(() => {
    if (selectedChat) {
      loadMessages();
    }
  }, [selectedChat]);

  const loadConversations = async () => {
    if (!account) return;
    
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const createNewConversation = async () => {
    if (!account || !newRecipient) return;
    
    const normalizedRecipient = newRecipient.toLowerCase();
    if (normalizedRecipient === account) {
      alert("You can't start a conversation with yourself");
      return;
    }

    try {
      const { data: existingConversations } = await supabase
        .from('conversations')
        .select('*')
        .filter('participants', 'cs', `{${account},${normalizedRecipient}}`)
        .not('is_group', 'eq', true);

      if (existingConversations && existingConversations.length > 0) {
        setSelectedChat(existingConversations[0].id);
        setShowNewChat(false);
        setNewRecipient('');
        return;
      }

      const { data: newConversation, error } = await supabase
        .from('conversations')
        .insert({
          participants: [account, normalizedRecipient],
          is_group: false,
          last_message: null,
          last_message_time: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setSelectedChat(newConversation.id);
      setShowNewChat(false);
      setNewRecipient('');
      await loadConversations();
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Failed to create conversation. Please check the address and try again.');
    }
  };

  const loadMessages = async () => {
    if (!selectedChat) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          attachments (*)
        `)
        .eq('conversation_id', selectedChat)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      scrollToBottom();
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const getOtherParticipant = (conversation: Conversation) => {
    const other = conversation.participants.find(p => p.toLowerCase() !== account);
    return other ? `${other.slice(0, 6)}...${other.slice(-4)}` : 'Unknown';
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !account || !selectedChat || sending) return;

    setSending(true);
    try {
      let attachment;
      if (selectedFile) {
        const path = `files/${Date.now()}-${selectedFile.name}`;
        await supabase.storage.from('attachments').upload(path, selectedFile);
        attachment = {
          file_path: path,
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          file_type: selectedFile.type,
        };
      }

      const messageContent = selectedFile 
        ? `Sent ${selectedFile.type.startsWith('image/') ? 'an image' : 'a file'}: ${selectedFile.name}`
        : newMessage;

      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedChat,
          sender: account,
          content: messageContent,
        })
        .select()
        .single();

      if (error) throw error;

      if (attachment) {
        const { error: attachmentError } = await supabase
          .from('attachments')
          .insert({
            message_id: message.id,
            ...attachment,
          });

        if (attachmentError) throw attachmentError;
      }

      setNewMessage('');
      setSelectedFile(null);
      await loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter(conversation => {
    const searchTerm = searchQuery.toLowerCase();
    const participantMatch = conversation.participants.some(p => 
      p.toLowerCase().includes(searchTerm)
    );
    return participantMatch;
  });

  const renderMessage = (message: Message) => {
    const isOwnMessage = message.sender.toLowerCase() === account;
    const isImage = message.attachments?.[0]?.file_type.startsWith('image/');
    const attachment = message.attachments?.[0];

    return (
      <div
        key={message.id}
        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`max-w-[70%] rounded-lg p-3 ${
          isOwnMessage ? 'bg-zinc-800' : 'bg-zinc-900'
        }`}>
          {attachment && (
            isImage ? (
              <img
                src={supabase.storage.from('attachments').getPublicUrl(attachment.file_path).data.publicUrl}
                alt={attachment.file_name}
                className="max-w-full rounded-lg mb-2"
              />
            ) : (
              <a
                href={supabase.storage.from('attachments').getPublicUrl(attachment.file_path).data.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 bg-zinc-700 rounded-lg p-2 mb-2 hover:bg-zinc-600 transition-colors"
              >
                <File className="w-5 h-5" />
                <span className="text-sm truncate">{attachment.file_name}</span>
              </a>
            )
          )}
          <p className="text-zinc-100">{message.content}</p>
          <div className="flex items-center justify-end space-x-1 mt-1">
            <p className="text-xs text-zinc-400">
              {formatTimestamp(message.created_at)}
            </p>
            {isOwnMessage && (
              message.read ? (
                <CheckCheck className="w-4 h-4 text-blue-400" />
              ) : (
                <Check className="w-4 h-4 text-zinc-400" />
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] md:h-screen flex bg-zinc-950">
      {/* Chat list */}
      <div className="w-full md:w-96 border-r border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-zinc-100">Messages</h2>
            <button
              onClick={() => setShowNewChat(true)}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-zinc-100"
              title="New Message"
            >
              <Edit3 className="w-5 h-5" />
            </button>
          </div>
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by address"
              className="w-full bg-zinc-900 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-zinc-700 text-zinc-100 placeholder-zinc-500"
            />
          </div>
        </div>

        {showNewChat && (
          <div className="p-4 border-b border-zinc-800 bg-zinc-900">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-zinc-100">New Message</h3>
                <button
                  onClick={() => {
                    setShowNewChat(false);
                    setNewRecipient('');
                  }}
                  className="text-zinc-400 hover:text-zinc-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-zinc-400">To:</span>
                <input
                  type="text"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  placeholder="Enter wallet address (0x...)"
                  className="flex-1 bg-transparent border-none focus:outline-none text-zinc-100 placeholder-zinc-500"
                />
              </div>
              {newRecipient && (
                <button
                  onClick={createNewConversation}
                  disabled={!newRecipient || newRecipient.toLowerCase() === account}
                  className="w-full bg-zinc-800 text-zinc-100 py-2 rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start Conversation
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => setSelectedChat(conversation.id)}
              className={`w-full p-4 flex items-center space-x-3 hover:bg-zinc-900 transition-colors ${
                selectedChat === conversation.id ? 'bg-zinc-900' : ''
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-lg font-semibold text-zinc-300">
                {getOtherParticipant(conversation).slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-zinc-100 truncate">
                  {getOtherParticipant(conversation)}
                </p>
                <div className="flex items-center space-x-1">
                  <p className="text-sm text-zinc-400 truncate">
                    {conversation.last_message || 'No messages yet'}
                  </p>
                  <span className="text-zinc-600">·</span>
                  <p className="text-sm text-zinc-500">
                    {conversation.last_message_time && formatTimestamp(conversation.last_message_time)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col bg-zinc-950">
          {/* Chat header */}
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                <span className="text-zinc-300 font-semibold">
                  {getOtherParticipant(
                    conversations.find(c => c.id === selectedChat) as Conversation
                  ).slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="font-semibold text-zinc-100">
                  {getOtherParticipant(
                    conversations.find(c => c.id === selectedChat) as Conversation
                  )}
                </h2>
                <p className="text-sm text-zinc-400">Online</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-zinc-950">
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </div>

          {/* Message input */}
          <form onSubmit={sendMessage} className="p-4 border-t border-zinc-800 bg-zinc-950">
            <div className="flex items-center space-x-2">
              <FileUpload
                onFileSelect={setSelectedFile}
                selectedFile={selectedFile}
                onClear={() => setSelectedFile(null)}
              />
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-zinc-900 rounded-lg py-3 px-4 focus:outline-none focus:ring-1 focus:ring-zinc-700 text-zinc-100 placeholder-zinc-500"
                disabled={sending}
              />
              <button
                type="submit"
                className="text-zinc-400 hover:text-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed p-2"
                disabled={sending || (!newMessage.trim() && !selectedFile)}
              >
                {sending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 bg-zinc-950">
          <h3 className="text-xl font-semibold mb-4 text-zinc-300">Select a conversation</h3>
          <p className="text-zinc-400 mb-4">or start a new one</p>
          <button
            onClick={() => setShowNewChat(true)}
            className="bg-zinc-800 text-zinc-100 px-6 py-2 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            New Message
          </button>
        </div>
      )}
    </div>
  );
}