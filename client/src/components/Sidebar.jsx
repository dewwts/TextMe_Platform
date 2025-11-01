import { useState, useEffect } from 'react';
import socket from '../socket';
import Button from './Button';
import { useTheme } from '../contexts/ThemeContext';

function Sidebar({
  user,
  activeUsers,
  groupList,
  onOpenChat,
  onCreateGroup,
  onJoinGroup,
  onLogout,
  activeChat,
  onCloseSidebar
}) {
  const { isDark, toggleTheme } = useTheme();
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({ private: [], group: [] });

  // รับข้อมูล Unread Counts จาก Server
  useEffect(() => {
    socket.on('unread_counts', (counts) => {
      console.log('[CLIENT] Received unread_counts:', counts);
      setUnreadCounts(counts);
    });

    return () => {
      socket.off('unread_counts');
    };
  }, []);

  // (R8) สร้างกลุ่มใหม่
  const handleCreateGroup = (e) => {
    e.preventDefault();
    const trimmedName = newGroupName.trim();
    if (trimmedName) {
      onCreateGroup(trimmedName);
      setNewGroupName('');
      setShowCreateGroup(false);
    }
  };

  // (R10) Join กลุ่ม และเปิดหน้าต่างแชท
  const handleGroupClick = (group) => {
    // เช็คว่าเรา Join กลุ่มนี้แล้วหรือยัง
    const isJoined = group.members.includes(user.username);

    if (!isJoined) {
      onJoinGroup(group.groupName);
    }

    // เปิดหน้าต่างแชท
    onOpenChat('group', group.groupName, group.groupName);
  };

  // (R7) เปิดหน้าต่าง Private Chat
  const handleUserClick = (otherUser) => {
    onOpenChat('private', otherUser.socketId, otherUser.username, otherUser.userId, otherUser.socketId);
  };

  return (
    <div className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 bg-[#e45b8f] dark:bg-[#d04a7e] text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            {/* Close button for mobile */}
            <button
              onClick={onCloseSidebar}
              className="md:hidden p-1 rounded-lg hover:bg-[#d04a7e] dark:hover:bg-[#c93b6d] transition-colors flex-shrink-0"
              aria-label="Close sidebar"
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <svg className="h-7 w-7 md:h-8 md:w-8 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg md:text-xl font-bold truncate">CU TextMe</h2>
              <p className="text-xs md:text-sm text-pink-100 truncate">@{user.username}</p>
            </div>
          </div>
          <Button
            onClick={onLogout}
            variant="secondary"
            size="sm"
            className="!bg-white !text-[#e45b8f] hover:!bg-pink-50 dark:!bg-gray-800 dark:!text-[#e45b8f] dark:hover:!bg-gray-700 flex-shrink-0 !text-xs md:!text-sm !px-2 md:!px-3"
          >
            Logout
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-pink-100 font-medium">Theme</span>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-[#d04a7e] dark:hover:bg-[#c93b6d] transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Active Users Section (R4) */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Active Users ({activeUsers.length})
          </h3>

          <div className="space-y-1">
            {activeUsers.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic">No other users online</p>
            ) : (
              activeUsers.map((otherUser) => {
                // หา Unread Count สำหรับ User นี้
                const unread = unreadCounts.private.find(u => u.userId === otherUser.userId);
                const unreadCount = unread ? unread.count : 0;

                // Debug log
                if (unreadCount > 0) {
                  console.log('[BADGE] User:', otherUser.username, 'Unread:', unreadCount);
                }

                return (
                  <button
                    key={otherUser.socketId}
                    onClick={() => handleUserClick(otherUser)}
                    className={`w-full text-left px-3 py-2 rounded-xl hover:bg-pink-50 dark:hover:bg-gray-800 transition flex items-center justify-between ${
                      activeChat?.type === 'private' && activeChat?.targetUserId === otherUser.userId
                        ? 'bg-pink-100 dark:bg-gray-800 border border-pink-200 dark:border-gray-700'
                        : 'border border-transparent'
                    }`}
                  >
                    <div className="flex items-center flex-1">
                      <div className="w-10 h-10 bg-[#e45b8f] rounded-full flex items-center justify-center text-white font-semibold mr-3 text-base">
                        {otherUser.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{otherUser.username}</span>
                    </div>
                    {unreadCount > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Groups Section (R9) */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Groups ({groupList.length})
            </h3>
            <button
              onClick={() => setShowCreateGroup(!showCreateGroup)}
              className="text-[#e45b8f] dark:text-[#e45b8f] hover:text-[#d04a7e] dark:hover:text-[#f06fa0] text-sm font-semibold"
            >
              + Create
            </button>
          </div>

          {/* Create Group Form (R8) */}
          {showCreateGroup && (
            <form onSubmit={handleCreateGroup} className="mb-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Group name"
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-1 focus:ring-[#e45b8f] focus:border-[#e45b8f] outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#e45b8f] dark:bg-[#e45b8f] text-white text-sm rounded-xl hover:bg-[#d04a7e] dark:hover:bg-[#d04a7e] font-medium transition flex-shrink-0"
                >
                  Create
                </button>
              </div>
            </form>
          )}

          <div className="space-y-1">
            {groupList.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic">No groups yet</p>
            ) : (
              groupList.map((group) => {
                const isJoined = group.members.includes(user.username);
                // หา Unread Count สำหรับ Group นี้
                const unread = unreadCounts.group.find(g => g.groupName === group.groupName);
                const unreadCount = unread ? unread.count : 0;

                return (
                  <button
                    key={group.groupName}
                    onClick={() => handleGroupClick(group)}
                    className={`w-full text-left px-3 py-2 rounded-xl hover:bg-pink-50 dark:hover:bg-gray-800 transition ${
                      activeChat?.type === 'group' && activeChat?.targetId === group.groupName
                        ? 'bg-pink-100 dark:bg-gray-800 border border-pink-200 dark:border-gray-700'
                        : 'border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <div className="w-10 h-10 bg-[#e45b8f] rounded-full flex items-center justify-center text-white font-semibold mr-3 text-lg">
                          #
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">{group.groupName}</span>
                            {!isJoined && (
                              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                                Not joined
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{group.memberCount} members</p>
                        </div>
                      </div>
                      {unreadCount > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
