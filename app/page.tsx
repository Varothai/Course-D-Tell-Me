// "use client"

// import React, { useState } from 'react';
// import { ReviewCard } from '@/components/review-card';

// const [reviews, setReviews] = useState<Review[]>([]);

// const handleDeleteReview = (reviewId: string) => {
//   setReviews(prevReviews => prevReviews.filter(review => review._id !== reviewId));
// };

// // In your JSX where you render ReviewCard
// <ReviewCard 
//   review={review}
//   likeAction={likeAction}
//   dislikeAction={dislikeAction}
//   bookmarkAction={bookmarkAction}
//   onDelete={handleDeleteReview}
// /> 