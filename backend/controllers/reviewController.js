import Review from '../models/Review.js';

// Create or update a review
export const createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    if (rating === undefined || rating === null || !comment) {
      return res.status(400).json({ success: false, message: 'Rating and comment are required' });
    }

    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be a number between 1 and 5' });
    }

    // Check if user already submitted a review
    let review = await Review.findOne({ user: req.user._id });
    
    if (review) {
      // Update existing review
      review.rating = ratingNum;
      review.comment = comment;
      await review.save();
      await review.populate('user', 'username email avatar');
      return res.status(200).json({
        success: true,
        message: 'Review updated successfully',
        review
      });
    }

    // Create new review
    review = await Review.create({
      user: req.user._id,
      rating: ratingNum,
      comment
    });

    await review.populate('user', 'username email avatar');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ success: false, message: 'Server error while saving review' });
  }
};

// Get all reviews
export const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'username email avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      reviews
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching reviews' });
  }
};
