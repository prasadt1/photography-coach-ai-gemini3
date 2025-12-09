# API_REFERENCE.md

## Gemini 3 Pro API Integration Reference

Complete guide to how Photography Coach AI integrates with Google Gemini APIs.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Vision Analysis](#vision-analysis)
3. [Image Generation](#image-generation)
4. [Context Caching](#context-caching)
5. [Error Handling](#error-handling)
6. [Rate Limits & Quotas](#rate-limits--quotas)
7. [Cost Optimization](#cost-optimization)

---

## Quick Start

### Get API Key

1. Go to [ai.google.dev](https://ai.google.dev)
2. Click "Get API Key in Google AI Studio"
3. Create new project (or use existing)
4. Click "Create API Key"
5. Copy key to `.env.local`:

```env
VITE_GEMINI_API_KEY=your_key_here
```

### Test Installation

```typescript
import { analyzeImage } from './services/geminiService'

// Test with sample image
const result = await analyzeImage('path/to/photo.jpg', 'intermediate')
console.log(result.scores) // Should print scores object
```

---

## Vision Analysis

### Overview

The vision analysis endpoint evaluates photos across 5 dimensions using advanced reasoning.

### API Details

- **Model:** `gemini-3-pro-preview`
- **Type:** Multimodal (text + image input)
- **Input:** Photo (JPEG/PNG/WebP) + analysis prompt
- **Output:** JSON with scores, critique, thinking, bounding boxes
- **Cost:** ~$0.00217/request (with caching)
- **Latency:** 2-4 seconds

### Request Format

```typescript
async function analyzeImage(
  imagePath: string,
  skillLevel: 'beginner' | 'intermediate' | 'advanced'
): Promise<AnalysisResult>
```

### Example Request

```typescript
const analysis = await analyzeImage('photo.jpg', 'intermediate')

// Response structure:
interface AnalysisResult {
  scores: {
    composition: number      // 0-10
    lighting: number         // 0-10
    technique: number        // 0-10
    creative_impact: number  // 0-10
    subject_impact: number   // 0-10
  }
  critique: string           // Detailed feedback
  thinking: string           // Reasoning process
  bounding_boxes: Array<{
    x: number                // Pixel coordinate
    y: number                // Pixel coordinate
    width: number            // Box width
    height: number           // Box height
    label: string            // Issue description
    severity: 'critical' | 'moderate' | 'minor'
  }>
  suggested_improvements: string[]
}
```

### Prompt Structure

```typescript
const systemPrompt = `
You are a professional photography coach with 20+ years experience.
Analyze the provided photo across 5 dimensions:

1. COMPOSITION (Rule of thirds, framing, leading lines, depth, balance)
2. LIGHTING (Quality, direction, color temperature, shadows, highlights)
3. TECHNIQUE (Exposure, focus, sharpness, color balance, white balance)
4. CREATIVE IMPACT (Storytelling, emotion, uniqueness, artistic merit)
5. SUBJECT IMPACT (Subject clarity, interest level, presentation, prominence)

For each dimension, provide a score 0-10.

Also identify 3-4 specific issues as bounding boxes with:
- Pixel coordinates (x, y, width, height)
- Issue description
- Severity: critical/moderate/minor

For skill level [INTERMEDIATE], focus on:
- Technical mastery and consistency
- Creative experimentation opportunities
- Refining weak areas while building on strengths

Respond in valid JSON format.
`
```

### Success Response Example

```json
{
  "scores": {
    "composition": 7.2,
    "lighting": 6.8,
    "technique": 8.1,
    "creative_impact": 7.5,
    "subject_impact": 8.3
  },
  "critique": "Strong technical execution with excellent focus and sharpness...",
  "thinking": "Step 1: Analyzed composition... Step 2: Evaluated lighting...",
  "bounding_boxes": [
    {
      "x": 150,
      "y": 200,
      "width": 100,
      "height": 80,
      "label": "Slightly overexposed highlights in sky",
      "severity": "moderate"
    }
  ],
  "suggested_improvements": [
    "Reduce exposure compensation by -0.3 EV",
    "Consider using circular polarizer for deeper sky",
    "Frame slightly higher to reduce foreground"
  ]
}
```

---

## Image Generation

### Overview

Generate improved versions of photos based on coaching feedback.

### API Details

- **Model:** `gemini-3-pro-image-preview`
- **Type:** Image generation
- **Input:** Original photo + improvement prompt
- **Output:** Base64 encoded improved image (1K resolution)
- **Cost:** ~$0.00625/request
- **Latency:** 4-8 seconds

### Request Format

```typescript
async function generateCorrectedImage(
  originalImagePath: string,
  improvements: string[]
): Promise<string>  // Returns base64 encoded image
```

### Example Usage

```typescript
const improvements = [
  "Increase exposure by 0.5 EV to brighten shadows",
  "Enhance color saturation by 15%",
  "Sharpen midtones for better definition",
  "Reduce highlights clipping in sky area"
]

const improvedImageBase64 = await generateCorrectedImage(
  'photo.jpg',
  improvements
)

// Display in UI
const img = document.querySelector('img')
img.src = `data:image/jpeg;base64,${improvedImageBase64}`
```

### Improvement Prompt Generation

```typescript
function createImprovementPrompt(
  originalPhoto: Blob,
  improvements: string[]
): string {
  return `
You are a professional photo editor. Improve this photo by applying these adjustments:

${improvements.map((imp, i) => `${i + 1}. ${imp}`).join('\n')}

Requirements:
- Maintain natural appearance (avoid oversaturation/over-processing)
- Output at 1K resolution (1024x768 or similar)
- Preserve subject integrity
- Apply adjustments subtly but noticeably

Generate the improved photo.
  `
}
```

### Response Format

```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "inline_data": {
              "mime_type": "image/jpeg",
              "data": "base64_encoded_improved_image"
            }
          }
        ]
      }
    }
  ],
  "usageMetadata": {
    "outputTokens": 1024
  }
}
```

---

## Context Caching

### How It Works

The same photography principles are used for every analysis. Gemini API caches this content on the first request, then reuses it for subsequent requests at 90% cost reduction.

### Setup

```typescript
// Photography principles (cached)
const PHOTOGRAPHY_PRINCIPLES = `
COMPOSITION FUNDAMENTALS:
- Rule of Thirds: Divide frame into 9 equal parts...
- Leading Lines: Use natural or artificial lines to guide viewer...
- Depth of Field: Control focus separation between subject and background...
[... 32KB of cached content ...]
`

// First request: Caches this content
// Subsequent requests: Reuse at 90% cost reduction
```

### Cache Metrics

```typescript
interface CacheMetrics {
  promptTokens: number           // New tokens in this request
  cachedPromptTokens: number     // Tokens reused from cache
  cacheHitRate: number           // Percentage (0-100)
  costReduction: number          // Amount saved vs. non-cached
}

// Example:
{
  promptTokens: 100,
  cachedPromptTokens: 2500,
  cacheHitRate: 96.2,
  costReduction: 0.04  // $0.04 saved on this request
}
```

### Enable Caching in Code

```typescript
const request = {
  contents: [{
    role: 'user',
    parts: [
      { text: PHOTOGRAPHY_PRINCIPLES + '\n\nAnalyze this photo...' },
      { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } }
    ]
  }],
  systemInstruction: {
    parts: [{ text: PHOTOGRAPHY_PRINCIPLES }]
  }
}

// Gemini API automatically:
// 1. Hashes PHOTOGRAPHY_PRINCIPLES
// 2. Caches on first request (4min TTL)
// 3. Reuses on subsequent requests
```

### Cost Comparison

| Scenario | Tokens | Cost Without Cache | Cost With Cache | Savings |
|----------|--------|-------------------|-----------------|---------|
| 1 photo | 3,600 | $0.00217 | $0.00217 | — |
| 10 photos | 36,000 | $0.0217 | $0.01953 | $0.00217 (10%) |
| 100 photos | 360,000 | $0.217 | $0.1953 | $0.0217 (10%) |
| 1,000 photos | 3.6M | $2.17 | $1.955 | $0.215 (10%) |

*Note: Actual savings depend on request volume and cache hit rate*

---

## Error Handling

### Common Errors

#### 1. Invalid API Key

```
Error: "PERMISSION_DENIED"
Message: "Could not verify the provided API key"

Fix:
- Verify key in .env.local
- Check key is valid in Google AI Studio
- Regenerate key if necessary
```

#### 2. Resource Exhausted

```
Error: "RESOURCE_EXHAUSTED"
Message: "API quota exceeded"

Fix:
- Implement exponential backoff retry
- Wait 60 seconds before retrying
- Check quota in Google Cloud Console
- Upgrade to paid plan if needed
```

#### 3. Invalid Image Format

```
Error: "INVALID_ARGUMENT"
Message: "Image format not supported"

Fix:
- Ensure image is JPEG, PNG, or WebP
- Check file size < 10MB
- Compress image before upload
- Try different format
```

#### 4. Request Timeout

```
Error: "DEADLINE_EXCEEDED"
Message: "Request took too long"

Fix:
- Reduce image size
- Simplify analysis prompt
- Retry with exponential backoff
- Check network connection
```

### Retry Logic

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | null = null

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      const delay = delayMs * Math.pow(2, i)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

// Usage:
const analysis = await withRetry(() => analyzeImage(photo, 'intermediate'))
```

---

## Rate Limits & Quotas

### Free Tier Limits

| Resource | Limit | Period |
|----------|-------|--------|
| Requests | 60 | Per minute |
| Images | 1,500 | Per day |
| Tokens | 1M | Per day |

### Paid Tier Limits

| Resource | Limit |
|----------|-------|
| Requests | 1,000 per minute |
| Images | Unlimited |
| Tokens | Based on usage |

### Check Current Usage

```bash
# View quota in Google Cloud Console
gcloud compute project-info describe --project=YOUR_PROJECT_ID

# Or via API:
curl "https://generativelanguage.googleapis.com/v1beta/quotas?key=YOUR_KEY"
```

### Stay Within Limits

```typescript
class RateLimiter {
  private queue: Array<() => Promise<any>> = []
  private processing = false

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
      this.process()
    })
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return

    this.processing = true
    while (this.queue.length > 0) {
      const fn = this.queue.shift()
      if (fn) await fn()
      await new Promise(resolve => setTimeout(resolve, 1000)) // 1 req/sec
    }
    this.processing = false
  }
}
```

---

## Cost Optimization

### Strategies

#### 1. Use Context Caching

- Save 90% on cached token costs
- Photography principles cached automatically
- Re-use across 1,000s of photos

#### 2. Compress Images

```typescript
async function compressImage(file: File): Promise<string> {
  const canvas = await new Promise<HTMLCanvasElement>(resolve => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      canvas.width = 1024  // Max dimension
      canvas.height = 768
      ctx.drawImage(img, 0, 0, 1024, 768)
      resolve(canvas)
    }
    img.src = URL.createObjectURL(file)
  })

  return canvas.toDataURL('image/jpeg', 0.8).split(',')[1]
}
```

#### 3. Batch Processing

```typescript
async function analyzeBatch(
  images: File[],
  batchSize = 10
): Promise<AnalysisResult[]> {
  const results: AnalysisResult[] = []

  for (let i = 0; i < images.length; i += batchSize) {
    const batch = images.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(img => analyzeImage(img, 'intermediate'))
    )
    results.push(...batchResults)

    // Cache hit increases with each batch
    // Cost per photo decreases over time
  }

  return results
}
```

#### 4. Reuse Analysis Results

```typescript
// Don't re-analyze same photo
const cache = new Map<string, AnalysisResult>()

async function analyzeWithCache(
  photo: File,
  skillLevel: string
): Promise<AnalysisResult> {
  const hash = await sha256(photo)
  const key = `${hash}-${skillLevel}`

  if (cache.has(key)) {
    return cache.get(key)!
  }

  const result = await analyzeImage(photo, skillLevel)
  cache.set(key, result)
  return result
}
```

### Cost Calculator

```typescript
function estimateCost(
  photoCount: number,
  withCaching = true
): { perPhoto: number; total: number } {
  const visionCost = 0.00217
  const cachePenalty = 1.0 // First request
  const cacheReduction = 0.1 // Subsequent requests (90% discount)

  const firstPhotoCost = visionCost * cachePenalty
  const cachedPhotoCost = visionCost * cacheReduction

  const total = withCaching
    ? firstPhotoCost + (photoCount - 1) * cachedPhotoCost
    : visionCost * photoCount

  return {
    perPhoto: total / photoCount,
    total
  }
}

// Examples:
console.log(estimateCost(1, true))      // $0.00217 per photo
console.log(estimateCost(1000, true))   // $0.00220 per photo
console.log(estimateCost(1000, false))  // $0.00217 per photo (no cache benefit)
```

---

## Monitoring

### Log API Calls

```typescript
function logAPICall(
  model: string,
  tokens: number,
  cachedTokens: number,
  costUSD: number,
  latencyMs: number
) {
  console.log(`[API] ${model}`)
  console.log(`  Tokens: ${tokens} (cached: ${cachedTokens})`)
  console.log(`  Cost: $${costUSD.toFixed(5)}`)
  console.log(`  Latency: ${latencyMs}ms`)
}
```

### Track Costs Over Time

```typescript
interface CostMetrics {
  totalCost: number
  totalRequests: number
  averageCostPerRequest: number
  cachedTokensUsed: number
  savingsFromCache: number
}

class CostTracker {
  metrics: CostMetrics = {
    totalCost: 0,
    totalRequests: 0,
    averageCostPerRequest: 0,
    cachedTokensUsed: 0,
    savingsFromCache: 0
  }

  recordRequest(
    cost: number,
    cachedTokens: number,
    totalTokens: number
  ) {
    this.metrics.totalCost += cost
    this.metrics.totalRequests += 1
    this.metrics.cachedTokensUsed += cachedTokens
    
    // Cache saves 90% on cached tokens
    const savedCost = (cachedTokens / 1000000) * 0.00001875 * 0.9
    this.metrics.savingsFromCache += savedCost

    this.metrics.averageCostPerRequest =
      this.metrics.totalCost / this.metrics.totalRequests
  }
}
```

---

## Resources

- **API Docs:** [ai.google.dev/docs](https://ai.google.dev/docs)
- **Pricing:** [ai.google.dev/pricing](https://ai.google.dev/pricing)
- **Models:** [ai.google.dev/models](https://ai.google.dev/models)
- **Cloud Console:** [console.cloud.google.com](https://console.cloud.google.com)
- **Issues:** [GitHub Issues](https://github.com/prasadt1/photography-coach-ai/issues)

---

**Last Updated:** December 2025  
**API Version:** Gemini 3 Pro