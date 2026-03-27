# Speech Recording & Real-Time Transcription POC (South Africa)

A proof-of-concept application that records conversations via a device microphone, provides real-time transcription using Azure Speech Service, and stores the audio in Azure Blob Storage. The app automatically detects and highlights Personally Identifiable Information (PII) in the transcript and uses Azure OpenAI to provide intelligent Next Best Action suggestions for South African financial advisors.

## Features

- **Real-time Transcription** — Live speech-to-text with Azure Speech Service
- **Speaker Diarization** — Identifies different speakers in the conversation
- **PII Detection** — Automatically detects and highlights sensitive information (names, addresses, phone numbers, SSN, etc.) in red
- **Next Best Action (NBA) Suggestions** — AI-powered recommendations using Azure OpenAI based on conversation context and client profile
- **Client Profile Management** — View client information including portfolio, goals, and risk profile
- **Audio Recording** — Saves conversations to Azure Blob Storage
- **Cross-device Support** — Works on desktop and mobile browsers

## Prerequisites

- **Node.js 20 LTS** (or later)
- **Azure Subscription** with:
  - A **Foundry / Speech** resource (Free F0 tier works for POC)
  - An **Azure AI Language** resource for PII detection (Free F0 tier works for POC)
  - An **Azure OpenAI** resource with GPT-4 deployment for Next Best Action analysis
  - A **Storage Account** (General Purpose v2, Standard LRS) with a container called `recordings`
- A modern browser (Chrome, Edge, or Safari) with microphone access

## Azure Setup

1. **Create a Resource Group** — e.g. `rg-speech-poc`
2. **Create a Foundry resource** (with Speech) in the Azure Portal — note the **Endpoint URL** and **Region**
   - The endpoint looks like `https://{name}.cognitiveservices.azure.com/`
3. **Create an Azure AI Language resource** in the Azure Portal — note the **Endpoint URL**
   - The endpoint looks like `https://{name}.cognitiveservices.azure.com/`
4. **Create an Azure OpenAI resource** in the Azure Portal — note the **Endpoint URL**
   - The endpoint looks like `https://{name}.openai.azure.com/`
   - Deploy a GPT-4 model and note the **Deployment Name** (e.g., `gpt-4`)
