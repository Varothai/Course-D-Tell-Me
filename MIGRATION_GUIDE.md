# Migration Guide: Adding reportCount and isHidden Fields

## Why You Don't See reportCount in Database

**The Problem:**
- The schema has `reportCount` and `isHidden` fields with defaults
- MongoDB **doesn't automatically add new fields to existing documents**
- Only **new documents** created after the schema change will have these fields
- **Existing reviews** won't have these fields until you migrate them

## Solution: Run Migration Script

### Step 1: Install Dependencies (if needed)
```bash
npm install mongoose dotenv
```

### Step 2: Run Migration
```bash
node scripts/migrate-add-report-fields.js
```

This script will:
- ✅ Find all reviews missing `reportCount` or `isHidden` fields
- ✅ Calculate actual report counts from the `reports` collection
- ✅ Set `reportCount` based on actual reports
- ✅ Set `isHidden: true` for reviews with 10+ reports
- ✅ Set defaults (0, false) for reviews with no reports

### Step 3: Verify
```javascript
// In MongoDB shell or Compass
// Check that all reviews now have the fields
db.reviews.find({ reportCount: { $exists: false } }).count()
// Should return 0

db.reviews.find({ isHidden: { $exists: false } }).count()
// Should return 0
```

## Manual Migration (Alternative)

If you prefer to do it manually in MongoDB:

```javascript
// Add fields to all reviews that don't have them
db.reviews.updateMany(
  { reportCount: { $exists: false } },
  { $set: { reportCount: 0 } }
);

db.reviews.updateMany(
  { isHidden: { $exists: false } },
  { $set: { isHidden: false } }
);

// For reviews with existing reports, calculate actual count
db.reviews.find({}).forEach(function(review) {
  const actualCount = db.reports.countDocuments({ reviewId: review._id });
  db.reviews.updateOne(
    { _id: review._id },
    { 
      $set: { 
        reportCount: actualCount,
        isHidden: actualCount >= 10
      }
    }
  );
});
```

## Verify Fields Exist

### Check in MongoDB Compass
1. Open your `reviews` collection
2. Look at any review document
3. You should see:
   - `reportCount: 0` (or actual number)
   - `isHidden: false` (or true if 10+ reports)

### Check via Query
```javascript
// Find a review and check fields
db.reviews.findOne({}, { reportCount: 1, isHidden: 1, courseId: 1 })

// Count reviews with/without fields
db.reviews.countDocuments({ reportCount: { $exists: true } })
db.reviews.countDocuments({ isHidden: { $exists: true } })
```

### Check via API
```javascript
// In browser console
fetch('/api/admin/reviews/[reviewId]/status')
  .then(r => r.json())
  .then(data => {
    console.log('Report count:', data.review.reportCount);
    console.log('Is hidden:', data.review.isHidden);
  });
```

## After Migration

Once migration is complete:
- ✅ All existing reviews will have `reportCount` and `isHidden` fields
- ✅ New reviews will automatically have these fields (set in POST endpoint)
- ✅ Report functionality will work correctly

## Troubleshooting

### Still Don't See Fields?
1. **Check collection name**: Make sure you're looking at the correct collection
2. **Refresh MongoDB Compass**: Sometimes you need to refresh the view
3. **Check query**: Make sure you're not filtering out documents
4. **Run migration again**: It's safe to run multiple times

### Fields Show as `undefined`?
- This means the field doesn't exist in that document
- Run the migration script to add it

### Want to See Fields in All Documents?
```javascript
// Force MongoDB to show all fields (even if null/undefined)
// In MongoDB Compass, don't use any filters
// Or use this query:
db.reviews.find({}).pretty()
```

## Quick Check Command

```javascript
// Quick check: How many reviews are missing fields?
db.reviews.aggregate([
  {
    $project: {
      hasReportCount: { $cond: [{ $ifNull: ["$reportCount", false] }, 1, 0] },
      hasIsHidden: { $cond: [{ $ifNull: ["$isHidden", false] }, 1, 0] }
    }
  },
  {
    $group: {
      _id: null,
      total: { $sum: 1 },
      withReportCount: { $sum: "$hasReportCount" },
      withIsHidden: { $sum: "$hasIsHidden" }
    }
  }
]);
```


