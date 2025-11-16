import { useState, useEffect } from 'react';
import socket from './socket';
import Login from './components/Login';
import Register from './components/Register';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { login as loginAPI, register as registerAPI, verifyToken } from './api/auth';

function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null); // { id, username, email }
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'
  const [isLoading, setIsLoading] = useState(true);

  // Chat State
  const [activeUsers, setActiveUsers] = useState([]);
  const [groupList, setGroupList] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  // activeChat format: { type: 'private', targetId: socketId/userId, targetName: username, targetSocketId: socketId }
  // หรือ { type: 'group', targetId: groupName, targetName: groupName }

  // Mobile sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // เช็ค Token เมื่อ Load หน้าครั้งแรก
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const result = await verifyToken(token);
          if (result.success) {
            setUser(result.user);
            setIsAuthenticated(true);

            // เชื่อมต่อ Socket และ Authenticate
            socket.emit('authenticate', {
              userId: result.user.id,
              username: result.user.username
            });
          } else {
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          localStorage.removeItem('token');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Socket Event Listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    // (R4) รับรายชื่อ Active Users
    socket.on('update_user_list', (users) => {
      // กรอง user ตัวเองออก
      // setActiveUsers(users.filter(u => u.userId !== user.id));
      setActiveUsers(users); // รวมตัวเองด้วย
    });

    // (R9) รับรายชื่อ Groups
    socket.on('update_group_list', (groups) => {
      setGroupList(groups);
    });

    // Notification Sound และ Browser Notification เมื่อได้รับข้อความใหม่
    socket.on('receive_message', (data) => {
      // เช็คว่าข้อความนี้มาหาเราหรือไม่ และเราไม่ได้เปิดหน้าต่างแชทนั้นอยู่
      const isForMe = (
        (data.type === 'private' && data.toUserId === user.id) ||
        (data.type === 'group' && data.fromUserId !== user.id)
      );

      const isCurrentChatOpen = (
        (data.type === 'private' && activeChat?.type === 'private' && activeChat?.targetUserId === data.fromUserId) ||
        (data.type === 'group' && activeChat?.type === 'group' && activeChat?.targetId === data.groupName)
      );

      if (isForMe && !isCurrentChatOpen) {
        // เล่นเสียง Notification
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ0PVqzn77BdGAg+ltryxnMnBSuBzvLZiTYIGWe77OWfTRANUKbh8LdjHAU5kdj0zHksBSR3yPDekD8KFV6z6OyoVRQKRp/g8r9sIQUxh9Hz04IzBh5uwO/jmVENEFas5++wXRgIPpba88Z0JwYqgs/y2Yo3CBpnu+3moU4ND1Go4/C4ZBsEOI/Y88x5KwYldsvy2pI8CRResujuqFYUC0Wf4fK/bSEFMYfR89WDMgYeb8Lv4ppTDRBWr+rysFwYBzuW2vPIdSYGKoLA8tmKNggcZ73u56FQCxBRp+Pwt2QbBDmP2PPNeiwGI3fM8dySPQkUXbPn76pWFApFnuPzwW0hBTCH0fPWgjIFH27C7OWbVA0PVbDq8rBbGAc7ltrzyn0pBSqBzvPajDUIF2W+++mjTgsMUKXi8bllHAU7kNn0z3wqBSJ2yvPekj8HE12z6O2pVhMKQ53j88NsIgQvhdPz1YQxBR9txO/mnFQND1Sw6/KxWxcHOpbc88p9KQUqgdDz2ow1CBdlu/DqpE4LDFCl4fG5ZRwFO5DZ9M98KgUhdsrz3pI/CRNds+nwqVYTCkOd4/PDbCIFL4bT89WCMQYZY8Pv5p1TDQ9TsOvzslwWBzuV3fPLfykGKYHQ89yNNQgWZLvw66RNCw1RpOLxt2UcBDuP2fTPfSsGInXK8t+SQAkTXbPp8KlWEgpDnOTzw20iBi+G0/PWgjEGGWPD7+edUw0PU7Ds87JcFgY7ld3zzH8pBimB0PPcjTYIFmS68OulTQsNUqTi8rdlHAQ7j9n0z34rBiJ1y/Lfk0AJE1+z6fCqVhIJQpzk88NuIgYvhtPz1oQxBhlkw+/onlMOEFOw7POzXBYGO5Xe882AKgYogM7z3I02CRVjuO/rpU0KDFL+/v7');
        audio.volume = 0.3;
        audio.play().catch(e => console.log('Audio play failed:', e));

        // แสดง Browser Notification (ถ้าได้รับอนุญาต)
        if ('Notification' in window && Notification.permission === 'granted') {
          const title = data.type === 'private' ? data.from : `${data.from} in ${data.groupName}`;
          new Notification(title, {
            body: data.message,
            icon: '/vite.svg',
            tag: data.type === 'private' ? data.fromUserId : data.groupName
          });
        }
      }
    });

    // ขออนุญาตแสดง Notification
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      socket.off('update_user_list');
      socket.off('update_group_list');
      socket.off('receive_message');
    };
  }, [isAuthenticated, user, activeChat]);

  // Handle Login
  const handleLogin = async (username, password) => {
    const result = await loginAPI(username, password);
    if (result.success) {
      localStorage.setItem('token', result.token);
      setUser(result.user);
      setIsAuthenticated(true);

      // เชื่อมต่อ Socket และ Authenticate
      socket.emit('authenticate', {
        userId: result.user.id,
        username: result.user.username
      });
    } else {
      throw new Error(result.message);
    }
  };

  // Handle Register
  const handleRegister = async (username, email, password) => {
    const result = await registerAPI(username, email, password);
    if (result.success) {
      localStorage.setItem('token', result.token);
      setUser(result.user);
      setIsAuthenticated(true);

      // เชื่อมต่อ Socket และ Authenticate
      socket.emit('authenticate', {
        userId: result.user.id,
        username: result.user.username
      });
    } else {
      throw new Error(result.message);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    socket.disconnect();
    window.location.reload();
  };

  // (R5) ฟังก์ชันเปิดหน้าต่างแชท
  const handleOpenChat = (type, targetId, targetName, targetUserId, targetSocketId) => {
    setActiveChat({
      type,
      targetId,
      targetName,
      targetUserId, // สำหรับ private chat
      targetSocketId // สำหรับ private chat
    });
    // ปิด sidebar บนมือถือเมื่อเลือกแชท
    setIsSidebarOpen(false);
  };

  // (R8) ฟังก์ชันสร้างกลุ่ม
  const handleCreateGroup = (groupName) => {
    socket.emit('create_group', groupName);
    // เปิดหน้าต่างแชทกลุ่มทันที
    handleOpenChat('group', groupName, groupName);
  };

  // (R10) ฟังก์ชัน Join กลุ่ม
  const handleJoinGroup = (groupName) => {
    socket.emit('join_group', groupName);
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#e45b8f] dark:border-[#e45b8f] mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading Simple Chat...</p>
        </div>
      </div>
    );
  }

  // ถ้ายังไม่ได้ Login ให้แสดงหน้า Auth
  if (!isAuthenticated) {
    if (authView === 'login') {
      return (
        <Login
          onLogin={handleLogin}
          onSwitchToRegister={() => setAuthView('register')}
        />
      );
    } else {
      return (
        <Register
          onRegister={handleRegister}
          onSwitchToLogin={() => setAuthView('login')}
        />
      );
    }
  }

  // Main Chat Interface
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden relative">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - แสดง Active Users และ Groups */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-50
        w-80 flex-shrink-0
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <Sidebar
          user={user}
          activeUsers={activeUsers}
          groupList={groupList}
          onOpenChat={handleOpenChat}
          onCreateGroup={handleCreateGroup}
          onJoinGroup={handleJoinGroup}
          onLogout={handleLogout}
          activeChat={activeChat}
          onCloseSidebar={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Chat Window - แสดงหน้าต่างแชท */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {activeChat ? (
          <ChatWindow
            user={user}
            chatType={activeChat.type}
            targetId={activeChat.targetId}
            targetName={activeChat.targetName}
            targetUserId={activeChat.targetUserId}
            targetSocketId={activeChat.targetSocketId}
            onOpenSidebar={() => setIsSidebarOpen(true)}
          />
        ) : (
          <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
            {/* Mobile Header with Menu Button */}
            <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Empty State */}
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center px-4">
                <svg className="mx-auto h-16 w-16 md:h-20 md:w-20 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="mt-4 text-base md:text-lg font-semibold text-gray-900 dark:text-white">No chat selected</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Choose a conversation to start chatting</p>
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="mt-4 md:hidden px-4 py-2 bg-[#e45b8f] text-white rounded-lg hover:bg-[#d04a7e] transition-colors"
                >
                  Open Chats
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
