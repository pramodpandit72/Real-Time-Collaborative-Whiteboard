import { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

const SHAPE_TOOLS = ['line', 'arrow', 'rectangle', 'circle', 'triangle', 'diamond', 'star'];

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
  const [shapeStart, setShapeStart] = useState(null);
  const [textInput, setTextInput] = useState(null); // { x, y, visible }
  const textInputRef = useRef(null);
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
      drawStroke(ctx, stroke);
    });
  }, [strokes]);

  // Universal stroke renderer
  const drawStroke = (ctx, stroke) => {
    if (!stroke) return;

    ctx.save();
    ctx.strokeStyle = stroke.tool === 'eraser' ? '#ffffff' : stroke.color;
    ctx.fillStyle = stroke.tool === 'eraser' ? '#ffffff' : stroke.color;
    ctx.lineWidth = stroke.brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const strokeTool = stroke.tool || 'pencil';

    if (strokeTool === 'text' && stroke.text) {
      const fontSize = Math.max(stroke.brushSize * 3, 16);
      ctx.font = `${fontSize}px Inter, sans-serif`;
      ctx.fillStyle = stroke.color;
      ctx.fillText(stroke.text, stroke.points[0].x, stroke.points[0].y);
    } else if (SHAPE_TOOLS.includes(strokeTool) && stroke.points && stroke.points.length >= 2) {
      const start = stroke.points[0];
      const end = stroke.points[stroke.points.length - 1];
      drawShape(ctx, strokeTool, start, end, stroke.brushSize);
    } else if (stroke.points && stroke.points.length >= 2) {
      // Freehand pencil / eraser
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }

    ctx.restore();
  };

  // Shape drawing helper
  const drawShape = (ctx, shapeTool, start, end, lineWidth) => {
    ctx.beginPath();

    switch (shapeTool) {
      case 'line':
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        break;

      case 'arrow': {
        const headLength = Math.max(lineWidth * 4, 15);
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        
        // Arrowhead
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
          end.x - headLength * Math.cos(angle - Math.PI / 6),
          end.y - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
          end.x - headLength * Math.cos(angle + Math.PI / 6),
          end.y - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
        break;
      }

      case 'rectangle': {
        const w = end.x - start.x;
        const h = end.y - start.y;
        ctx.strokeRect(start.x, start.y, w, h);
        break;
      }

      case 'circle': {
        const rx = Math.abs(end.x - start.x) / 2;
        const ry = Math.abs(end.y - start.y) / 2;
        const cx = start.x + (end.x - start.x) / 2;
        const cy = start.y + (end.y - start.y) / 2;
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }

      case 'triangle': {
        const midX = (start.x + end.x) / 2;
        ctx.moveTo(midX, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.lineTo(start.x, end.y);
        ctx.closePath();
        ctx.stroke();
        break;
      }

      case 'diamond': {
        const dmx = (start.x + end.x) / 2;
        const dmy = (start.y + end.y) / 2;
        ctx.moveTo(dmx, start.y);
        ctx.lineTo(end.x, dmy);
        ctx.lineTo(dmx, end.y);
        ctx.lineTo(start.x, dmy);
        ctx.closePath();
        ctx.stroke();
        break;
      }

      case 'star': {
        const smx = (start.x + end.x) / 2;
        const smy = (start.y + end.y) / 2;
        const outerR = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y)) / 2;
        const innerR = outerR * 0.4;
        const points = 5;
        
        for (let i = 0; i < points * 2; i++) {
          const r = i % 2 === 0 ? outerR : innerR;
          const a = (Math.PI / points) * i - Math.PI / 2;
          const px = smx + r * Math.cos(a);
          const py = smy + r * Math.sin(a);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        break;
      }

      default:
        break;
    }
  };

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

    // Handle text tool
    if (tool === 'text') {
      setTextInput({ x: point.x, y: point.y, visible: true });
      setTimeout(() => textInputRef.current?.focus(), 50);
      return;
    }

    setIsDrawing(true);
    setShapeStart(point);
    setCurrentStroke({
      points: [point],
      color,
      brushSize,
      tool,
      timestamp: Date.now()
    });

    // For freehand tools, start the path
    if (!SHAPE_TOOLS.includes(tool)) {
      const ctx = contextRef.current;
      ctx.beginPath();
      ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
      ctx.lineWidth = brushSize;
      ctx.moveTo(point.x, point.y);
    }

    sendDrawStart(roomId, point, color, brushSize, tool);
  };

  const draw = (e) => {
    if (!isDrawing || !canDraw) return;
    e.preventDefault();
    const point = getCanvasCoordinates(e);

    sendCursorMove(roomId, point);

    if (SHAPE_TOOLS.includes(tool)) {
      // For shapes: redraw canvas + preview shape
      setCurrentStroke(prev => ({
        ...prev,
        points: [shapeStart, point]
      }));

      // Redraw base + preview
      redrawCanvas();
      const ctx = contextRef.current;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash([6, 4]); // dashed preview
      drawShape(ctx, tool, shapeStart, point, brushSize);
      ctx.restore();
    } else {
      // Freehand: add point
      setCurrentStroke(prev => ({
        ...prev,
        points: [...prev.points, point]
      }));

      const ctx = contextRef.current;
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }

    sendDrawMove(roomId, point);
  };

  const stopDrawing = (e) => {
    if (!isDrawing) return;
    e?.preventDefault();
    setIsDrawing(false);

    if (currentStroke) {
      let finalStroke = currentStroke;

      if (SHAPE_TOOLS.includes(tool) && shapeStart) {
        const endPoint = e ? getCanvasCoordinates(e) : (currentStroke.points[1] || shapeStart);
        finalStroke = {
          ...currentStroke,
          points: [shapeStart, endPoint]
        };
      }

      if (finalStroke.points.length >= 2 || SHAPE_TOOLS.includes(tool)) {
        const newStrokes = [...strokes, finalStroke];
        setStrokes(newStrokes);
        addToHistory(newStrokes);
        sendDrawEnd(roomId, finalStroke);
      }
    }

    setCurrentStroke(null);
    setShapeStart(null);
    contextRef.current?.closePath();

    // Redraw to remove dashed preview
    if (SHAPE_TOOLS.includes(tool)) {
      setTimeout(() => redrawCanvas(), 0);
    }
  };

  const handleMouseMove = (e) => {
    if (!canDraw) return;
    
    const point = getCanvasCoordinates(e);
    sendCursorMove(roomId, point);
    
    if (isDrawing) {
      draw(e);
    }
  };

  // Handle text submission
  const handleTextSubmit = (text) => {
    if (!text.trim() || !textInput) return;

    const textStroke = {
      points: [{ x: textInput.x, y: textInput.y }],
      color,
      brushSize,
      tool: 'text',
      text: text.trim(),
      timestamp: Date.now()
    };

    const newStrokes = [...strokes, textStroke];
    setStrokes(newStrokes);
    addToHistory(newStrokes);
    sendDrawEnd(roomId, textStroke);
    setTextInput(null);
  };

  // Cursor style based on tool
  const getCursorClass = () => {
    if (!canDraw) return 'cursor-not-allowed';
    if (tool === 'text') return 'cursor-text';
    if (tool === 'eraser') return 'cursor-cell';
    return 'cursor-crosshair';
  };

  return (
    <div ref={containerRef} className="w-full h-full relative bg-white dark:bg-gray-100">
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 ${getCursorClass()}`}
        onMouseDown={startDrawing}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />

      {/* Text Input Overlay */}
      {textInput?.visible && (
        <div
          className="absolute z-20"
          style={{ left: textInput.x, top: textInput.y - 10 }}
        >
          <input
            ref={textInputRef}
            type="text"
            className="bg-transparent border-b-2 border-blue-500 outline-none text-gray-900 dark:text-gray-900 px-1 py-0.5 min-w-[120px]"
            style={{
              fontSize: `${Math.max(brushSize * 3, 16)}px`,
              color: color,
              fontFamily: 'Inter, sans-serif'
            }}
            placeholder="Type here..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleTextSubmit(e.target.value);
              } else if (e.key === 'Escape') {
                setTextInput(null);
              }
            }}
            onBlur={(e) => {
              if (e.target.value.trim()) {
                handleTextSubmit(e.target.value);
              } else {
                setTextInput(null);
              }
            }}
          />
          <div className="text-[10px] text-gray-400 mt-0.5">Press Enter to confirm, Esc to cancel</div>
        </div>
      )}

      {/* Remote Cursors */}
      {Object.entries(remoteCursors).map(([userId, { position, username }]) => (
        <div
          key={userId}
          className="absolute pointer-events-none z-10 transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: position.x, top: position.y }}
        >
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5.5 3.21V20.8l6.99-6.99H21L5.5 3.21z" />
          </svg>
          <span className="absolute left-4 top-4 px-2 py-1 bg-blue-500 text-white text-xs rounded whitespace-nowrap shadow-md">
            {username}
          </span>
        </div>
      ))}

      {/* Drawing disabled message */}
      {!canDraw && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded-xl text-sm shadow-lg">
          Drawing is disabled for participants
        </div>
      )}

      {/* Active tool indicator */}
      {canDraw && (
        <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg text-xs text-gray-500 dark:text-gray-400 shadow-sm border border-gray-200/50 dark:border-gray-700/50 capitalize">
          {tool} tool
        </div>
      )}
    </div>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;
