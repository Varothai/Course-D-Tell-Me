# Developer Testing Guide - Report Feature

## 🎯 Quick Testing Without Multiple Accounts

As a developer, you can test the entire report feature flow without needing 10 different user accounts. Here are the most practical methods:

## Method 1: Database + UI Hybrid (Recommended - 5 minutes)

### Step 1: Setup Test Review
```javascript
// In MongoDB shell or Compass
const reviewId = ObjectId("YOUR_REVIEW_ID");

// Reset to clean state
db.reviews.updateOne(
  { _id: reviewId },
  { $set: { reportCount: 0, isHidden: false } }
);
db.reports.deleteMany({ reviewId: reviewId });
```

### Step 2: Create 9 Actual Report Documents

**⚠️ IMPORTANT:** The API counts actual documents in the `reports` collection, NOT just the `reportCount` field. You MUST create actual report documents!

#### Option A: Use Setup Script (Easiest)
```bash
node scripts/setup-test-reports.js [reviewId] 9
```

#### Option B: Manual MongoDB
```javascript
// Create 9 actual report documents (not just set the count!)
for (let i = 0; i < 9; i++) {
  db.reports.insertOne({
    reviewId: reviewId,
    reporterId: `test-user-${i}@example.com`, // Different for each
    reason: "spam",
    createdAt: new Date()
  });
}

// Update review with ACTUAL count from documents
const actualCount = db.reports.countDocuments({ reviewId: reviewId });
db.reviews.updateOne(
  { _id: reviewId },
  { 
    $set: { 
      reportCount: actualCount, // Use actual count, not hardcoded 9
      isHidden: actualCount >= 10
    }
  }
);
```

### Step 3: Test the 10th Report via UI
1. Open your app
2. Find the test review
3. Report it through the UI (click ⋮ → Report → Select reason → Submit)
4. ✅ **Expected**: Review should disappear from homepage immediately

### Step 4: Verify in Database
```javascript
// Check final state
const review = db.reviews.findOne({ _id: reviewId });
console.log('Report count:', review.reportCount); // Should be 10
console.log('Is hidden:', review.isHidden); // Should be true
```

## Method 2: Use Test Scripts

### Quick Setup Script
```bash
# Install dependencies (if needed)
npm install mongoose dotenv

# Run quick test (sets review to 9 reports)
node scripts/quick-test-report.js [reviewId]

# Then report via UI to test the 10th report
```

### Full Test Script
```bash
# Creates 10 reports and verifies everything
node scripts/test-report-single-user.js
```

## Method 3: Browser Console + API Testing

### Check Current Status
```javascript
// Replace with actual review ID
const reviewId = 'YOUR_REVIEW_ID';

// Check status
fetch(`/api/admin/reviews/${reviewId}/status`)
  .then(r => r.json())
  .then(data => {
    console.log('Report count:', data.review.reportCount);
    console.log('Is hidden:', data.review.isHidden);
    console.log('Reports:', data.reports);
  });
```

### Test Incremental Reports
1. Report via UI once
2. Check status via API
3. Manually increment in database to 9
4. Report via UI again (10th)
5. Verify it's hidden

## Method 4: Direct Database Testing

### Test Threshold Logic
```javascript
// Test exactly 10 reports
const reviewId = ObjectId("REVIEW_ID");

// Set to 10
db.reviews.updateOne(
  { _id: reviewId },
  { $set: { reportCount: 10, isHidden: true } }
);

// Verify it doesn't appear in GET /api/reviews
// (Check your homepage - review should be gone)
```

### Test Edge Cases
```javascript
// Test 9 reports (should NOT hide)
db.reviews.updateOne(
  { _id: reviewId },
  { $set: { reportCount: 9, isHidden: false } }
);
// Verify: Review should still appear

// Test 11 reports (already hidden)
db.reviews.updateOne(
  { _id: reviewId },
  { $set: { reportCount: 11, isHidden: true } }
);
// Verify: Review should not appear
```

## Method 5: Complete Test Flow

### Full Verification Checklist

```javascript
// 1. Pick a test review
const testReviewId = "YOUR_REVIEW_ID";

// 2. Reset state
db.reviews.updateOne(
  { _id: ObjectId(testReviewId) },
  { $set: { reportCount: 0, isHidden: false } }
);
db.reports.deleteMany({ reviewId: ObjectId(testReviewId) });

// 3. Report once via UI
// ✅ Verify: reportCount = 1, isHidden = false

// 4. Set to 9 via database
db.reviews.updateOne(
  { _id: ObjectId(testReviewId) },
  { $set: { reportCount: 9 } }
);

// 5. Report again via UI (10th report)
// ✅ Verify: reportCount = 10, isHidden = true
// ✅ Verify: Review disappears from homepage
// ✅ Verify: GET /api/reviews doesn't return it
```

## Verification Commands

### Check if Review is Hidden
```javascript
// MongoDB
db.reviews.findOne(
  { _id: ObjectId("REVIEW_ID") },
  { isHidden: 1, reportCount: 1 }
);
```

### Verify Report Count Matches
```javascript
// This should match
const review = db.reviews.findOne({ _id: ObjectId("REVIEW_ID") });
const actualCount = db.reports.countDocuments({ 
  reviewId: ObjectId("REVIEW_ID") 
});

console.log('Review count:', review.reportCount);
console.log('Actual reports:', actualCount);
console.log('Match:', review.reportCount === actualCount);
```

### Check All Hidden Reviews
```javascript
// See all hidden reviews
db.reviews.find(
  { isHidden: true },
  { courseId: 1, reportCount: 1, isHidden: 1 }
).pretty();
```

## Testing Checklist

- [ ] Can report a review (success message)
- [ ] Cannot report same review twice (error message)
- [ ] Report count increments correctly
- [ ] Review hides at exactly 10 reports
- [ ] Review doesn't hide at 9 reports
- [ ] Hidden reviews don't appear on homepage
- [ ] Hidden reviews don't appear on faculty pages
- [ ] Hidden reviews don't appear on course pages
- [ ] Admin endpoints return correct data
- [ ] Database fields are updated correctly

## Troubleshooting

### Review Not Hiding?
1. Check `reportCount >= 10` in database
2. Check `isHidden: true` is set
3. Verify GET endpoint filters: `isHidden: { $ne: true }`
4. Clear browser cache and refresh

### Reports Not Counting?
1. Check MongoDB connection
2. Verify Report model exists
3. Check server logs for errors
4. Verify `reporterId` is consistent (should use email)

### Can Report Same Review Twice?
1. Check unique index: `db.reports.getIndexes()`
2. Verify `reporterId` uses email consistently
3. Check API returns 400 with error message

## Quick Reference

**Get Review ID:**
- From browser: Check network tab when loading reviews
- From database: `db.reviews.find({}, {_id: 1, courseId: 1}).limit(5)`

**Set Report Count:**
```javascript
db.reviews.updateOne(
  { _id: ObjectId("ID") },
  { $set: { reportCount: 9, isHidden: false } }
);
```

**Check Status:**
```bash
GET /api/admin/reviews/[reviewId]/status
```

**View Stats:**
```bash
GET /api/admin/reviews/stats
```


