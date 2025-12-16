# AI Integration Guide

This document describes the AI features integrated into the Course Review platform to enhance user experience and make the platform more useful.

## Overview

The platform now includes several AI-powered features that help users:
- Write better reviews with AI assistance
- Get quick summaries of course reviews
- Find courses using natural language search
- Get answers to questions based on existing reviews

## AI Features

### 1. AI Review Assistant

**Location:** Review Form (`components/review-form.tsx`)

**What it does:**
- Analyzes review content in real-time
- Provides suggestions for improvement
- Checks review completeness
- Offers tips for better reviews

**How to use:**
1. Start writing your review
2. Click the "AI Assistant" button (sparkles icon)
3. Review the suggestions provided:
   - **Completeness Score**: Shows how complete your review is (0-100%)
   - **Missing Items**: Suggests what to add (e.g., mention instructor, difficulty level)
   - **Improvements**: Points out areas that could be enhanced
   - **Tips**: Provides general advice for writing better reviews

**API Endpoint:** `/api/ai/review-assistant`

### 2. AI Review Summarization

**Location:** Course Detail Page (`app/course/[id]/page.tsx`)

**What it does:**
- Analyzes all reviews for a course
- Generates a comprehensive summary
- Identifies common themes
- Provides recommendations

**Features:**
- **Overall Rating**: Average rating from all reviews
- **Total Reviews**: Number of reviews analyzed
- **Sentiment Analysis**: Positive, neutral, or negative sentiment
- **Key Points**: Main takeaways from reviews
- **Common Themes**: Most frequently mentioned topics (Teaching Quality, Difficulty, Workload, etc.)
- **Recommendations**: AI-generated suggestions based on review data

**API Endpoint:** `/api/ai/summarize`

### 3. AI-Powered Semantic Search

**Location:** API Endpoint (`app/api/ai/search/route.ts`)

**What it does:**
- Understands natural language queries
- Finds courses based on meaning, not just exact matches
- Supports semantic matching (e.g., "programming" matches "code", "software development")

**Features:**
- Exact course ID matching
- Course name keyword matching
- Semantic term matching (related concepts)
- Relevance scoring

**How to use:**
The search API can be integrated into the search functionality. It accepts natural language queries and returns relevant courses with relevance scores.

**API Endpoint:** `/api/ai/search`

**Example Query:**
```json
{
  "query": "easy programming course for beginners"
}
```

### 4. AI Q&A Assistant

**Location:** Q&A Page (`app/qa/page.tsx`)

**What it does:**
- Answers questions about courses based on existing reviews
- Provides confidence scores
- Shows which reviews were used as sources
- Identifies related topics

**How to use:**
1. Navigate to the Q&A page
2. Find the "AI Q&A Assistant" card at the top
3. Type your question (e.g., "Is this course difficult?", "What's the workload like?")
4. Get an AI-generated answer based on student reviews

**Supported Question Types:**
- Difficulty questions: "Is this course hard?"
- Workload questions: "How much homework?"
- Teaching quality: "How is the professor?"
- Recommendations: "Should I take this course?"
- General questions about course content

**API Endpoint:** `/api/ai/qa-assistant`

## Technical Implementation

### Architecture

All AI features use a rule-based approach with semantic analysis. The system:
1. Analyzes text content
2. Extracts patterns and themes
3. Generates insights based on review data
4. Provides actionable suggestions

### API Structure

All AI endpoints follow this pattern:
- **Method**: POST (except search which can be GET)
- **Authentication**: Required for most endpoints
- **Response Format**: 
  ```json
  {
    "success": true,
    "data": { ... }
  }
  ```

### Future Enhancements

The current implementation uses rule-based AI. For production, you can enhance it by:

1. **Integrating OpenAI/Anthropic APIs:**
   - Replace rule-based logic with GPT-4 or Claude
   - Better natural language understanding
   - More nuanced responses

2. **Adding Vector Embeddings:**
   - Use embeddings for semantic search
   - Better course recommendations
   - Similar course suggestions

3. **Machine Learning Models:**
   - Train models on review data
   - Sentiment analysis improvements
   - Review quality scoring

## Environment Variables

No additional environment variables are required for the current implementation. If you want to integrate external AI services, you'll need:

```env
OPENAI_API_KEY=your_key_here
# or
ANTHROPIC_API_KEY=your_key_here
```

## Usage Examples

### Example 1: Getting Review Suggestions

```typescript
const response = await fetch('/api/ai/review-assistant', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    currentReview: "This course was good.",
    courseName: "Introduction to Computer Science",
    rating: 4
  })
})
```

### Example 2: Getting Course Summary

```typescript
const response = await fetch('/api/ai/summarize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    courseId: "261111"
  })
})
```

### Example 3: Asking AI Assistant

```typescript
const response = await fetch('/api/ai/qa-assistant', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: "Is this course difficult?",
    courseId: "261111" // optional
  })
})
```

## Benefits

1. **Better Reviews**: AI assistant helps users write more complete and helpful reviews
2. **Quick Insights**: Summaries provide instant overview of course quality
3. **Better Discovery**: Semantic search helps users find relevant courses
4. **Instant Answers**: Q&A assistant provides quick answers without reading all reviews

## Notes

- All AI features work client-side and server-side
- Responses are generated based on existing review data
- No external API calls are made in the current implementation
- All processing happens on your server

## Support

For issues or questions about AI features, check:
- API endpoint logs for errors
- Browser console for client-side issues
- Review the component code for implementation details
