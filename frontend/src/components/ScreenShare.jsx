import { useState, useRef, useEffect, useCallback } from 'react';
import { MonitorOff, Maximize2, Minimize2 } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const ScreenShare = ({ roomId, onClose }) => {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('starting');
  const [minimized, setMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 16, y: 16 });
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const frameInterval = useRef(null);
  const dragging = useRef(false);
  const { socket } = useSocket();

  useEffect(() => {
    startScreenShare();
    return () => { stopScreenShare(); stopFrameCapture(); };
  }, []);

  const startScreenShare = async () => {
    try {
      setStatus('starting');
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always', displaySurface: 'monitor', frameRate: 5 },
        audio: false
      });
      setStream(mediaStream);
      setStatus('active');

      if (videoRef.current) videoRef.current.srcObject = mediaStream;

      // Start streaming frames to other users
      startFrameCapture(mediaStream);

      mediaStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
        stopFrameCapture();
        onClose();
      };
    } catch (err) {
      setError(err.name === 'NotAllowedError' ? 'Screen sharing was cancelled' : 'Failed to start screen sharing');
      setStatus('error');
      setTimeout(() => onClose(), 1500);
    }
  };

  // Capture frames from video and send via socket
  const startFrameCapture = (mediaStream) => {
    const video = document.createElement('video');
    video.srcObject = mediaStream;
    video.play();

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    frameInterval.current = setInterval(() => {
      if (video.readyState >= 2 && socket?.connected) {
        // Scale down for bandwidth (max 640px wide)
        const scale = Math.min(1, 640 / video.videoWidth);
        canvas.width = video.videoWidth * scale;
        canvas.height = video.videoHeight * scale;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const frame = canvas.toDataURL('image/jpeg', 0.5);
        socket.emit('screen-share-frame', { roomId, frame });
      }
    }, 500); // 2 FPS — enough for screen sharing
  };

  const stopFrameCapture = () => {
    if (frameInterval.current) {
      clearInterval(frameInterval.current);
      frameInterval.current = null;
    }
  };

  const stopScreenShare = () => {
    if (stream) { stream.getTracks().forEach(t => t.stop()); setStream(null); }
    stopFrameCapture();
    setStatus('stopped');
  };

  // Drag handler
  const onDragStart = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    const startX = e.clientX || e.touches?.[0]?.clientX;
    const startY = e.clientY || e.touches?.[0]?.clientY;
    const startPos = { ...position };

    const onMove = (ev) => {
      const x = ev.clientX || ev.touches?.[0]?.clientX;
      const y = ev.clientY || ev.touches?.[0]?.clientY;
      setPosition({
        x: Math.max(0, startPos.x + (x - startX)),
        y: Math.max(0, startPos.y + (y - startY))
      });
    };
    const onUp = () => {
      dragging.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove);
    document.addEventListener('touchend', onUp);
  }, [position]);

  if (status === 'error') {
    return (
      <div className="fixed bottom-4 right-4 z-40 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-2xl border border-gray-200 dark:border-gray-700 max-w-xs text-center">
        <MonitorOff className="w-6 h-6 text-red-500 mx-auto mb-2" />
        <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="fixed z-40 transition-shadow"
      style={{ left: position.x, top: position.y, ...(minimized ? { width: 200 } : {}) }}>
      
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-red-500 text-white rounded-t-xl cursor-move select-none"
        onMouseDown={onDragStart} onTouchStart={onDragStart}>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-xs font-medium">Sharing · Live</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setMinimized(!minimized)}
            className="p-0.5 hover:bg-red-600 rounded transition" title={minimized ? 'Expand' : 'Minimize'}>
            {minimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => { stopScreenShare(); onClose(); }}
            className="p-0.5 hover:bg-red-600 rounded transition" title="Stop Sharing">
            <MonitorOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!minimized && (
        <div className="bg-gray-900 rounded-b-xl overflow-hidden shadow-2xl border border-gray-700/50" style={{ width: 360 }}>
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto" />
        </div>
      )}

      {minimized && (
        <div className="bg-gray-900 rounded-b-xl px-3 py-2 text-white/60 text-xs border border-gray-700/50">
          Sharing... (expand ↗)
        </div>
      )}
    </div>
  );
};

export default ScreenShare;
