# Product Requirements Document (PRD)
# Speech Recording & Real-Time Transcription POC

| Field            | Value                                          |
|------------------|------------------------------------------------|
| **Project Name** | Speech Recording & Real-Time Transcription POC |
| **Version**      | 1.0                                            |
| **Date**         | March 26, 2026                                 |
| **Status**       | Draft                                          |
| **Author**       | Nabeel Phull                                   |

---

## 1. Executive Summary

This document describes a **Proof of Concept (POC)** application that demonstrates the feasibility of recording a live conversation via a device microphone (PC or mobile), streaming the audio to Azure for persistent storage, and producing real-time (or near real-time) transcription displayed back to the user. **This is explicitly a POC** — the goal is to prove the technical concept and validate the end-to-end integration of Azure services, not to deliver a production-grade product.

---

## 2. Problem Statement

Organizations need a lightweight way to capture spoken conversations, store the raw audio for archival/compliance purposes, and generate a live text transcript. Today this often requires expensive proprietary tools or complex custom integrations. This POC will prove that a minimal-cost, Azure-native solution can satisfy these core requirements using modern cloud services and browser APIs.

---

## 3. Goals & Success Criteria

### 3.1 POC Goals

| # | Goal | Description |
|---|------|-------------|
| G1 | **Prove real-time transcription** | Demonstrate that audio captured from a device microphone can be transcribed in real-time (or near real-time) using Azure Speech Service and displayed in a web UI. |
| G2 | **Prove audio recording to cloud storage** | Demonstrate that the captured audio can be streamed/uploaded to Azure Blob Storage for persistent archival. |
| G3 | **Prove cross-device microphone capture** | Show that the solution works on both desktop (PC) and mobile phone browsers. |
| G4 | **Validate Azure service integration** | Confirm that Azure Speech Service and Azure Blob Storage can be composed together in a lightweight architecture. |
| G5 | **Minimal viable UX** | Provide a simple UI with start/stop recording controls and a live transcript display area. |

### 3.2 Success Criteria

| Criterion | Measurement |
|-----------|-------------|
| Audio is captured from the device microphone | User can click "Start Recording" and the app accesses the microphone |
| Live transcription appears in the UI | Recognized text is displayed within ~2-5 seconds of speech |
| Audio file is stored in Azure Blob Storage | After recording stops, a playable audio file exists in the designated Blob container |
| Works on Chrome (desktop) and Chrome/Safari (mobile) | Manual verification on at least two device types |
| End-to-end demo completes without errors | A full recording → transcription → storage cycle completes successfully |

### 3.3 Explicit Non-Goals (POC Scope Boundary)

- **Production hardening** — No HA, DR, auto-scaling, or SLA guarantees.
- **User authentication / multi-tenancy** — Single anonymous user for demonstration.
- **Speaker diarization** — Identifying *who* spoke is out of scope (though noted as a future enhancement).
- **Custom speech models** — The POC will use the default Azure Speech base model.
- **Offline / edge support** — Requires an active internet connection.
- **Long-running recordings (>30 min)** — POC targets short to medium conversations.
- **Mobile native apps** — Browser-based only; no iOS/Android native builds.
- **CI/CD pipeline or automated testing** — Manual deployment is acceptable.
- **Cost optimization** — POC-level consumption is acceptable; no budget thresholds.

---

## 4. Target Users

| Persona | Description |
|---------|-------------|
| **POC Evaluator** | Internal stakeholder who wants to see a working demonstration of the concept. |
| **Developer** | Engineer who will build upon the POC if the concept is validated. |

---

## 5. Technical Architecture

