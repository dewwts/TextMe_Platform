import { useState, useEffect, useRef } from 'react';
import socket from '../socket';
import Button from './Button';

function ChatWindow({ user, chatType, targetId, targetName, targetUserId, targetSocketId, onOpenSidebar }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [showGroupMembers, setShowGroupMembers] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll ไปข้อความล่าสุด
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, typingUsers]);

  // ดึงรายชื่อสมาชิกในกลุ่ม
  useEffect(() => {
    if (chatType === 'group' && targetId) {
      socket.emit('get_group_members', targetId);

      const handleGroupMembers = (data) => {
        if (data.groupName === targetId) {
          setGroupMembers(data.members);
        }
      };

      socket.on('group_members', handleGroupMembers);

      // Update members when group list updates
      socket.on('update_group_list', () => {
        socket.emit('get_group_members', targetId);
      });

      return () => {
        socket.off('group_members', handleGroupMembers);
        socket.off('update_group_list');
      };
    }
  }, [chatType, targetId]);

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
          setMessages((prev) => [...prev, data]);

          // Mark as read เมื่อรับข้อความใหม่ (ถ้าหน้าต่างแชทนี้เปิดอยู่)
          if (data.fromUserId !== user.id) {
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
            {chatType === 'private' ? 'Private' : `Group • ${groupMembers.length} members`}
          </p>
        </div>

        {/* Group Members Button */}
        {chatType === 'group' && (
          <button
            onClick={() => setShowGroupMembers(true)}
            className="ml-2 p-2 md:p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
            aria-label="View members"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>
        )}
      </div>

      {/* Group Members Modal */}
      {showGroupMembers && chatType === 'group' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowGroupMembers(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-[#e45b8f] dark:bg-[#d04a7e] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">{targetName}</h3>
                <p className="text-sm text-pink-100 mt-0.5">{groupMembers.length} members</p>
              </div>
              <button
                onClick={() => setShowGroupMembers(false)}
                className="p-2 rounded-lg hover:bg-[#d04a7e] dark:hover:bg-[#c93b6d] transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Members List */}
            <div className="overflow-y-auto max-h-[calc(80vh-100px)]">
              {groupMembers.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="font-medium">No members in this group</p>
                </div>
              ) : (
                <div className="px-4 py-3">
                  {groupMembers.map((member, index) => (
                    <div
                      key={member.socketId || index}
                      className="flex items-center px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition"
                    >
                      <div className="w-12 h-12 bg-[#e45b8f] dark:bg-[#e45b8f] rounded-full flex items-center justify-center text-white font-semibold text-lg mr-3 flex-shrink-0">
                        {member.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {member.username}
                          {member.userId === user.id && <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">(You)</span>}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Online</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
