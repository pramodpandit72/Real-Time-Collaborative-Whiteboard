import { useState, useRef, useEffect } from 'react';
import { X, Monitor, MonitorOff } from 'lucide-react';

const ScreenShare = ({ roomId, onClose }) => {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('starting'); // starting, active, error
  const videoRef = useRef(null);

  useEffect(() => {
    startScreenShare();
    
    return () => {
      stopScreenShare();
    };
  }, []);

  const startScreenShare = async () => {
    try {
      setStatus('starting');
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor'
        },
        audio: false
      });

      setStream(mediaStream);
      setStatus('active');

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Handle stream end (user stops sharing via browser UI)
      mediaStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
        onClose();
      };

    } catch (err) {
      console.error('Error starting screen share:', err);
      if (err.name === 'NotAllowedError') {
        setError('Screen sharing was cancelled');
      } else {
        setError('Failed to start screen sharing');
      }
      setStatus('error');
      // Auto close after brief delay so user sees the message
      setTimeout(() => onClose(), 1500);
    }
  };

  const stopScreenShare = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setStatus('stopped');
  };

  if (status === 'error') {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-sm mx-4 text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MonitorOff className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Screen Share Failed
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {error || 'Unable to start screen sharing. Please try again.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="relative w-full max-w-6xl mx-4">
        {/* Controls */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <button
            onClick={() => {
              stopScreenShare();
              onClose();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-white text-sm font-medium transition shadow-lg"
          >
            <MonitorOff className="w-4 h-4" />
            Stop Sharing
          </button>
        </div>

        {/* Status badge */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-4 py-2 bg-red-500/90 backdrop-blur text-white rounded-xl text-sm font-medium shadow-lg">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          Screen sharing active
        </div>

        {/* Video Preview */}
        <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-700/50">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-auto max-h-[80vh] object-contain"
          />
        </div>

        {/* Instructions */}
        <p className="text-center text-white/60 text-sm mt-4">
          Your screen is being shared with all participants. Click "Stop Sharing" or use browser controls to end.
        </p>
      </div>
    </div>
  );
};

export default ScreenShare;
