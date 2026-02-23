import { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

const Canvas = forwardRef(({ 
  strokes, 
  setStrokes, 
  tool, 
  color, 
  brushSize, 
  roomId,
  canDraw,
  remoteCursors,
  addToHistory
}, ref) => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState(null);
  const { sendDrawStart, sendDrawMove, sendDrawEnd, sendCursorMove } = useSocket();

  // Expose canvas methods to parent
  useImperativeHandle(ref, () => canvasRef.current);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    
    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      contextRef.current = ctx;
      
      // Redraw strokes after resize
      redrawCanvas();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Redraw canvas when strokes change
  useEffect(() => {
    redrawCanvas();
  }, [strokes]);

  const redrawCanvas = useCallback(() => {
    const ctx = contextRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    // Fill background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw all strokes
    strokes.forEach(stroke => {
      if (!stroke.points || stroke.points.length < 2) return;
      
      ctx.beginPath();
      ctx.strokeStyle = stroke.tool === 'eraser' ? '#ffffff' : stroke.color;
      ctx.lineWidth = stroke.brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      
      ctx.stroke();
    });
  }, [strokes]);

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    if (e.touches) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    if (!canDraw) return;
    
    e.preventDefault();
    const point = getCanvasCoordinates(e);
    
    setIsDrawing(true);
    setCurrentStroke({
      points: [point],
      color,
      brushSize,
      tool,
      timestamp: Date.now()
    });

    // Start drawing on canvas
    const ctx = contextRef.current;
    ctx.beginPath();
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = brushSize;
    ctx.moveTo(point.x, point.y);

    sendDrawStart(roomId, point, color, brushSize, tool);
  };

  const draw = (e) => {
    if (!isDrawing || !canDraw) return;
    
    e.preventDefault();
    const point = getCanvasCoordinates(e);

    // Update cursor position for other users
    sendCursorMove(roomId, point);

    // Add point to current stroke
    setCurrentStroke(prev => ({
      ...prev,
      points: [...prev.points, point]
    }));

    // Draw line segment
    const ctx = contextRef.current;
    ctx.lineTo(point.x, point.y);
    ctx.stroke();

    sendDrawMove(roomId, point);
  };

  const stopDrawing = (e) => {
    if (!isDrawing) return;
    
    e?.preventDefault();
    setIsDrawing(false);

    if (currentStroke && currentStroke.points.length > 1) {
      const newStrokes = [...strokes, currentStroke];
      setStrokes(newStrokes);
      addToHistory(newStrokes);
      sendDrawEnd(roomId, currentStroke);
    }

    setCurrentStroke(null);
    contextRef.current?.closePath();
  };

  const handleMouseMove = (e) => {
    if (!canDraw) return;
    
    const point = getCanvasCoordinates(e);
    sendCursorMove(roomId, point);
    
    if (isDrawing) {
      draw(e);
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full relative bg-white dark:bg-gray-100">
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 ${canDraw ? 'cursor-crosshair' : 'cursor-not-allowed'}`}
        onMouseDown={startDrawing}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />

      {/* Remote Cursors */}
      {Object.entries(remoteCursors).map(([userId, { position, username }]) => (
        <div
          key={userId}
          className="absolute pointer-events-none z-10 transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: position.x, top: position.y }}
        >
          <svg
            className="w-5 h-5 text-blue-500"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M5.5 3.21V20.8l6.99-6.99H21L5.5 3.21z" />
          </svg>
          <span className="absolute left-4 top-4 px-2 py-1 bg-blue-500 text-white text-xs rounded whitespace-nowrap">
            {username}
          </span>
        </div>
      ))}

      {/* Drawing disabled message */}
      {!canDraw && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded-lg text-sm">
          Drawing is disabled for participants
        </div>
      )}
    </div>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;
