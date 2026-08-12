# 📡 REST API Reference Manual

The VideoRAG Studio Backend API exposes endpoints for video upload, pipeline processing, semantic vector search, dashboard statistics, and interactive AI assistance.

Base URL: `http://localhost:3000`

---

## 1. System Health Endpoints

### `GET /ping`
Lightweight ping check.
- **Response**: `200 OK`
```json
{
  "status": "ok",
  "service": "semantic-video-search",
  "timestamp": "2026-08-12T20:54:28.641Z"
}
```

### `GET /health`
Detailed health status across database, queue, and providers.
- **Response**: `200 OK`

---

## 2. Dashboard Endpoints

### `GET /api/dashboard/stats`
Fetch aggregated KPI statistics, storage usage, activity log, and weekly upload trends.
- **Query Params**: `userId` (string)
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "statistics": {
      "totalVideos": 19,
      "processingVideos": 0,
      "completedVideos": 15,
      "failedVideos": 4,
      "totalStorageBytes": 54503582,
      "totalDurationSeconds": 4622.1
    },
    "recentVideos": [],
    "recentActivities": [],
    "analytics": {
      "totalEmbeddings": 78,
      "avgProcessingTimeMs": 496099.14,
      "failureRatePercentage": 21.05,
      "weeklyUploads": []
    }
  }
}
```

---

## 3. Video & Lecture Management Endpoints

### `POST /api/lectures`
Upload a new video for automated AI pipeline processing.
- **Content-Type**: `multipart/form-data`
- **Body Fields**:
  - `userId` (string, required)
  - `title` (string, required)
  - `subject` (string, optional)
  - `fileType` (`"video"`)
  - `file` (binary video file, `.mp4`, `.webm`, `.wav`)
- **Response**: `201 Created`
```json
{
  "success": true,
  "data": {
    "lecture": {
      "_id": "6a7c8b4084dfd42f45a83b2b",
      "title": "Introduction to Neural Networks",
      "status": "queued",
      "createdAt": "2026-08-12T21:00:00.000Z"
    },
    "jobId": "6a7c8b4084dfd42f45a83b2d"
  }
}
```

### `GET /api/lectures`
Fetch all lectures for a specific user.
- **Query Params**: `userId` (string, required)
- **Response**: `200 OK`

### `GET /api/lectures/:id`
Fetch single lecture details including full transcript timeline, AI-generated chapters, summary, and video metadata.
- **Response**: `200 OK`

---

## 4. Semantic Vector Search Endpoint

### `POST /api/search`
Perform natural language semantic vector search against processed video chunks.
- **Body**:
```json
{
  "query": "What is backpropagation in neural networks?",
  "userId": "64a1b2c3d4e5f6a7b8c9d0e1",
  "topK": 5
}
```
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "query": "What is backpropagation in neural networks?",
    "results": [
      {
        "lectureId": "6a7c652ba36d7468f4d2f28e",
        "videoTitle": "Deep Learning & Neural Networks Lecture",
        "thumbnailUrl": "/uploads/videos/thumb-sample.jpg",
        "text": "During backpropagation, error gradients are propagated backwards through network layers...",
        "startTime": 145.2,
        "endTime": 182.5,
        "score": 0.892
      }
    ]
  }
}
```

---

## 5. AI Help Assistant Endpoint

### `POST /api/assistant/chat`
Send a question to the Gemini-powered AI Help Assistant.
- **Body**:
```json
{
  "message": "How do I jump to an exact timestamp from a search result?",
  "history": []
}
```
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "message": "To jump to an exact timestamp from a search result:\n\n1. Perform a query in the **Search** page.\n2. Click on any returned result card or timestamp badge.\n3. The app automatically navigates to the **Studio** page and seeks the video player directly to that second!"
  }
}
```