5. **Create a Storage Account** — note the **Account Name**
6. **Create a blob container** named `recordings` (private access)
7. **Assign RBAC roles** to your identity (the account running the server):
   - **Cognitive Services Speech User** on the Speech resource
   - **Cognitive Services Language Reader** on the Language resource
   - **Cognitive Services OpenAI User** on the Azure OpenAI resource
   - **Storage Blob Data Contributor** on the Storage Account

   Example Azure CLI commands:
   ```bash
   # Speech — grants access to obtain Entra ID tokens for real-time speech-to-text
   az role assignment create \
     --assignee "<your-user-or-sp-object-id>" \
     --role "Cognitive Services Speech User" \
     --scope "/subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.CognitiveServices/accounts/<speech-resource>"

   # Language — grants access to PII detection API
   az role assignment create \
     --assignee "<your-user-or-sp-object-id>" \
     --role "Cognitive Services Language Reader" \
     --scope "/subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.CognitiveServices/accounts/<language-resource>"

   # Azure OpenAI — grants access to GPT models for NBA analysis
   az role assignment create \
     --assignee "<your-user-or-sp-object-id>" \
     --role "Cognitive Services OpenAI User" \
     --scope "/subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.CognitiveServices/accounts/<openai-resource>"

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
LANGUAGE_ENDPOINT=https://<your-language-resource>.cognitiveservices.azure.com/
AZURE_OPENAI_ENDPOINT=https://<your-openai-resource>.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=<your-gpt-4-deployment-name>
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

1. **Enter Client Name** — Type a client name to look up (e.g., "Thabo Mabaso", "Naledi Khumalo")
2. **View Client Profile** — Review the client's portfolio (in ZAR), risk profile, and financial goals
3. Click **Start Recording** — allow microphone access when prompted
4. **Speak naturally** — the conversation will be transcribed in real-time with speaker identification
5. **NBA Suggestions** — After ~15 seconds, AI-powered Next Best Action suggestions appear based on the conversation
   - Suggestions show priority (high/medium/low), confidence score, and trigger keywords
   - Click "Discuss Now" to acknowledge or "Dismiss" to hide
6. **PII Detection** — Any PII data (e.g., names, phone numbers, addresses) is highlighted in **bold red text**
7. Click **Stop Recording** — the audio file and transcript upload to Azure Blob Storage
8. Check your `recordings` container in Azure Storage Explorer to see the saved files

## Next Best Action (NBA) Feature

The NBA feature uses Azure OpenAI (GPT-4) to analyze conversations in real-time and provide intelligent suggestions for financial advisors:

### How It Works
1. **Client Context**: Before recording, the advisor enters the client's name to load their profile
2. **Real-time Analysis**: Every 15 seconds during the conversation, the transcript is sent to Azure OpenAI
3. **Intelligent Suggestions**: GPT-4 analyzes the conversation considering:
   - Discussion topics and client concerns
   - Client's age, risk profile, and portfolio allocation
   - Financial goals and recent activity
   - Conversation context and keywords
4. **Actionable Recommendations**: Top 3 suggestions are displayed with:
   - **Action**: What the advisor should discuss
   - **Reason**: Why it's relevant now
   - **Priority**: High/medium/low urgency
   - **Confidence**: AI confidence score (60-95%)
   - **Keywords**: Words from the transcript that triggered the suggestion

### Example Suggestions
- **"Discuss retirement savings strategy"** when client mentions "retirement" or "retirement annuity"
- **"Review tax-free savings account contributions"** when client talks about savings
- **"Discuss portfolio rebalancing"** when market performance is mentioned
- **"Review retirement annuity contributions"** for clients looking to optimize tax benefits

### Mock Client Database
The POC includes 5 South African mock clients for testing:
- Thabo Mabaso (age 52, moderate risk, R3.25M portfolio)
- Naledi Khumalo (age 38, aggressive risk, R6.5M portfolio)
- Pieter van der Merwe (age 67, conservative risk, R2.4M portfolio)
- Lerato Ndlovu (age 29, moderate risk, R1.45M portfolio)
- Mohammed Patel (age 45, aggressive risk, R4.75M portfolio)

## Project Structure

```
├── client/                     React + TypeScript frontend (Vite)
│   └── src/
│       ├── App.tsx             Main app component
│       ├── components/         UI components
│       │   ├── StatusIndicator.tsx
│       │   ├── RecordingControls.tsx
│       │   ├── TranscriptDisplay.tsx
│       │   ├── ClientInfoForm.tsx       # Client lookup form
│       │   ├── ClientInfoPanel.tsx      # Client profile display
│       │   └── NBAPromptCard.tsx        # NBA suggestion cards
│       ├── hooks/              Custom React hooks
│       │   ├── useSpeechRecognition.ts
│       │   ├── useAudioRecorder.ts
│       │   ├── useSpeakerMap.ts
│       │   └── useNBAAnalysis.ts        # NBA analysis hook
│       └── services/           API services
│           ├── apiService.ts            # Client, NBA, PII APIs
│           └── tokenService.ts          # Speech token management
├── server/                     Node.js + Express backend
│   └── src/
│       ├── index.ts            Express server entry
│       ├── routes/             API route handlers
│       │   ├── speechToken.ts
│       │   ├── audioUpload.ts
│       │   ├── piiDetection.ts
│       │   ├── clientLookup.ts          # Client database API
│       │   └── nbaAnalysis.ts           # NBA analysis API
│       └── services/           Business logic services
│           ├── blobStorage.ts
│           ├── piiDetection.ts
│           ├── clientDatabase.ts        # Mock client data
│           └── nbaAnalyzer.ts           # Azure OpenAI integration
├── .env.example                Environment variable template
├── PRD.md                      Product Requirements Document
└── README.md                   This file
```

## Architecture

- **Speech Recognition:** The frontend uses the Azure Speech SDK (`microsoft-cognitiveservices-speech-sdk`) in Conversation Transcriber mode with speaker diarization. Partial and final transcription results are streamed back and displayed live.
- **PII Detection:** When transcription completes for each utterance, the text is sent to the backend which calls Azure AI Language service to detect PII entities. Detected entities are highlighted in the UI with red, bold text and a wavy underline.
- **NBA Analysis:** Every 15 seconds during recording, the full transcript and client profile are sent to Azure OpenAI (GPT-4) for analysis. The AI generates 2-4 contextual suggestions that are displayed as cards in the UI.
- **Audio Recording:** The browser's `MediaRecorder` API simultaneously records audio. When stopped, the recording is uploaded to the backend.
- **Token Security:** Authentication uses `DefaultAzureCredential` (no keys in config). The backend obtains Entra ID access tokens and passes them to Azure services.
- **Storage:** The backend uploads audio (WebM) and transcript (TXT) files to Azure Blob Storage.

## PII Categories Detected

The Azure AI Language service can detect various types of PII, including:
- Person names
- Organizations
- Locations and addresses
- Phone numbers
- Email addresses
- Social Security Numbers (SSN)
- Credit card numbers
- Dates of birth
- Medical information
- And more...

## Note

This is a **Proof of Concept**. It is not production-ready. See [PRD.md](PRD.md) for complete scope boundaries, technical implementation details, non-goals, and future enhancement ideas.

