/**
 * Setup script to create actual report documents for testing
 * 
 * This creates the actual report documents in the reports collection,
 * not just setting the reportCount field. This is needed because the
 * API counts actual documents, not the reportCount field.
 * 
 * Usage:
 * node scripts/setup-test-reports.js [reviewId] [count]
 * 
 * Example:
 * node scripts/setup-test-reports.js 507f1f77bcf86cd799439011 9
 */

const mongoose = require('mongoose');

// Try to load dotenv, but don't fail if it's not installed
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not installed, that's okay
}

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/course-review';

// Minimal schemas for migration
const reviewSchema = new mongoose.Schema({}, { strict: false, collection: 'reviews' });
const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

const reportSchema = new mongoose.Schema({}, { strict: false, collection: 'reports' });
const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);

async function setupTestReports(reviewIdArg, countArg) {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    let review;
    if (reviewIdArg) {
      review = await Review.findById(reviewIdArg);
      if (!review) {
        console.error(`❌ Review with ID ${reviewIdArg} not found`);
        return;
      }
    } else {
      review = await Review.findOne({});
      if (!review) {
        console.error('❌ No reviews found in database');
        return;
      }
    }

    const reviewId = review._id;
    const count = parseInt(countArg) || 9;

    console.log(`📝 Setting up test reports for review: ${reviewId}`);
    console.log(`   Course: ${review.courseId || 'N/A'} - ${review.courseName || 'N/A'}`);
    console.log(`   Target count: ${count}\n`);

    // Clear existing test reports (optional - comment out if you want to keep them)
    console.log('🧹 Cleaning up existing test reports...');
    await Report.deleteMany({ 
      reviewId: reviewId,
      reporterId: { $regex: /^test-/ } // Only delete test reports
    });

    // Create test reports
    console.log(`📝 Creating ${count} test report documents...`);
    const reports = [];
    const reasons = ['spam', 'inappropriate', 'harassment', 'misinformation', 'other'];
    
    for (let i = 0; i < count; i++) {
      reports.push({
        reviewId: reviewId,
        reporterId: `test-user-${i}@example.com`, // Different reporterId for each
        reason: reasons[i % reasons.length],
        createdAt: new Date(Date.now() - (count - i) * 60000) // Stagger timestamps
      });
    }

    await Report.insertMany(reports);
    console.log(`✅ Created ${reports.length} test report documents\n`);

    // Calculate actual count and update review
    const actualReportCount = await Report.countDocuments({ reviewId: reviewId });
    const shouldBeHidden = actualReportCount >= 10;

    await Review.updateOne(
      { _id: reviewId },
      {
        $set: {
          reportCount: actualReportCount,
          isHidden: shouldBeHidden
        }
      }
    );

    console.log('✅ Updated review:');
    console.log(`   reportCount: ${actualReportCount}`);
    console.log(`   isHidden: ${shouldBeHidden}\n`);

    if (count === 9) {
      console.log('📋 Next steps:');
      console.log(`   1. Report this review via UI: ${reviewId}`);
      console.log('   2. This will be the 10th report');
      console.log('   3. Review should disappear from homepage\n');
    }

    // Verify
    const updatedReview = await Review.findById(reviewId);
    const allReports = await Report.countDocuments({ reviewId: reviewId });

    console.log('🔍 Verification:');
    console.log(`   Review reportCount: ${updatedReview.reportCount}`);
    console.log(`   Actual reports in DB: ${allReports}`);
    console.log(`   Match: ${updatedReview.reportCount === allReports ? '✅' : '❌'}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

const reviewId = process.argv[2];
const count = process.argv[3];
setupTestReports(reviewId, count).catch(console.error);

