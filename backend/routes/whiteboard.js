const express = require('express');
const router = express.Router();
const whiteboardController = require('../controllers/whiteboardController');
const { protect } = require('../middleware/auth');

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

module.exports = router;
