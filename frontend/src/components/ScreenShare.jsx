import { useState, useRef, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { X, Monitor, Maximize, Minimize } from 'lucide-react';

const ScreenShare = ({ roomId, onClose }) => {
  const [stream, setStream] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  
  const { 
    socket, 
    sendScreenShareOffer, 
    sendScreenShareAnswer, 
    sendIceCandidate 
  } = useSocket();

  useEffect(() => {
    startScreenShare();
    
    return () => {
      stopScreenShare();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Handle WebRTC signaling
    socket.on('screen-share-answer', async (data) => {
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
        }
      } catch (err) {
        console.error('Error setting remote description:', err);
      }
    });

    socket.on('ice-candidate', async (data) => {
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
        }
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    });

    return () => {
      socket.off('screen-share-answer');
      socket.off('ice-candidate');
    };
  }, [socket]);

  const startScreenShare = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor'
        },
        audio: false
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Handle stream end (user stops sharing via browser UI)
      mediaStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
        onClose();
      };

      // Setup WebRTC peer connection for broadcasting
      setupPeerConnection(mediaStream);

    } catch (err) {
      console.error('Error starting screen share:', err);
      if (err.name === 'NotAllowedError') {
        setError('Screen sharing was cancelled');
      } else {
        setError('Failed to start screen sharing');
      }
      onClose();
    }
  };

  const setupPeerConnection = async (mediaStream) => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    const peerConnection = new RTCPeerConnection(configuration);
    peerConnectionRef.current = peerConnection;

    // Add tracks to peer connection
    mediaStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, mediaStream);
    });

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendIceCandidate(roomId, event.candidate);
      }
    };

    // Create and send offer
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      sendScreenShareOffer(roomId, offer);
    } catch (err) {
      console.error('Error creating offer:', err);
    }
  };

  const stopScreenShare = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      videoRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  if (error) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="relative w-full max-w-5xl mx-4">
        {/* Controls */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition"
          >
            {isFullscreen ? (
              <Minimize className="w-5 h-5" />
            ) : (
              <Maximize className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={() => {
              stopScreenShare();
              onClose();
            }}
            className="p-2 bg-red-500 hover:bg-red-600 rounded-lg text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status badge */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg text-sm">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          Screen sharing active
        </div>

        {/* Video */}
        <div className="bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-auto max-h-[80vh] object-contain"
          />
        </div>

        {/* Instructions */}
        <p className="text-center text-white/70 text-sm mt-4">
          Your screen is being shared with all participants in this room.
          Click the X button or use your browser's sharing controls to stop.
        </p>
      </div>
    </div>
  );
};

export default ScreenShare;
