import { useState, useEffect } from 'react';
import socket from '../socket';
import Button from './Button';
import Toggle from './Toggle';
import { useTheme } from '../contexts/ThemeContext';

function Sidebar({
  user,
  activeUsers,
  groupList,
  onOpenChat,
  onCreateGroup,
  onJoinGroup,
  onLogout,
  activeChat
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
    <div className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 bg-blue-600 dark:bg-blue-700 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <div>
              <h2 className="text-xl font-bold">Simple Chat</h2>
              <p className="text-sm text-blue-100">@{user.username}</p>
            </div>
          </div>
          <Button
            onClick={onLogout}
            variant="secondary"
            size="sm"
            className="!bg-white !text-blue-600 hover:!bg-blue-50 dark:!bg-gray-800 dark:!text-blue-400 dark:hover:!bg-gray-700"
          >
            Logout
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-blue-100">Theme</span>
          <Toggle
            enabled={isDark}
            onChange={toggleTheme}
            label={isDark ? '🌙' : '☀️'}
            size="sm"
          />
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
                    className={`w-full text-left px-3 py-2 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-800 transition flex items-center justify-between ${
                      activeChat?.type === 'private' && activeChat?.targetUserId === otherUser.userId
                        ? 'bg-blue-100 dark:bg-gray-800 border border-blue-200 dark:border-gray-700'
                        : 'border border-transparent'
                    }`}
                  >
                    <div className="flex items-center flex-1">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold mr-3 text-base">
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
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-semibold"
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
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-1 focus:ring-blue-600 focus:border-blue-600 outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 dark:hover:bg-blue-700 font-medium transition"
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
                    className={`w-full text-left px-3 py-2 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-800 transition ${
                      activeChat?.type === 'group' && activeChat?.targetId === group.groupName
                        ? 'bg-blue-100 dark:bg-gray-800 border border-blue-200 dark:border-gray-700'
                        : 'border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold mr-3 text-lg">
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
