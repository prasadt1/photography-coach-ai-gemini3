# ARCHITECTURE.md

## System Architecture

Deep dive into Photography Coach AI's design patterns, data flow, and technical decisions.

---

## Table of Contents

1. [High-Level Architecture](#high-level-architecture)
2. [Component Architecture](#component-architecture)
3. [Data Flow](#data-flow)
4. [API Integration](#api-integration)
5. [State Management](#state-management)
6. [Performance Optimizations](#performance-optimizations)

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    React + TypeScript Frontend                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  App Component (Orchestrator)                            │  │
│  │  • State management (photo, analysis, chat)              │  │
│  │  • Error handling & loading states                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌─────────────────┬──────────────────────┬────────────────┐   │
│  │ PhotoUploader   │  AnalysisResults     │  SpatialOverlay│   │
│  │ • Drag-drop UI  │  (5-tab dashboard)   │  • Canvas      │   │
│  │ • Image preview │  • Overview          │  • Bounding    │   │
│  │ • File validation│ • Detailed Analysis  │    boxes       │   │
│  │                 │  • Mentor Chat       │  • Severity    │   │
│  │                 │  • AI Enhancement    │    colors      │   │
│  │                 │  • Economics         │                │   │
│  └─────────────────┴──────────────────────┴────────────────┘   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  geminiService.ts (API Layer)                          │    │
│  │  • analyzeImage() → Vision API + thinking process      │    │
│  │  • generateCorrectedImage() → Image generation API     │    │
│  │  • askPhotographyMentor() → Multi-turn chat           │    │
│  │  • handleErrors() → Graceful degradation              │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│               Google Gemini 3 Pro APIs (Backend)                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  gemini-3-pro-preview (Vision + Reasoning)               │  │
│  │  • Input: Photo (base64) + Photography principles       │  │
│  │  • Process: Advanced reasoning with extended thinking   │  │
│  │  • Output: JSON {scores, critique, thinking, boxes}    │  │
│  │  • Cost: ~$0.00217 per request (with caching)          │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  gemini-3-pro-image-preview (Image Generation)           │  │
│  │  • Input: Prompt describing desired improvements        │  │
│  │  • Process: Generate corrected image at 1K resolution   │  │
│  │  • Output: Base64 encoded improved photo               │  │
│  │  • Cost: ~$0.00625 per request                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Context Caching Layer (Cost Optimization)              │  │
│  │  • Cached: Photography principles (32KB+ prefix)        │  │
│  │  • Hit rate: ~75% of requests use cache               │  │
│  │  • Savings: 90% reduction on cached token cost         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### App.tsx (Orchestrator)

**Responsibilities:**
- Main application state management
- Photo upload handling
- API call orchestration
- Error boundary & recovery
- Tab navigation state

**State Structure:**
```typescript
interface AppState {
  photo: {
    file: File | null
    base64: string | null
    preview: string | null
  }
  analysis: {
    scores: { [key: string]: number }
    critique: string
    thinking: string
    bounding_boxes: BoundingBox[]
  }
  correctedImage: string | null
  conversation: ConversationMessage[]
  loading: boolean
  error: string | null
  activeTab: 'overview' | 'analysis' | 'chat' | 'enhancement' | 'economics'
}
```

### PhotoUploader.tsx

**Responsibilities:**
- Drag-and-drop file upload
- Image validation
- File size checking
- Preview generation
- Thinking process UI during analysis

**Key Features:**
- Accepts JPEG, PNG, WebP
- Max 10MB file size
- Displays loader during processing
- Shows thinking process from Gemini
- Error messages for validation failures

### AnalysisResults.tsx

**Responsibilities:**
- Multi-tab dashboard rendering
- 5 distinct analysis views
- Chat interface for mentor
- Before/after image comparison
- Cost calculation display

**Tabs:**

1. **Overview**
   - Coach's verdict (text)
   - Overall scores (radar chart)
   - Skill badge (Beginner/Intermediate/Advanced)
   - Key strengths & weaknesses
   - Next skills to master

2. **Detailed Analysis**
   - Thinking process breakdown
   - Step-by-step reasoning
   - Priority fixes with severity
   - Confidence scores
   - Reference knowledge used

3. **Mentor Chat**
   - Multi-turn conversation
   - Message history
   - Turn counter (e.g., 2/5)
   - Input field with send button
   - Loading indicator for responses

4. **AI Enhancement**
   - Before/after image comparison
   - Applied improvements list
   - Generation details (time, quality)
   - Technical settings comparison
   - Download enhanced image

5. **Economics**
   - Token cost breakdown
   - Cache hit rate visualization
   - Per-photo cost calculation
   - Savings at scale (1K, 10K, 100K photos)
   - Caching efficiency metrics

### SpatialOverlay.tsx

**Responsibilities:**
- Canvas-based image rendering
- Bounding box visualization
- Severity color coding
- Interactive hover effects
- Mobile-responsive drawing

**Visual Elements:**
- Red boxes: Critical flaws
- Orange boxes: Moderate issues
- Yellow boxes: Minor suggestions
- Severity labels with tooltips
- Spatial accuracy (pixel-perfect)

### geminiService.ts

**Responsibilities:**
- Gemini API integration
- Request/response handling
- Error recovery
- Context caching management
- Conversation history tracking

**Key Functions:**

```typescript
// Vision analysis with thinking
analyzeImage(
  imagePath: string,
  skillLevel: 'beginner' | 'intermediate' | 'advanced'
): Promise<AnalysisResult>

// Generate improved image
generateCorrectedImage(
  originalImagePath: string,
  improvements: string[]
): Promise<string>

// Interactive mentor chat
askPhotographyMentor(
  query: string,
  analysisResult: AnalysisResult,
  conversationHistory: Message[]
): Promise<string>

// Cost calculation
calculateTokenCost(
  model: string,
  tokens: number,
  cached: boolean
): number
```

---

## Data Flow

### 1. Photo Upload Flow

```
User Upload
    ↓
PhotoUploader validates
    ↓
Convert to base64
    ↓
Preview displayed locally
    ↓
User clicks "Analyze"
    ↓
Send to geminiService.analyzeImage()
    ↓
Display thinking process
    ↓
Receive JSON response
    ↓
Parse scores, critique, boxes
    ↓
Update App state
    ↓
Render AnalysisResults with all tabs
```

### 2. Analysis Pipeline

```
Photo (base64) + Photography Principles
    ↓
Gemini 3 Pro Vision API
    ↓
Advanced Reasoning Process
    ↓
Generate JSON Output:
  {
    "scores": {
      "composition": 7.2,
      "lighting": 6.8,
      "technique": 8.1,
      "creative_impact": 7.5,
      "subject_impact": 8.3
    },
    "critique": "Detailed feedback...",
    "thinking": "Step-by-step reasoning...",
    "bounding_boxes": [
      {
        "x": 150,
        "y": 200,
        "width": 100,
        "height": 80,
        "label": "Overexposed highlights",
        "severity": "critical"
      }
    ]
  }
    ↓
Frontend parses & visualizes
    ↓
Display in all 5 tabs
```

### 3. Multi-Turn Mentor Chat Flow

```
User Question
    ↓
Frontend sends with conversation context
    ↓
geminiService.askPhotographyMentor()
    ↓
Include previous analysis in context
    ↓
Include conversation history
    ↓
Include cached photography principles
    ↓
Gemini generates response
    ↓
Extract thinking process
    ↓
Parse and display
    ↓
Add to conversation history
    ↓
Update UI (turn counter increments)
```

---

## API Integration

### Gemini Vision API

**Endpoint:** `POST /v1beta/models/gemini-3-pro-preview:generateContent`

**Request Structure:**
```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "Analyze this photo. Return: 1) 5 scores, 2) critique, 3) 3-4 bounding boxes"
        },
        {
          "inline_data": {
            "mime_type": "image/jpeg",
            "data": "base64_encoded_image"
          }
        }
      ]
    }
  ],
  "generationConfig": {
    "responseSchema": {
      "type": "object",
      "properties": {
        "scores": { "type": "object" },
        "critique": { "type": "string" },
        "thinking": { "type": "string" },
        "bounding_boxes": { "type": "array" }
      }
    }
  }
}
```

**Response Structure:**
```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "{json response}"
          }
        ]
      },
      "thinking": "Step-by-step reasoning..."
    }
  ],
  "usageMetadata": {
    "promptTokens": 2500,
    "cachedPromptTokens": 2400,
    "outputTokens": 500
  }
}
```

### Image Generation API

**Endpoint:** `POST /v1beta/models/gemini-3-pro-image-preview:generateContent`

**Request:**
```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "Improve this photo by: [improvements]. Return 1K resolution image."
        },
        {
          "inline_data": {
            "mime_type": "image/jpeg",
            "data": "base64_original"
          }
        }
      ]
    }
  ]
}
```

---

## State Management

**Current Approach:** React Hooks (useState, useContext)

**Why:** 
- Sufficient for single-page app complexity
- No need for Redux/Zustand overhead
- Easy to test and debug
- Fast context caching means less state churn

**Future Consideration:** If app scales to 10+ tabs or complex workflows, consider Zustand or Redux for predictable state transitions.

---

## Performance Optimizations

### 1. Context Caching (75% Cost Reduction)

```typescript
// Photography principles cached as system prompt
const CACHED_SYSTEM_PROMPT = `
You are a professional photography coach with 20+ years experience.
Analyze photos across these 5 dimensions:
1. Composition (rule of thirds, framing, depth)
2. Lighting (quality, color temperature, direction)
3. Technical (exposure, focus, sharpness, color balance)
4. Creative Impact (storytelling, emotion, uniqueness)
5. Subject Impact (subject clarity, interest, presentation)

[32KB+ of photography principles, techniques, examples]
`;

// This prompt is cached on first request
// Subsequent requests reuse cached tokens (90% cost reduction on this part)
```

### 2. Image Compression

```typescript
// Compress image before sending to API
async function compressImage(file: File): Promise<string> {
  const canvas = await createCanvas(file)
  const compressed = canvas.toDataURL('image/jpeg', 0.85) // 85% quality
  return compressed.split(',')[1] // Return base64
}
```

### 3. Component Code Splitting

- AnalysisResults lazily loaded
- SpatialOverlay only rendered when needed
- Chat interface optimized for performance
- Vite handles automatic splitting

### 4. Memoization

```typescript
// Prevent re-renders of expensive components
const SpatialOverlay = React.memo(SpatialOverlayComponent)
const AnalysisResults = React.memo(AnalysisResultsComponent)
```

---

## Error Handling

### Graceful Degradation

```
API Error
    ↓
Try cached response?
    ├─ Yes: Use cached analysis
    └─ No: Show fallback message
    ↓
Display "Retry" button
    ↓
User can re-upload photo
```

### Common Errors

| Error | Cause | Resolution |
|-------|-------|-----------|
| `RESOURCE_EXHAUSTED` | API quota exceeded | Wait and retry, upgrade API tier |
| `INVALID_ARGUMENT` | Image format unsupported | Convert to JPEG/PNG |
| `PERMISSION_DENIED` | API key invalid | Verify key in env variables |
| `DEADLINE_EXCEEDED` | Request timeout | Compress image, retry |

---

## Security Considerations

1. **API Key Protection**
   - Never expose in frontend code
   - Use environment variables only
   - Keys are client-side, but Google API secures them

2. **Image Privacy**
   - Photos sent directly to Google APIs
   - We don't store images
   - No server-side processing
   - HTTPS for all communication

3. **User Data**
   - Conversation history stored locally (browser)
   - Option to clear all data
   - No third-party analytics

---

## Future Architecture Improvements

1. **Add Backend Server**
   - Rate limiting per user
   - API key proxying (increased security)
   - Session persistence across devices
   - User accounts & history

2. **Database**
   - Store analysis history
   - User preferences
   - Conversation archives
   - Performance metrics

3. **Advanced Caching**
   - Redis for distributed caching
   - Session management
   - Response caching layer

4. **Monitoring**
   - Error tracking (Sentry)
   - Performance monitoring (Web Vitals)
   - Usage analytics
   - Cost tracking

---

**Last Updated:** December 2025  
**Architecture Version:** 1.0