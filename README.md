# Photography Coach AI 📸

A professional-grade photography analysis tool powered by **Google Gemini 3 Pro**.

This application acts as a personal mentor, analyzing your photos for composition, lighting, and technical execution. It provides spatial critiques with bounding boxes, AI-powered image enhancements, and an interactive mentor chat.

## ✨ Key Features

- **Gemini 3 Pro Analysis**: Deep, multi-modal reasoning about photography principles.
- **Spatial Critique**: Visual bounding boxes identifying specific flaws (e.g., "distracting background").
- **AI Restoration Studio**: Visualizes suggested improvements using generative AI.
- **Mentor Chat**: Interactive Q&A session with the AI about your specific photo.
- **Context Caching Economics**: Demonstrates the cost-saving potential of Gemini's context caching for high-volume analysis.

## 🚀 Getting Started

### Prerequisites

- A [Google AI Studio](https://aistudio.google.com/) API Key.
- Billing enabled project (for Gemini 3 Pro features).

### Environment Variables

You must provide your API Key. If running locally, you can create a `.env` file:

```env
API_KEY=your_google_api_key_here
```

## 🛠️ Tech Stack

- **Framework**: React 19
- **AI Model**: Google Gemini 3 Pro (via `@google/genai` SDK)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts

## 📝 License

MIT