### 5.1 Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                      User's Browser                          │
│  ┌─────────────────┐   ┌──────────────────────────────────┐  │
│  │   React Web App │   │  Azure Speech SDK (JavaScript)   │  │
│  │                 │   │  - Continuous Recognition Mode   │  │
│  │  ┌───────────┐  │   │  - fromDefaultMicrophoneInput()  │  │
│  │  │ Mic Audio │──┤───│──► Real-time STT events          │  │
│  │  └───────────┘  │   │    (recognizing / recognized)    │  │
│  │                 │   └────────────────┬─────────────────┘  │
│  │  ┌───────────┐  │                    │                    │
│  │  │ Transcript│◄─┤────────────────────┘                    │
│  │  │  Display  │  │                                         │
│  │  └───────────┘  │                                         │
│  │                 │                                         │
│  │  ┌───────────┐  │   MediaRecorder API                     │
│  │  │  Audio    │──┤──────────────────────┐                  │
│  │  │ Recorder  │  │                      │                  │
│  │  └───────────┘  │                      │                  │
│  └─────────────────┘                      │                  │
└───────────────────────────────────────────┼──────────────────┘
                                            │
                    ┌───────────────────────────────────────┐
                    │         Node.js / Express Backend     │
                    │                                       │
                    │  /api/get-speech-token                │
                    │    → Issues ephemeral auth tokens     │
                    │      for Azure Speech Service         │
                    │                                       │
                    │  /api/upload-audio                    │
                    │    → Receives audio blob from client  │
                    │    → Uploads to Azure Blob Storage    │
                    └──────────┬──────────┬─────────────────┘
                               │          │
              ┌────────────────┘          └────────────────┐
              ▼                                            ▼
┌──────────────────────────┐            ┌──────────────────────────┐
│   Azure Speech Service   │            │   Azure Blob Storage     │
│   (Foundry Resource)     │            │                          │
│                          │            │  Container:              │
│  - Real-time STT         │            │    "recordings"          │
│  - Continuous recognition│            │                          │
│  - WebSocket streaming   │            │  Blob naming:            │
│  - en-US (configurable)  │            │   {timestamp}_{guid}.webm│
└──────────────────────────┘            └──────────────────────────┘
```

### 5.2 Data Flow

1. **User clicks "Start Recording"** in the browser UI.
2. **Browser requests microphone permission** via the Web Audio / MediaDevices API.
3. **Two parallel audio streams are established:**
   - **Stream A (Transcription):** The Azure Speech SDK for JavaScript uses `AudioConfig.fromDefaultMicrophoneInput()` to open a WebSocket connection to the Azure Speech Service. The SDK fires `recognizing` events (intermediate/partial results) and `recognized` events (final results) which are displayed in the UI in real-time.
   - **Stream B (Recording):** The browser's `MediaRecorder` API captures raw audio chunks. These chunks are accumulated in memory (or periodically sent to the backend).
4. **User clicks "Stop Recording".**
5. **The accumulated audio is assembled into a Blob** and sent via an HTTP POST to the Node.js backend endpoint `/api/upload-audio`.
6. **The backend uploads the audio file to Azure Blob Storage** using the `@azure/storage-blob` SDK.
7. **The transcript text is also saved** (either alongside the audio blob as metadata, or as a separate text blob).

### 5.3 Authentication Flow (Speech Service)

The POC follows the **token exchange pattern** recommended by Microsoft to avoid exposing the Speech subscription key in the browser:

1. The React frontend calls the backend at `/api/get-speech-token`.
2. The backend uses the Speech subscription key to request an ephemeral authorization token from the Azure Speech REST API (`https://{region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`).
3. The token (valid for 10 minutes) is returned to the frontend.
4. The frontend uses `SpeechConfig.fromAuthorizationToken(token, region)` — the subscription key is never exposed to the browser.
5. Token refresh is handled on a ~9-minute cycle using a cookie or in-memory timer.

---

## 6. Azure Services

### 6.1 Services Used

