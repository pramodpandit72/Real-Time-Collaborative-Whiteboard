import express from 'express';
import { createReview, getReviews } from '../controllers/reviewController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(getReviews)
  .post(protect, createReview);

export default router;
