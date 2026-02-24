import express from 'express';
import * as whiteboardController from '../controllers/whiteboardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Whiteboard routes
router.get('/:roomId', whiteboardController.getWhiteboard);
router.post('/:roomId/strokes', whiteboardController.saveStrokes);
router.post('/:roomId/clear', whiteboardController.clearWhiteboard);
router.post('/:roomId/undo', whiteboardController.undoStroke);

// Snapshot routes
router.post('/:roomId/snapshot', whiteboardController.saveSnapshot);
router.get('/:roomId/snapshots', whiteboardController.getSnapshots);

export default router;