| Azure Service | Purpose | SKU / Tier (POC) | Key Configuration |
|---------------|---------|-------------------|-------------------|
| **Azure Speech Service** (via Microsoft Foundry Resource) | Real-time speech-to-text transcription | Free tier (F0) — 5 hours/month of STT | Region: select closest; Recognition language: `en-US` |
| **Azure Blob Storage** | Persistent storage of recorded audio files and transcripts | Standard LRS (locally-redundant) — General Purpose v2 | Container: `recordings`; Access: Private; Hot tier |
| **Azure App Service** (optional for hosting) | Host the Node.js backend + React frontend | Free tier (F1) or Basic (B1) | Node.js 20 LTS runtime |

### 6.2 Why These Services?

| Decision | Rationale |
|----------|-----------|
| **Azure Speech Service for transcription** | Native real-time STT via WebSocket with the JavaScript Speech SDK. Supports continuous recognition mode with interim results. Microsoft's recommended approach for browser-based speech apps. |
| **MediaRecorder API for audio capture** | Browser-native, no plugins required. Works on desktop and mobile. Records in WebM/Opus format which is compact and widely supported. |
| **Azure Blob Storage for recording persistence** | Simple, cost-effective object storage. Direct SDK support from Node.js. Suitable for large audio files. |
| **Node.js/Express backend** | Lightweight, JavaScript-native server. Handles token exchange securely. Proxies audio uploads to Blob Storage. Same language as frontend simplifies development. |
| **React frontend** | Microsoft's official Speech SDK sample (`AzureSpeechReactSample`) uses React. Component model suits the POC UI well. |

### 6.3 Azure Resource Provisioning

The following Azure resources need to be created for the POC:

1. **Resource Group** — `rg-speech-poc`
2. **Microsoft Foundry Resource (Speech)** — Create via Azure Portal (`Microsoft.CognitiveServicesAIFoundry`). Retrieve the endpoint and key.
3. **Storage Account** — `stspeechpoc` (Standard LRS, GPv2). Create container `recordings` with private access.
4. (Optional) **App Service** — For hosting; during local development, `localhost` is sufficient.

---

## 7. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React (with TypeScript) | 18.x+ |
| **Speech SDK** | `microsoft-cognitiveservices-speech-sdk` | Latest (npm) |
| **Audio Recording** | Browser `MediaRecorder` API | Native |
| **Backend** | Node.js + Express | Node 20 LTS, Express 4.x |
| **Blob Storage SDK** | `@azure/storage-blob` | 12.x |
| **Dev Tooling** | Vite (build), npm, concurrently | Latest |

---

## 8. Functional Requirements

### FR-1: Start/Stop Recording

| ID | Requirement |
|----|-------------|
| FR-1.1 | The UI shall display a "Start Recording" button. |
| FR-1.2 | Clicking "Start Recording" shall request microphone permission from the browser. |
| FR-1.3 | Once permission is granted, audio capture and transcription shall begin simultaneously. |
| FR-1.4 | The button shall change to "Stop Recording" while a session is active. |
| FR-1.5 | Clicking "Stop Recording" shall end the recording session and finalize the audio/transcript. |

### FR-2: Real-Time Transcription

| ID | Requirement |
|----|-------------|
| FR-2.1 | The application shall use the Azure Speech SDK's **continuous recognition** mode to stream audio to Azure Speech Service. |
| FR-2.2 | Intermediate (partial) transcription results shall be displayed in the UI as the user speaks (via `recognizing` events). |
| FR-2.3 | Final transcription results shall be appended to a running transcript (via `recognized` events). |
| FR-2.4 | The recognition language shall default to `en-US` and be configurable. |
| FR-2.5 | Transcription errors or cancellations shall be displayed in the UI with a descriptive message. |

### FR-3: Audio Recording & Storage

| ID | Requirement |
|----|-------------|
| FR-3.1 | The browser shall simultaneously record the audio using the `MediaRecorder` API. |
| FR-3.2 | When the user stops recording, the audio data shall be sent to the backend. |
| FR-3.3 | The backend shall upload the audio file to the `recordings` container in Azure Blob Storage. |
| FR-3.4 | The blob name shall include a timestamp and unique identifier (e.g., `2026-03-26T14-30-00_abc123.webm`). |
| FR-3.5 | The final transcript text shall be stored alongside the audio (as blob metadata or a companion `.txt` blob). |

