import { useState, useRef, useEffect, useCallback } from 'react';
import { Video, VideoOff, Mic, MicOff, Maximize2, Minimize2 } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const CameraPanel = ({ roomId, onClose }) => {
  const [stream, setStream] = useState(null);
  const [isOn, setIsOn] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const frameInterval = useRef(null);
  const { socket } = useSocket();

  // Start camera
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, frameRate: 10 },
        audio: true
      });
      setStream(mediaStream);
      setIsOn(true);
      setError('');

      if (videoRef.current) videoRef.current.srcObject = mediaStream;

      // Mute audio by default
      mediaStream.getAudioTracks().forEach(t => t.enabled = false);

      // Start streaming frames
      startFrameCapture(mediaStream);

      // Notify others
      socket?.emit('camera-started', roomId);
    } catch (err) {
      setError(err.name === 'NotAllowedError' ? 'Camera permission denied' : 'Camera not available');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    stopFrameCapture();
    setIsOn(false);
    socket?.emit('camera-stopped', roomId);
  };

  const toggleMute = () => {
    if (stream) {
      const enabled = !isMuted;
      stream.getAudioTracks().forEach(t => t.enabled = !enabled);
      setIsMuted(enabled);
    }
  };

  // Stream video frames via socket
  const startFrameCapture = (mediaStream) => {
    const video = document.createElement('video');
    video.srcObject = mediaStream;
    video.play();

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    frameInterval.current = setInterval(() => {
      if (video.readyState >= 2 && socket?.connected) {
        canvas.width = 160;
        canvas.height = 120;
        ctx.drawImage(video, 0, 0, 160, 120);
        const frame = canvas.toDataURL('image/jpeg', 0.4);
        socket.emit('camera-frame', { roomId, frame });
      }
    }, 333); // ~3 FPS
  };

  const stopFrameCapture = () => {
    if (frameInterval.current) {
      clearInterval(frameInterval.current);
      frameInterval.current = null;
    }
  };

  useEffect(() => {
    return () => { stopCamera(); };
  }, []);

  return (
    <div className="flex flex-col">
      {/* Local camera preview */}
      <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ width: 200, height: 150 }}>
        {isOn ? (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <VideoOff className="w-8 h-8 text-gray-500" />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <p className="text-red-400 text-xs text-center px-2">{error}</p>
          </div>
        )}

        {/* Label */}
        <div className="absolute top-1 left-1.5 text-[9px] text-white/70 bg-black/40 px-1.5 py-0.5 rounded">
          You
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 mt-1.5">
        <button onClick={isOn ? stopCamera : startCamera}
          className={`p-1.5 rounded-lg transition ${isOn ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-green-500 text-white hover:bg-green-600'}`}
          title={isOn ? 'Turn Off Camera' : 'Turn On Camera'}>
          {isOn ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
        </button>
        
        <button onClick={toggleMute} disabled={!isOn}
          className={`p-1.5 rounded-lg transition ${!isOn ? 'bg-gray-300 text-gray-500' : isMuted ? 'bg-gray-600 text-white hover:bg-gray-700' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
          title={isMuted ? 'Unmute' : 'Mute'}>
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <button onClick={onClose}
          className="p-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-500 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          title="Close">
          <VideoOff className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Remote camera feed bubble for other users
export const RemoteCameraFeed = ({ feeds }) => {
  const [expanded, setExpanded] = useState({});

  if (!feeds || Object.keys(feeds).length === 0) return null;

  return (
    <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
      {Object.entries(feeds).map(([userId, { username, frame }]) => {
        const isExpanded = expanded[userId];
        return (
          <div key={userId}
            className="bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-700/50 transition-all"
            style={{ width: isExpanded ? 320 : 160 }}>
            <div className="flex items-center justify-between px-2 py-1 bg-gray-800">
              <span className="text-[10px] text-white/70 truncate">{username}</span>
              <button onClick={() => setExpanded(p => ({ ...p, [userId]: !p[userId] }))}
                className="text-white/50 hover:text-white">
                {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
              </button>
            </div>
            {frame ? (
              <img src={frame} alt={`${username}'s camera`} className="w-full h-auto" />
            ) : (
              <div className="w-full aspect-video bg-gray-900 flex items-center justify-center">
                <VideoOff className="w-5 h-5 text-gray-600" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CameraPanel;
