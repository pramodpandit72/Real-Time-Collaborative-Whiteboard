import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { roomService } from '../services/roomService';
import {
  Plus, LogOut, Moon, Sun, Users, Calendar, Copy, Check,
  Trash2, ArrowRight, Loader2, Search, X, Pen, Lock,
  LayoutGrid, Clock, Sparkles, ChevronRight
} from 'lucide-react';

const Dashboard = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [roomPassword, setRoomPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await roomService.getMyRooms();
      setRooms(response.data.rooms);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    setActionLoading(true);
    setError('');

    try {
      const response = await roomService.createRoom({
        name: newRoomName,
        isPrivate,
        password: isPrivate ? roomPassword : undefined
      });

      setShowCreateModal(false);
      setNewRoomName('');
      setIsPrivate(false);
      setRoomPassword('');
      navigate(`/room/${response.data.room.roomId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!joinRoomId.trim()) return;

    setActionLoading(true);
    setError('');

    try {
      await roomService.joinRoom(joinRoomId.toUpperCase(), joinPassword);
      setShowJoinModal(false);
      setJoinRoomId('');
      setJoinPassword('');
      navigate(`/room/${joinRoomId.toUpperCase()}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join room');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!confirm('Are you sure you want to delete this room?')) return;

    try {
      await roomService.deleteRoom(roomId);
      setRooms(rooms.filter(r => r.roomId !== roomId));
    } catch (err) {
      console.error('Failed to delete room:', err);
    }
  };

  const copyRoomId = (roomId) => {
    navigator.clipboard.writeText(roomId);
    setCopiedId(roomId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.roomId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hostedRooms = filteredRooms.filter(r => r.host?._id === user?.id);
  const joinedRooms = filteredRooms.filter(r => r.host?._id !== user?.id);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Pen className="w-4 h-4 text-white" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white dark:border-gray-900" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                CollabBoard
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-all"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <div className="flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-gray-700">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.username} className="w-9 h-9 rounded-xl object-cover" />
                  ) : (
                    <span className="text-white font-semibold text-sm">
                      {user?.username?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{user?.username}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-all"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">{user?.username}</span> 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your boards and start collaborating</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800/80 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50">
                <LayoutGrid className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Boards</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{rooms.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800/80 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/50">
                <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Created by You</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {rooms.filter(r => r.host?._id === user?.id).length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800/80 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50">
                <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Joined Boards</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {rooms.filter(r => r.host?._id !== user?.id).length}
            </p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex gap-3">
            <button
              onClick={() => { setShowCreateModal(true); setError(''); }}
              className="group inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all text-sm"
            >
              <Plus className="w-5 h-5" />
              Create Board
            </button>
            <button
              onClick={() => { setShowJoinModal(true); setError(''); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-all text-sm"
            >
              <ArrowRight className="w-5 h-5" />
              Join Board
            </button>
          </div>

          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search boards..."
                className="w-full pl-11 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>

        {/* Rooms */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <LayoutGrid className="w-10 h-10 text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'No boards found' : 'No boards yet'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              {searchQuery
                ? 'Try a different search term'
                : 'Create your first whiteboard or join an existing one to start collaborating with your team.'
              }
            </p>
            {!searchQuery && (
              <button
                onClick={() => { setShowCreateModal(true); setError(''); }}
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all"
              >
                <Plus className="w-5 h-5" />
                Create Your First Board
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Hosted Rooms */}
            {hostedRooms.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Your Boards ({hostedRooms.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {hostedRooms.map((room) => (
                    <RoomCard
                      key={room._id}
                      room={room}
                      isHost={true}
                      copiedId={copiedId}
                      onCopy={copyRoomId}
                      onDelete={handleDeleteRoom}
                      onEnter={() => navigate(`/room/${room.roomId}`)}
                      getTimeAgo={getTimeAgo}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Joined Rooms */}
            {joinedRooms.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Joined Boards ({joinedRooms.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {joinedRooms.map((room) => (
                    <RoomCard
                      key={room._id}
                      room={room}
                      isHost={false}
                      copiedId={copiedId}
                      onCopy={copyRoomId}
                      onDelete={handleDeleteRoom}
                      onEnter={() => navigate(`/room/${room.roomId}`)}
                      getTimeAgo={getTimeAgo}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Create Room Modal */}
      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)} title="Create New Board">
          {error && <ErrorBanner message={error} />}
          <form onSubmit={handleCreateRoom} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Board Name
              </label>
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Sprint Planning Board"
                required
                autoFocus
              />
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <button
                type="button"
                onClick={() => setIsPrivate(!isPrivate)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  isPrivate ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                  isPrivate ? 'translate-x-5.5 left-0.5' : 'left-0.5'
                }`}
                  style={{ transform: isPrivate ? 'translateX(22px)' : 'translateX(2px)' }}
                />
              </button>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Lock className="w-4 h-4" />
                  Private Board
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Require a password to join</p>
              </div>
            </div>

            {isPrivate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Board Password
                </label>
                <input
                  type="password"
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter a password"
                  required={isPrivate}
                />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 px-4 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2"
              >
                {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                Create
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Join Room Modal */}
      {showJoinModal && (
        <Modal onClose={() => setShowJoinModal(false)} title="Join a Board">
          {error && <ErrorBanner message={error} />}
          <form onSubmit={handleJoinRoom} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Board ID
              </label>
              <input
                type="text"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono uppercase tracking-wider"
                placeholder="ABCD1234"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password <span className="text-gray-400 font-normal">(if private)</span>
              </label>
              <input
                type="password"
                value={joinPassword}
                onChange={(e) => setJoinPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter password (optional)"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowJoinModal(false)}
                className="flex-1 py-3 px-4 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2"
              >
                {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                Join
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

/* ───────────── Sub-components ───────────── */

const RoomCard = ({ room, isHost, copiedId, onCopy, onDelete, onEnter, getTimeAgo }) => (
  <div className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800/80 hover:border-blue-200 dark:hover:border-blue-900/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 overflow-hidden">
    {/* Gradient top accent */}
    <div className={`h-1.5 ${isHost ? 'bg-gradient-to-r from-blue-500 to-violet-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'}`} />

    <div className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{room.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            {isHost && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-md">
                Host
              </span>
            )}
            {room.isPrivate && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-md">
                <Lock className="w-3 h-3" />
                Private
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Room ID */}
      <div className="flex items-center gap-2 mb-4">
        <code className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs font-mono text-gray-600 dark:text-gray-400 truncate">
          {room.roomId}
        </code>
        <button
          onClick={() => onCopy(room.roomId)}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
          title="Copy Room ID"
        >
          {copiedId === room.roomId
            ? <Check className="w-4 h-4 text-emerald-500" />
            : <Copy className="w-4 h-4" />
          }
        </button>
      </div>

      {/* Meta info */}
      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          <span>{room.participants?.length || 0} members</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>{getTimeAgo(room.createdAt)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onEnter}
          className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all"
        >
          Enter Board
          <ChevronRight className="w-4 h-4" />
        </button>
        {isHost && (
          <button
            onClick={() => onDelete(room.roomId)}
            className="p-2.5 border border-red-200/80 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 dark:text-red-400 rounded-xl transition"
            title="Delete Board"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  </div>
);

const Modal = ({ onClose, title, children }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
    <div
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full border border-gray-200/80 dark:border-gray-800/80"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between p-6 pb-0">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  </div>
);

const ErrorBanner = ({ message }) => (
  <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-center gap-2">
    <X className="w-4 h-4 flex-shrink-0" />
    {message}
  </div>
);

export default Dashboard;
