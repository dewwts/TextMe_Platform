import { useState, useEffect, useRef } from 'react';
import socket from '../socket';
import Button from './Button';

function ChatWindow({ user, chatType, targetId, targetName, targetUserId, targetSocketId, onOpenSidebar }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll ไปข้อความล่าสุด
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, typingUsers]);

  // โหลดประวัติการแชทเมื่อเปิดหน้าต่างใหม่
  useEffect(() => {
    setMessages([]);
    setIsLoadingHistory(true);
    setTypingUsers(new Set());
    setIsTyping(false);

    if (chatType === 'private' && targetUserId) {
      // โหลดประวัติการแชทแบบ Private
      socket.emit('load_private_history', {
        userId: user.id,
        otherUserId: targetUserId
      });

      // Mark messages as read
      socket.emit('mark_private_read', {
        userId: user.id,
        otherUserId: targetUserId
      });

      // รับประวัติการแชท
      const handlePrivateHistory = (data) => {
        if (data.otherUserId === targetUserId) {
          const formattedMessages = data.messages.map(msg => ({
            message: msg.message,
            from: msg.fromUserId === user.id ? 'You' : msg.from,
            fromUserId: msg.fromUserId,
            toUserId: msg.toUserId,
            type: 'private',
            timestamp: msg.timestamp
          }));
          setMessages(formattedMessages);
          setIsLoadingHistory(false);
        }
      };

      socket.on('private_history', handlePrivateHistory);

      return () => {
        socket.off('private_history', handlePrivateHistory);
      };
    } else if (chatType === 'group' && targetId) {
      // โหลดประวัติการแชทแบบ Group
      socket.emit('load_group_history', {
        groupName: targetId
      });

      // Mark messages as read
      socket.emit('mark_group_read', {
        userId: user.id,
        groupName: targetId
      });

      // รับประวัติการแชท
      const handleGroupHistory = (data) => {
        if (data.groupName === targetId) {
          const formattedMessages = data.messages.map(msg => ({
            message: msg.message,
            from: msg.fromUserId === user.id ? 'You' : msg.from,
            fromUserId: msg.fromUserId,
            groupName: msg.groupName,
            type: 'group',
            timestamp: msg.timestamp
          }));
          setMessages(formattedMessages);
          setIsLoadingHistory(false);
        }
      };

      socket.on('group_history', handleGroupHistory);

      return () => {
        socket.off('group_history', handleGroupHistory);
      };
    } else {
      setIsLoadingHistory(false);
    }
  }, [chatType, targetId, targetUserId, user.id]);

  // Listen for typing indicators
  useEffect(() => {
    const handleShowTypingBubble = ({ fromUsername, fromUserId }) => {
      if (chatType === 'private' && fromUserId === targetUserId) {
        setIsTyping(true);
      } else if (chatType === 'group') {
        setTypingUsers(prev => new Set([...prev, fromUsername]));
      }
    };

    const handleHideTypingBubble = ({ fromUsername, fromUserId }) => {
      if (chatType === 'private' && fromUserId === targetUserId) {
        setIsTyping(false);
      } else if (chatType === 'group') {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(fromUsername);
          return newSet;
        });
      }
    };

    socket.on('show_typing_bubble', handleShowTypingBubble);
    socket.on('hide_typing_bubble', handleHideTypingBubble);

    return () => {
      socket.off('show_typing_bubble', handleShowTypingBubble);
      socket.off('hide_typing_bubble', handleHideTypingBubble);
    };
  }, [chatType, targetId, targetUserId]);

  // (R6) รับข้อความใหม่จาก Server แบบ Real-time
  useEffect(() => {
    const handleReceiveMessage = (data) => {
      // กรองข้อความให้ตรงกับห้องที่เปิดอยู่
      if (chatType === 'private') {
        // Private: เช็คว่าเป็นข้อความจาก/ไปยัง targetUserId
        if (
          (data.type === 'private' && data.fromUserId === targetUserId) ||
          (data.type === 'private' && data.toUserId === targetUserId)
        ) {

          setMessages((prev) => [...prev, data]);
          
          // Mark as read เมื่อรับข้อความใหม่ (ถ้าหน้าต่างแชทนี้เปิดอยู่)
          if (data.fromUserId === targetUserId) {
            socket.emit('mark_private_read', {
              userId: user.id,
              otherUserId: targetUserId
            });
          }
        }
      } else if (chatType === 'group') {
        // Group: เช็คว่าข้อความมาจากกลุ่มที่ถูกต้อง
        if (data.type === 'group' && data.groupName === targetId) {
          //check if own message 
          const isOwn = data.fromUserId === user.id;
          const message = {
            ...data,
            from: isOwn ? 'You' : data.from,
            isOwnMessage: isOwn
          };

          setMessages((prev) => [...prev, message]);
          console.log(data);
          // Mark as read เมื่อรับข้อความใหม่ (ถ้าหน้าต่างแชทนี้เปิดอยู่)
          if (data.groupName === targetUserId) {
            socket.emit('mark_group_read', {
              userId: user.id,
              groupName: targetId
            });
          }
        }
      }
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [chatType, targetId, targetUserId, user.id]);

  // Handle typing indicator - practical approach
  const handleTyping = (e) => {
    const value = e.target.value;
    setInputMessage(value);

    // Determine target for typing event
    const targetRoom = chatType === 'private' ? targetUserId : targetId;

    // 1. ส่ง 'typing_start' ถ้ายังไม่ได้ส่ง (typingTimeoutRef.current เป็น null)
    if (!typingTimeoutRef.current && value.trim()) {
      socket.emit('typing_start', {
        targetId: targetRoom,
        chatType
      });
    }

    // 2. เคลียร์ timeout เก่า (ถ้ามี)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // 3. ถ้า input ว่าง ส่ง stop ทันที
    if (!value.trim()) {
      socket.emit('typing_stop', {
        targetId: targetRoom,
        chatType
      });
      typingTimeoutRef.current = null;
      return;
    }

    // 4. ตั้ง timeout ใหม่ - ส่ง stop หลังจากหยุดพิมพ์ 2 วินาที
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', {
        targetId: targetRoom,
        chatType
      });
      typingTimeoutRef.current = null; // รีเซ็ตสถานะ
    }, 2000);
  };

  // (R6, R7, R11) ส่งข้อความ
  const handleSendMessage = (e) => {
    e.preventDefault();
    const trimmedMessage = inputMessage.trim();

    if (!trimmedMessage) return;

    // Clear typing timeout and emit stopped typing
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    const targetRoom = chatType === 'private' ? targetUserId : targetId;
    socket.emit('typing_stop', {
      targetId: targetRoom,
      chatType
    });

    if (chatType === 'private') {
      // (R7) ส่งข้อความส่วนตัว
      socket.emit('send_private_message', {
        toSocketId: targetSocketId,
        toUserId: targetUserId,
        message: trimmedMessage
      });
    } else if (chatType === 'group') {
      // (R11) ส่งข้อความในกลุ่ม
      socket.emit('send_group_message', {
        groupName: targetId,
        message: trimmedMessage
      });
    }

    setInputMessage('');
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 h-full min-h-0 overflow-hidden">
      {/* Chat Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-2 md:px-6 py-2 md:py-4 flex items-center shadow-sm flex-shrink-0">
        {/* Mobile back button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onOpenSidebar) onOpenSidebar();
          }}
          type="button"
          className="md:hidden p-2 mr-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 transition-colors flex-shrink-0"
          aria-label="Back to chats"
        >
          <svg className="w-6 h-6 text-gray-700 dark:text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="w-9 h-9 md:w-12 md:h-12 bg-[#e45b8f] dark:bg-[#e45b8f] rounded-full flex items-center justify-center text-white font-semibold mr-2 md:mr-4 text-sm md:text-lg flex-shrink-0">
          {chatType === 'private' ? targetName.charAt(0).toUpperCase() : '#'}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm md:text-lg truncate">{targetName}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-none">
            {chatType === 'private' ? 'Private' : 'Group'}
          </p>
        </div>
      </div>

      {/* Messages Container (R6) */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 md:p-6 space-y-2 md:space-y-4 overscroll-behavior-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
        {isLoadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e45b8f] dark:border-[#e45b8f] mx-auto"></div>
              <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium">Loading chat history...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <svg className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">No messages yet</p>
              <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwnMessage = msg.from === 'You';
            return (
              <div
                key={index}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] md:max-w-xs lg:max-w-md px-3 md:px-4 py-2 md:py-3 rounded-xl ${
                    isOwnMessage
                      ? 'bg-[#e45b8f] dark:bg-[#e45b8f] text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700 shadow-sm'
                  }`}
                >
                  {!isOwnMessage && chatType === 'group' && (
                    <p className="text-xs font-semibold mb-1 text-[#e45b8f] dark:text-[#e45b8f]">
                      {msg.from}
                    </p>
                  )}
                  <p className="text-sm break-words">{msg.message}</p>
                  {msg.timestamp && (
                    <p className="text-xs mt-1 opacity-70">
                      {new Date(msg.timestamp).toLocaleTimeString('th-TH', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Typing Indicator */}
        {chatType === 'private' && isTyping && (
          <div className="flex justify-start">
            <div className="max-w-[75%] md:max-w-xs lg:max-w-md px-3 md:px-4 py-2 md:py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-1">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {chatType === 'group' && typingUsers.size > 0 && (
          <div className="flex justify-start">
            <div className="max-w-[75%] md:max-w-xs lg:max-w-md px-3 md:px-4 py-2 md:py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {Array.from(typingUsers).slice(0, 3).join(', ')} {typingUsers.size > 3 ? `and ${typingUsers.size - 3} more` : ''} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                </p>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Box (R6) */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-2 md:px-6 py-2 md:py-4 shadow-sm flex-shrink-0 relative z-10">
        <form onSubmit={handleSendMessage} className="flex gap-1.5 md:gap-3 items-center">
          <input
            type="text"
            value={inputMessage}
            onChange={handleTyping}
            placeholder="Type a message..."
            className="flex-1 px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-200 dark:border-gray-700 rounded-lg md:rounded-xl focus:ring-1 focus:ring-[#e45b8f] dark:focus:ring-[#e45b8f] focus:border-[#e45b8f] dark:focus:border-[#e45b8f] outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white touch-manipulation"
            disabled={isLoadingHistory}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
          <Button
            type="submit"
            disabled={isLoadingHistory}
            variant="primary"
            size="md"
            className="!px-3 md:!px-6 !text-sm md:!text-base !py-2"
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}

export default ChatWindow;
