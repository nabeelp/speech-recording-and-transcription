# Speech Recording & Real-Time Transcription POC

A proof-of-concept application that records conversations via a device microphone, provides real-time transcription using Azure Speech Service, and stores the audio in Azure Blob Storage.

## Prerequisites

- **Node.js 20 LTS** (or later)
- **Azure Subscription** with:
  - A **Foundry / Speech** resource (Free F0 tier works for POC)
  - A **Storage Account** (General Purpose v2, Standard LRS) with a container called `recordings`
- A modern browser (Chrome, Edge, or Safari) with microphone access

## Azure Setup

1. **Create a Resource Group** — e.g. `rg-speech-poc`
2. **Create a Foundry resource** (with Speech) in the Azure Portal — note the **Endpoint URL** and **Region**
   - The endpoint looks like `https://{name}.cognitiveservices.azure.com/`
3. **Create a Storage Account** — note the **Account Name**
4. **Create a blob container** named `recordings` (private access)
5. **Assign RBAC roles** to your identity (the account running the server):
   - **Cognitive Services Speech User** on the Speech resource
   - **Storage Blob Data Contributor** on the Storage Account

   Example Azure CLI commands:
   ```bash
   # Speech — grants access to obtain Entra ID tokens for real-time speech-to-text
   az role assignment create \
     --assignee "<your-user-or-sp-object-id>" \
     --role "Cognitive Services Speech User" \
     --scope "/subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.CognitiveServices/accounts/<speech-resource>"

   # Storage — grants access to create containers and upload blobs
   az role assignment create \
     --assignee "<your-user-or-sp-object-id>" \
     --role "Storage Blob Data Contributor" \
     --scope "/subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.Storage/storageAccounts/<storage-account>"
   ```

   > For local development, `az login` is sufficient — `DefaultAzureCredential` will use your Azure CLI session. The roles above just need to be assigned to that logged-in identity.

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd speech-recording-and-transcription
npm run install:all
```

### 2. Configure environment

Copy the example env file and fill in your Azure credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```
SPEECH_ENDPOINT=https://<your-foundry-resource>.cognitiveservices.azure.com/
SPEECH_REGION=<your-region, e.g. eastus>
AZURE_STORAGE_ACCOUNT_NAME=<your-storage-account-name>
AZURE_STORAGE_CONTAINER_NAME=recordings
PORT=3001
```

Authentication uses `DefaultAzureCredential` — no keys or connection strings needed. Make sure you're logged in via `az login` (Azure CLI) or have appropriate environment credentials set.

### 3. Run in development

```bash
npm run dev
```

This starts both the Express backend (port 3001) and the Vite React frontend (port 5173) concurrently. The frontend proxies `/api` calls to the backend.

Open **http://localhost:5173** in your browser.

### 4. Use the app

1. Click **Start Recording** — allow microphone access when prompted
2. Speak — you'll see real-time transcription in the transcript panel
3. Click **Stop Recording** — the audio file uploads to Azure Blob Storage
4. Check your `recordings` container in Azure Storage Explorer to see the saved audio and transcript

## Project Structure

```
├── client/                     React + TypeScript frontend (Vite)
│   └── src/
│       ├── App.tsx             Main app component
│       ├── components/         UI components
│       ├── hooks/              useSpeechRecognition, useAudioRecorder
│       └── services/           Token and upload API services
├── server/                     Node.js + Express backend
│   └── src/
│       ├── index.ts            Express server entry
│       ├── routes/             API route handlers
│       └── services/           Azure Blob Storage service
├── .env.example                Environment variable template
├── PRD.md                      Product Requirements Document
└── README.md                   This file
```

## Architecture

- **Real-time Transcription:** The browser captures microphone audio via the Azure Speech SDK (`microsoft-cognitiveservices-speech-sdk`) in continuous recognition mode. Partial and final transcription results are streamed back over WebSocket and displayed live.
- **Audio Recording:** The browser's `MediaRecorder` API simultaneously records audio. When stopped, the recording is uploaded to the backend.
- **Token Security:** Authentication uses `DefaultAzureCredential` (no keys in config). The backend obtains an Entra ID access token and passes it to the frontend via `/api/get-speech-token`. The frontend uses `SpeechConfig.fromEndpoint()` with the Foundry endpoint URL.
- **Storage:** The backend uploads audio (WebM) and transcript (TXT) files to Azure Blob Storage.

## Note

This is a **Proof of Concept**. It is not production-ready. See [PRD.md](PRD.md) for scope boundaries, non-goals, and future enhancement ideas.
