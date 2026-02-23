import { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { X, Crown, UserX, Shield, User } from 'lucide-react';

const ParticipantsPanel = ({ room, activeUsers, userRole, currentUserId, onClose }) => {
  const { kickUser, updateSettings } = useSocket();
  const [showConfirmKick, setShowConfirmKick] = useState(null);

  const getParticipantRole = (userId) => {
    const participant = room?.participants?.find(p => 
      (p.user?._id || p.user) === userId
    );
    return participant?.role || 'participant';
  };

  const isUserOnline = (userId) => {
    return activeUsers.some(u => u._id === userId);
  };

  const handleKick = (userId) => {
    kickUser(room.roomId, userId);
    setShowConfirmKick(null);
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
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto">
        {/* Online Users */}
        <div className="p-4">
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-3">
            Online ({activeUsers.length})
          </h4>
          <div className="space-y-2">
            {activeUsers.map((user) => (
              <ParticipantItem
                key={user._id}
                user={user}
                role={getParticipantRole(user._id)}
                isOnline={true}
                isCurrentUser={user._id === currentUserId}
                canKick={userRole === 'host' && user._id !== currentUserId}
                showConfirmKick={showConfirmKick === user._id}
                onKickClick={() => setShowConfirmKick(user._id)}
                onKickConfirm={() => handleKick(user._id)}
                onKickCancel={() => setShowConfirmKick(null)}
              />
            ))}
          </div>
        </div>

        {/* Offline Users */}
        {participants.filter(p => !isUserOnline(p.user?._id || p.user)).length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-3">
              Offline
            </h4>
            <div className="space-y-2">
              {participants
                .filter(p => !isUserOnline(p.user?._id || p.user))
                .map((participant) => {
                  const userId = participant.user?._id || participant.user;
                  const userData = participant.user || { _id: userId, username: 'Unknown' };
                  return (
                    <ParticipantItem
                      key={userId}
                      user={userData}
                      role={participant.role}
                      isOnline={false}
                      isCurrentUser={userId === currentUserId}
                      canKick={userRole === 'host' && userId !== currentUserId}
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
  return (
    <div className={`flex items-center gap-3 p-2 rounded-lg ${
      isCurrentUser ? 'bg-blue-50 dark:bg-blue-900/20' : ''
    }`}>
      {/* Avatar */}
      <div className="relative">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
          {user.avatar ? (
            <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
          ) : (
            <User className="w-5 h-5 text-gray-500" />
          )}
        </div>
        {/* Online indicator */}
        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
          isOnline ? 'bg-green-500' : 'bg-gray-400'
        }`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {user.username}
            {isCurrentUser && <span className="text-gray-500 dark:text-gray-400"> (you)</span>}
          </p>
          {role === 'host' && (
            <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
          {role}
        </p>
      </div>

      {/* Actions */}
      {canKick && !showConfirmKick && (
        <button
          onClick={onKickClick}
          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900 text-red-500 rounded transition"
          title="Kick user"
        >
          <UserX className="w-4 h-4" />
        </button>
      )}

      {showConfirmKick && (
        <div className="flex items-center gap-1">
          <button
            onClick={onKickConfirm}
            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
          >
            Kick
          </button>
          <button
            onClick={onKickCancel}
            className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default ParticipantsPanel;