### FR-4: Session Display

| ID | Requirement |
|----|-------------|
| FR-4.1 | The UI shall show a scrolling transcript area that updates in real-time. |
| FR-4.2 | The UI shall show a recording duration timer. |
| FR-4.3 | The UI shall indicate connection status (connected / disconnected / error). |

---

## 9. Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-1 | **Latency** | Transcription text should appear within ~2-5 seconds of speech (dependent on Azure Speech Service latency and network). |
| NFR-2 | **Browser Support** | Must work in latest Chrome (desktop + Android) and Safari (iOS). Edge and Firefox are best-effort. |
| NFR-3 | **Security** | Speech subscription key must NEVER be exposed in the browser. Token exchange pattern is mandatory. |
| NFR-4 | **Security** | Backend API endpoints should use HTTPS in any deployed environment. |
| NFR-5 | **Reliability** | POC-level — no retry logic, circuit breakers, or failover required. Basic error display is sufficient. |
| NFR-6 | **Scalability** | Single-user, single-session. No concurrent session support needed. |
| NFR-7 | **Data Privacy** | Audio and transcript data is stored in the user's own Azure subscription. No data leaves the Azure tenant. |

---

## 10. UI Wireframe (Conceptual)

```
┌───────────────────────────────────────────────────────┐
│  🎙️ Speech Recording & Transcription POC              │
├───────────────────────────────────────────────────────┤
│                                                       │
│  Status: ● Connected          Duration: 00:02:34      │
│                                                       │
│  ┌─────────────────────────────────────────────────┐  │
│  │                                                 │  │
│  │  Live Transcript                                │  │
│  │  ─────────────────────────────────────────────  │  │
│  │  Hello, thank you for joining today's meeting.  │  │
│  │  We have several items on the agenda.           │  │
│  │  First, let's discuss the quarterly results...  │  │
│  │  [The revenue for Q1 was...]  ← partial/interim │  │
│  │                                                 │  │
│  └─────────────────────────────────────────────────┘  │
│                                                       │
│         ┌──────────────────────┐                      │
│         │   ⏹ Stop Recording   │                      │
│         └──────────────────────┘                      │
│                                                       │
│  ─────────────────────────────────────────────────    │
│  Previous Recordings: (future enhancement)            │
└───────────────────────────────────────────────────────┘
```

---

## 11. Project Structure (Proposed)

```
speech-recording-and-transcription/
├── client/                          # React frontend
│   ├── src/
│   │   ├── App.tsx                  # Main app component
│   │   ├── components/
│   │   │   ├── RecordingControls.tsx # Start/Stop buttons, timer
│   │   │   ├── TranscriptDisplay.tsx# Live transcript area
│   │   │   └── StatusIndicator.tsx  # Connection status
│   │   ├── services/
│   │   │   ├── speechService.ts     # Azure Speech SDK wrapper
│   │   │   └── tokenService.ts      # Token fetch/refresh logic
│   │   └── hooks/
│   │       ├── useAudioRecorder.ts  # MediaRecorder hook
│   │       └── useSpeechRecognition.ts # Speech recognition hook
│   ├── package.json
│   └── vite.config.ts
├── server/                          # Node.js/Express backend
│   ├── src/
│   │   ├── index.ts                 # Express server entry
│   │   ├── routes/
│   │   │   ├── speechToken.ts       # GET /api/get-speech-token
│   │   │   └── audioUpload.ts       # POST /api/upload-audio
│   │   └── services/
│   │       └── blobStorage.ts       # Azure Blob Storage upload logic
│   ├── package.json
│   └── tsconfig.json
├── .env.example                     # Environment variable template
├── PRD.md                           # This document
└── README.md                        # Setup and run instructions
```

