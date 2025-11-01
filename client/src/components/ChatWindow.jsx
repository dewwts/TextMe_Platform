import { useState, useEffect, useRef } from 'react';
import socket from '../socket';
import Button from './Button';

function ChatWindow({ user, chatType, targetId, targetName, targetUserId, targetSocketId }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messagesEndRef = useRef(null);

  // Auto-scroll ไปข้อความล่าสุด
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // โหลดประวัติการแชทเมื่อเปิดหน้าต่างใหม่
  useEffect(() => {
    setMessages([]);
    setIsLoadingHistory(true);

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

  // (R6, R7, R11) ส่งข้อความ
  const handleSendMessage = (e) => {
    e.preventDefault();
    const trimmedMessage = inputMessage.trim();

    if (!trimmedMessage) return;

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
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Chat Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center shadow-sm">
        <div className="w-12 h-12 bg-blue-600 dark:bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold mr-4 text-lg">
          {chatType === 'private' ? targetName.charAt(0).toUpperCase() : '#'}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{targetName}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {chatType === 'private' ? 'Private Chat' : 'Group Chat'}
          </p>
        </div>
      </div>

      {/* Messages Container (R6) */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {isLoadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-500 mx-auto"></div>
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
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-xl ${
                    isOwnMessage
                      ? 'bg-blue-600 dark:bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700 shadow-sm'
                  }`}
                >
                  {!isOwnMessage && chatType === 'group' && (
                    <p className="text-xs font-semibold mb-1 text-blue-600 dark:text-blue-400">
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
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Box (R6) */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 shadow-sm">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-1 focus:ring-blue-600 dark:focus:ring-blue-500 focus:border-blue-600 dark:focus:border-blue-500 outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            disabled={isLoadingHistory}
          />
          <Button
            type="submit"
            disabled={isLoadingHistory}
            variant="primary"
            size="md"
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}

export default ChatWindow;
