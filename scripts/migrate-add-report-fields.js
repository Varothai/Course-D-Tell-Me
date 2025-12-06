/**
 * Migration script to add reportCount and isHidden fields to existing reviews
 * 
 * This is needed because MongoDB doesn't automatically add new schema fields
 * to existing documents - only new documents get the default values.
 * 
 * Usage:
 * node scripts/migrate-add-report-fields.js
 */

const mongoose = require('mongoose');
// Try to load dotenv, but don't fail if it's not installed
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not installed, that's okay
}

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/course-review';

// Minimal schema for migration
const reviewSchema = new mongoose.Schema({}, { strict: false, collection: 'reviews' });
const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

const reportSchema = new mongoose.Schema({}, { strict: false, collection: 'reports' });
const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);

async function migrate() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all reviews that don't have reportCount or isHidden
    const reviewsToUpdate = await Review.find({
      $or: [
        { reportCount: { $exists: false } },
        { isHidden: { $exists: false } }
      ]
    });

    console.log(`📊 Found ${reviewsToUpdate.length} reviews that need migration\n`);

    if (reviewsToUpdate.length === 0) {
      console.log('✅ All reviews already have reportCount and isHidden fields!');
      return;
    }

    let updated = 0;
    let withReports = 0;

    for (const review of reviewsToUpdate) {
      // Calculate actual report count from reports collection
      const actualReportCount = await Report.countDocuments({ 
        reviewId: review._id 
      });

      // Set fields based on actual data
      const updateData = {};
      
      if (review.reportCount === undefined) {
        updateData.reportCount = actualReportCount;
      }
      
      if (review.isHidden === undefined) {
        // If there are 10+ reports, it should be hidden
        updateData.isHidden = actualReportCount >= 10;
      }

      // Only update if there are fields to set
      if (Object.keys(updateData).length > 0) {
        await Review.updateOne(
          { _id: review._id },
          { $set: updateData }
        );
        updated++;
        
        if (actualReportCount > 0) {
          withReports++;
        }
      }
    }

    console.log('✅ Migration complete!\n');
    console.log(`   Updated ${updated} reviews`);
    console.log(`   ${withReports} reviews had existing reports`);
    console.log(`   ${updated - withReports} reviews set to default (0 reports, not hidden)\n`);

    // Verify migration
    const stillMissing = await Review.countDocuments({
      $or: [
        { reportCount: { $exists: false } },
        { isHidden: { $exists: false } }
      ]
    });

    if (stillMissing === 0) {
      console.log('✅ Verification: All reviews now have reportCount and isHidden fields!');
    } else {
      console.log(`⚠️  Warning: ${stillMissing} reviews still missing fields`);
    }

    // Show summary
    const totalReviews = await Review.countDocuments({});
    const hiddenReviews = await Review.countDocuments({ isHidden: true });
    const reviewsWithReports = await Review.countDocuments({ reportCount: { $gt: 0 } });

    console.log('\n📊 Summary:');
    console.log(`   Total reviews: ${totalReviews}`);
    console.log(`   Hidden reviews: ${hiddenReviews}`);
    console.log(`   Reviews with reports: ${reviewsWithReports}`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run migration
if (require.main === module) {
  migrate().catch(console.error);
}

module.exports = { migrate };