---

## 12. Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SPEECH_KEY` | Azure Speech Service subscription key | `abc123def456...` |
| `SPEECH_REGION` | Azure Speech Service region | `eastus` |
| `SPEECH_ENDPOINT` | Azure Speech Service endpoint URL | `https://eastus.api.cognitive.microsoft.com/` |
| `AZURE_STORAGE_CONNECTION_STRING` | Azure Storage account connection string | `DefaultEndpointsProtocol=https;...` |
| `AZURE_STORAGE_CONTAINER_NAME` | Blob container for recordings | `recordings` |
| `PORT` | Backend server port | `3001` |

---

## 13. Key Technical Decisions & Rationale

### 13.1 Why Two Parallel Audio Streams?

The Azure Speech SDK manages its own audio pipeline internally — it captures microphone audio and streams it via WebSocket to the Speech Service. This audio stream is not directly accessible for saving to disk. Therefore, the POC uses a **dual-stream approach**:

- **Stream A:** Speech SDK → Azure Speech Service (for transcription)
- **Stream B:** MediaRecorder API → Blob → Backend → Azure Blob Storage (for recording)

Both streams originate from the same microphone source, ensuring consistency.

### 13.2 Why Token Exchange Instead of Direct Key Usage?

The Azure Speech subscription key grants full access to the Speech API. Exposing it in browser JavaScript would be a **critical security vulnerability**. The token exchange pattern (backend issues a short-lived 10-minute token) is the Microsoft-recommended approach for browser-based applications.

### 13.3 Why Upload After Recording (Not Streaming)?

For this POC, audio is accumulated in the browser during recording and uploaded as a single blob when the user stops. This keeps the implementation simple. A future enhancement could implement chunked streaming upload using Azure Blob Storage's Block Blob API (Put Block / Put Block List) for real-time persistence, but this is **out of scope for the POC**.

### 13.4 Why WebM/Opus Format?

The `MediaRecorder` API defaults to WebM container with Opus codec in Chrome/Edge. This is a widely supported, efficient format. WAV would be larger and unnecessary for archival purposes. If WAV is needed for downstream processing, a conversion step can be added later.

---

## 14. Risks & Mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| R1 | **Microphone permission denied** | Medium | High | UI guidance prompting user to allow mic access. Graceful error messaging. |
| R2 | **Network latency degrades transcription quality** | Low | Medium | POC is demonstrated on reliable network. Document minimum bandwidth requirements. |
| R3 | **Speech SDK browser limitations** | Low | High | Microphone recognition in browser is officially supported per Microsoft docs. Test on target browsers early. |
| R4 | **Azure Speech free tier quota exceeded** | Low | Medium | 5 hours/month is generous for POC demos. Monitor usage. Upgrade to S0 if needed. |
| R5 | **Audio format incompatibility across browsers** | Medium | Medium | Safari may produce different MediaRecorder output. Test and document supported formats per browser. |
| R6 | **Token expiry during long recording** | Medium | Medium | Implement token refresh on ~9-minute interval. Speech SDK handles reconnection. |

---

## 15. Future Enhancements (Post-POC)

These items are explicitly **out of scope** for the POC but are documented for future consideration if the concept is validated:

| Enhancement | Description |
|-------------|-------------|
| **Speaker diarization** | Identify and label different speakers in the conversation using Azure Speech Service's diarization capability. |
| **Streaming upload** | Upload audio chunks in real-time to Blob Storage using Block Blob API instead of waiting until recording ends. |
| **Conversation history** | List and replay previous recordings with their transcripts. |
| **Authentication** | Add Azure AD / Entra ID authentication for multi-user access control. |
| **Custom speech models** | Train a custom speech model with domain-specific vocabulary for improved accuracy. |
| **Multi-language support** | Auto-detect spoken language or allow user to select from supported locales. |
| **Summarization** | Use Azure OpenAI to summarize the transcript after the conversation. |
| **Export** | Export transcript as PDF, DOCX, or SRT caption file. |
| **Mobile native app** | Build React Native or MAUI app for native mobile experience. |
| **WebSocket streaming to backend** | Stream audio from browser to backend via WebSocket for server-side processing. |

