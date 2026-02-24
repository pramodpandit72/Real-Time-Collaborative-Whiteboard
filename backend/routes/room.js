import express from 'express';
import * as roomController from '../controllers/roomController.js';
import * as chatController from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Room CRUD
router.post('/', roomController.createRoom);
router.post('/join', roomController.joinRoom);
router.get('/my-rooms', roomController.getMyRooms);
router.get('/:roomId', roomController.getRoom);
router.put('/:roomId', roomController.updateRoom);
router.post('/:roomId/leave', roomController.leaveRoom);
router.delete('/:roomId', roomController.deleteRoom);

// Participant management
router.put('/:roomId/participant-role', roomController.updateParticipantRole);
router.post('/:roomId/kick', roomController.kickParticipant);

// Chat routes
router.get('/:roomId/messages', chatController.getMessages);
router.post('/:roomId/messages', chatController.sendMessage);
router.delete('/messages/:messageId', chatController.deleteMessage);

export default router;
