import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { speechTokenRouter } from './routes/speechToken';
import { audioUploadRouter } from './routes/audioUpload';
import { piiDetectionRouter } from './routes/piiDetection';
import { clientLookupRouter } from './routes/clientLookup';
import { nbaAnalysisRouter } from './routes/nbaAnalysis';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api', speechTokenRouter);
app.use('/api', audioUploadRouter);
app.use('/api', piiDetectionRouter);
app.use('/api', clientLookupRouter);
app.use('/api', nbaAnalysisRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