---

## 16. Dependencies & Prerequisites

| Dependency | Details |
|------------|---------|
| Azure Subscription | Required. Free trial or pay-as-you-go. |
| Microsoft Foundry Resource (Speech) | Created via Azure Portal. Free tier (F0) sufficient for POC. |
| Azure Storage Account | General Purpose v2, Standard LRS. |
| Node.js 20 LTS | Backend runtime. |
| Modern browser | Chrome 90+, Edge 90+, Safari 15+ with microphone access. |
| HTTPS (for deployment) | Browsers require HTTPS for microphone access (except `localhost`). |

---

## 17. Milestones

> **Reminder:** This is a POC. Milestones are lightweight and focused on proving the concept.

| Milestone | Description | Deliverable |
|-----------|-------------|-------------|
| **M1: Azure Setup** | Provision Azure resources (Speech, Storage, Resource Group) | Resources created, keys/connection strings obtained |
| **M2: Backend API** | Implement Express server with token exchange and audio upload endpoints | Working `/api/get-speech-token` and `/api/upload-audio` endpoints |
| **M3: Speech Integration** | Implement real-time transcription in the browser using Speech SDK | Live transcript displayed in UI from microphone input |
| **M4: Audio Recording** | Implement MediaRecorder-based audio capture and upload to Blob Storage | Audio file appears in Blob Storage after recording |
| **M5: Integration & Demo** | End-to-end testing, polish UI, prepare demo | Working POC ready for stakeholder demonstration |

---

## 18. Glossary

| Term | Definition |
|------|-----------|
| **STT** | Speech-to-Text — converting spoken audio into written text. |
| **POC** | Proof of Concept — a demonstration to verify feasibility of a concept. |
| **Speech SDK** | Microsoft Cognitive Services Speech SDK (`microsoft-cognitiveservices-speech-sdk`). |
| **MediaRecorder API** | A browser API for recording media streams (audio/video). |
| **Blob Storage** | Azure's object storage service for unstructured data. |
| **Continuous Recognition** | A Speech SDK mode that listens indefinitely until explicitly stopped, firing events for each recognized utterance. |
| **Token Exchange** | Pattern where a backend server obtains a short-lived auth token on behalf of the frontend, avoiding key exposure. |
| **Foundry Resource** | The current Azure resource type for Azure AI services including Speech (Microsoft.CognitiveServicesAIFoundry). |

---

## 19. References

| Resource | URL |
|----------|-----|
| Azure Speech Service Overview | https://learn.microsoft.com/azure/ai-services/speech-service/overview |
| Speech-to-Text Quickstart (JavaScript) | https://learn.microsoft.com/azure/ai-services/speech-service/get-started-speech-to-text?pivots=programming-language-javascript |
| How to Recognize Speech (JavaScript) | https://learn.microsoft.com/azure/ai-services/speech-service/how-to-recognize-speech?pivots=programming-language-javascript |
| Azure Speech React Sample (GitHub) | https://github.com/Azure-Samples/AzureSpeechReactSample |
| Azure Blob Storage JS SDK | https://learn.microsoft.com/javascript/api/overview/azure/storage-blob-readme |
| Upload Blobs with JavaScript | https://learn.microsoft.com/azure/storage/blobs/storage-blob-upload-javascript |
| Speech SDK npm Package | https://www.npmjs.com/package/microsoft-cognitiveservices-speech-sdk |
| MediaRecorder API (MDN) | https://developer.mozilla.org/docs/Web/API/MediaRecorder |

---

*This PRD is a living document for the POC phase. It will be updated as decisions are made and the concept is proved or pivoted.*
