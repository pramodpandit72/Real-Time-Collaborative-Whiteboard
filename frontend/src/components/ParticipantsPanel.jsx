import { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { X, Crown, UserX, Shield, User, Wifi, WifiOff } from 'lucide-react';

const ParticipantsPanel = ({ room, activeUsers, userRole, currentUserId, onClose }) => {
  const { kickUser } = useSocket();
  const [showConfirmKick, setShowConfirmKick] = useState(null);

  // Normalize user ID comparison (handles both _id and id formats)
  const isSameUser = (id1, id2) => {
    if (!id1 || !id2) return false;
    return String(id1) === String(id2);
  };

  const getParticipantRole = (userId) => {
    const participant = room?.participants?.find(p => {
      const pUserId = p.user?._id || p.user;
      return isSameUser(pUserId, userId);
    });
    return participant?.role || 'participant';
  };

  const isUserOnline = (userId) => {
    return activeUsers.some(u => isSameUser(u._id, userId));
  };

  const handleKick = (userId) => {
    kickUser(room.roomId, userId);
    setShowConfirmKick(null);
  };

  // Check if a user is the current user (handles both id and _id)
  const isCurrentUserCheck = (userId) => {
    return isSameUser(userId, currentUserId) || isSameUser(userId, room?.host?._id);
  };

  const participants = room?.participants || [];

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-white">Participants</h3>
          <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full">
            {activeUsers.length} online
          </span>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto">
        {/* Online Users */}
        <div className="p-4">
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-1.5">
            <Wifi className="w-3 h-3 text-emerald-500" />
            Online ({activeUsers.length})
          </h4>
          <div className="space-y-1">
            {activeUsers.map((user) => {
              const isMe = isSameUser(user._id, currentUserId);
              const userRole2 = getParticipantRole(user._id);
              // Host can ONLY kick others, never themselves
              const canKickUser = userRole === 'host' && !isMe && userRole2 !== 'host';
              
              return (
                <ParticipantItem
                  key={user._id}
                  user={user}
                  role={userRole2}
                  isOnline={true}
                  isCurrentUser={isMe}
                  canKick={canKickUser}
                  showConfirmKick={showConfirmKick === user._id}
                  onKickClick={() => setShowConfirmKick(user._id)}
                  onKickConfirm={() => handleKick(user._id)}
                  onKickCancel={() => setShowConfirmKick(null)}
                />
              );
            })}
          </div>
        </div>

        {/* Offline Users */}
        {participants.filter(p => !isUserOnline(p.user?._id || p.user)).length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-1.5">
              <WifiOff className="w-3 h-3 text-gray-400" />
              Offline
            </h4>
            <div className="space-y-1">
              {participants
                .filter(p => !isUserOnline(p.user?._id || p.user))
                .map((participant) => {
                  const userId = participant.user?._id || participant.user;
                  const userData = participant.user || { _id: userId, username: 'Unknown' };
                  const isMe = isSameUser(userId, currentUserId);
                  
                  return (
                    <ParticipantItem
                      key={userId}
                      user={userData}
                      role={participant.role}
                      isOnline={false}
                      isCurrentUser={isMe}
                      canKick={userRole === 'host' && !isMe && participant.role !== 'host'}
                      showConfirmKick={showConfirmKick === userId}
                      onKickClick={() => setShowConfirmKick(userId)}
                      onKickConfirm={() => handleKick(userId)}
                      onKickCancel={() => setShowConfirmKick(null)}
                    />
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ParticipantItem = ({ 
  user, 
  role, 
  isOnline, 
  isCurrentUser,
  canKick,
  showConfirmKick,
  onKickClick,
  onKickConfirm,
  onKickCancel
}) => {
  // Generate consistent avatar colors based on username
  const colors = [
    'from-blue-500 to-cyan-500',
    'from-violet-500 to-purple-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-amber-500',
    'from-rose-500 to-pink-500',
    'from-indigo-500 to-blue-500',
  ];
  const colorIndex = (user.username || '').charCodeAt(0) % colors.length;

  return (
    <div className={`flex items-center gap-3 p-2.5 rounded-xl transition ${
      isCurrentUser ? 'bg-blue-50/50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
    }`}>
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className={`w-9 h-9 bg-gradient-to-br ${colors[colorIndex]} rounded-xl flex items-center justify-center overflow-hidden shadow-sm`}>
          {user.avatar ? (
            <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white font-semibold text-sm">
              {(user.username || '?').charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        {/* Online indicator */}
        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
          isOnline ? 'bg-emerald-500' : 'bg-gray-400'
        }`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {user.username}
            {isCurrentUser && <span className="text-gray-400 dark:text-gray-500 font-normal"> (you)</span>}
          </p>
          {role === 'host' && (
            <Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
          {role}
        </p>
      </div>

      {/* Actions — only show kick for non-self, non-host participants */}
      {canKick && !showConfirmKick && (
        <button
          onClick={onKickClick}
          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-500 rounded-lg transition opacity-0 group-hover:opacity-100"
          title="Remove user"
          style={{ opacity: 1 }}
        >
          <UserX className="w-4 h-4" />
        </button>
      )}

      {showConfirmKick && (
        <div className="flex items-center gap-1">
          <button
            onClick={onKickConfirm}
            className="px-2.5 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
          >
            Kick
          </button>
          <button
            onClick={onKickCancel}
            className="px-2.5 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium"
          >
            No
          </button>
        </div>
      )}
    </div>
  );
};

export default ParticipantsPanel;
