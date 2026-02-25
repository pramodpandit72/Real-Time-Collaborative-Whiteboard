import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, ChevronUp, ChevronDown,
  Maximize2, Minimize2, Volume2, VolumeX
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const VideoCall = ({ roomId, remoteCameras, onClose }) => {
  const [stream, setStream] = useState(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [selfFrame, setSelfFrame] = useState(null);
  const videoRef = useRef(null);
  const frameInterval = useRef(null);
  const { socket } = useSocket();
  const { user } = useAuth();

  // ── Start Camera ──
  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: 'user' },
        audio: true
      });
      setStream(mediaStream);
      setCameraOn(true);

      // Mute audio by default
      mediaStream.getAudioTracks().forEach(t => { t.enabled = false; });

      // Attach to video element using a callback — fixes the self-view bug
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(() => {});
        }
      });

      startFrameCapture(mediaStream);
      socket?.emit('camera-started', roomId);
    } catch (err) {
      console.error('Camera error:', err);
    }
  }, [roomId, socket]);

  // ── Stop Camera ──
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    stopFrameCapture();
    setCameraOn(false);
    setMicOn(false);
    setSelfFrame(null);
    if (videoRef.current) videoRef.current.srcObject = null;
    socket?.emit('camera-stopped', roomId);
  }, [stream, roomId, socket]);

  // ── Toggle Mic ──
  const toggleMic = useCallback(() => {
    if (stream) {
      const newState = !micOn;
      stream.getAudioTracks().forEach(t => { t.enabled = newState; });
      setMicOn(newState);
    }
  }, [stream, micOn]);

  // ── Frame capture for remote users ──
  const startFrameCapture = (mediaStream) => {
    const vid = document.createElement('video');
    vid.srcObject = mediaStream;
    vid.muted = true;
    vid.playsInline = true;
    vid.play().catch(() => {});

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    frameInterval.current = setInterval(() => {
      if (vid.readyState >= 2 && socket?.connected) {
        canvas.width = 200;
        canvas.height = 150;
        ctx.drawImage(vid, 0, 0, 200, 150);
        const frame = canvas.toDataURL('image/jpeg', 0.45);
        socket.emit('camera-frame', { roomId, frame });
        setSelfFrame(frame); // Also store self preview as fallback
      }
    }, 400); // ~2.5 FPS
  };

  const stopFrameCapture = () => {
    if (frameInterval.current) {
      clearInterval(frameInterval.current);
      frameInterval.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      stopFrameCapture();
    };
  }, []);

  // Sync video ref when stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream, cameraOn]);

  const remoteEntries = Object.entries(remoteCameras || {});
  const totalParticipants = (cameraOn ? 1 : 0) + remoteEntries.length;

  return (
    <div className="bg-[#1a1a2e] border-t border-gray-700/50 flex flex-col transition-all duration-300"
      style={{ height: expanded ? (totalParticipants > 0 ? 220 : 180) : 48 }}>

      {/* ── Header Bar ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#16162a] border-b border-gray-700/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${cameraOn ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
            <span className="text-[11px] font-semibold text-white/80 tracking-wide uppercase">
              Video Call {totalParticipants > 0 && `· ${totalParticipants}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Camera Toggle */}
          <ControlButton
            active={cameraOn}
            activeColor="bg-blue-600 hover:bg-blue-700"
            inactiveColor="bg-gray-700 hover:bg-gray-600"
            onClick={cameraOn ? stopCamera : startCamera}
            title={cameraOn ? 'Turn Off Camera' : 'Turn On Camera'}>
            {cameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </ControlButton>

          {/* Mic Toggle */}
          <ControlButton
            active={micOn}
            activeColor="bg-blue-600 hover:bg-blue-700"
            inactiveColor="bg-gray-700 hover:bg-gray-600"
            onClick={toggleMic}
            disabled={!cameraOn}
            title={micOn ? 'Mute' : 'Unmute'}>
            {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </ControlButton>

          <div className="w-px h-5 bg-gray-700 mx-1" />

          {/* Expand / Collapse */}
          <ControlButton
            inactiveColor="bg-gray-700/60 hover:bg-gray-600"
            onClick={() => setExpanded(!expanded)}
            title={expanded ? 'Collapse' : 'Expand'}>
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </ControlButton>

          {/* End Call */}
          <ControlButton
            inactiveColor="bg-red-600 hover:bg-red-700"
            onClick={() => { stopCamera(); onClose(); }}
            title="Leave Call">
            <PhoneOff className="w-4 h-4" />
          </ControlButton>
        </div>
      </div>

      {/* ── Video Grid ── */}
      {expanded && (
        <div className="flex-1 p-3 overflow-x-auto">
          <div className="flex gap-3 h-full items-center">
            {/* Self View */}
            {cameraOn && (
              <VideoTile
                label={`${user?.username || 'You'} (You)`}
                isSelf
                micOn={micOn}
                cameraOn={cameraOn}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover mirror"
                  style={{ transform: 'scaleX(-1)' }}
                />
              </VideoTile>
            )}

            {/* Self placeholder when camera is off but call is open */}
            {!cameraOn && (
              <VideoTile label={`${user?.username || 'You'} (You)`} isSelf micOn={false} cameraOn={false}>
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold mb-1">
                    {(user?.username || 'U')[0].toUpperCase()}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1">Camera off</span>
                </div>
              </VideoTile>
            )}

            {/* Remote Feeds */}
            {remoteEntries.map(([userId, { username, frame }]) => (
              <VideoTile key={userId} label={username || 'User'} micOn={true} cameraOn={!!frame}>
                {frame ? (
                  <img src={frame} alt={username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xl font-bold mb-1">
                      {(username || 'U')[0].toUpperCase()}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1">Connecting...</span>
                  </div>
                )}
              </VideoTile>
            ))}

            {/* Empty state */}
            {totalParticipants === 0 && !cameraOn && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Video className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Turn on your camera to start</p>
                  <p className="text-gray-600 text-xs mt-0.5">Other participants will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Video Tile ── */
const VideoTile = ({ children, label, isSelf, micOn, cameraOn }) => (
  <div className="relative flex-shrink-0 rounded-xl overflow-hidden bg-gray-900 border border-gray-700/50 shadow-lg group"
    style={{ width: 200, height: 150 }}>
    {children}

    {/* Bottom gradient overlay */}
    <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/70 to-transparent" />

    {/* Name badge */}
    <div className="absolute bottom-1.5 left-2 flex items-center gap-1.5">
      {isSelf && <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
      <span className="text-[10px] text-white font-medium truncate max-w-[120px] drop-shadow">{label}</span>
    </div>

    {/* Mic indicator */}
    <div className="absolute bottom-1.5 right-2">
      {micOn ? (
        <Mic className="w-3 h-3 text-white/70" />
      ) : (
        <div className="bg-red-500/80 rounded-full p-0.5">
          <MicOff className="w-2.5 h-2.5 text-white" />
        </div>
      )}
    </div>

    {/* Live ring for active camera */}
    {cameraOn && (
      <div className="absolute top-1.5 right-1.5">
        <div className="w-2 h-2 rounded-full bg-green-400 ring-2 ring-green-400/30" />
      </div>
    )}
  </div>
);

/* ── Control Button ── */
const ControlButton = ({ children, onClick, disabled, title, active, activeColor, inactiveColor }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 rounded-full text-white transition-all ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${
      active ? (activeColor || 'bg-blue-600') : (inactiveColor || 'bg-gray-700')
    }`}>
    {children}
  </button>
);

export default VideoCall;
