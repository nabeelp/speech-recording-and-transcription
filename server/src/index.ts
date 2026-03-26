import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { speechTokenRouter } from './routes/speechToken';
import { audioUploadRouter } from './routes/audioUpload';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api', speechTokenRouter);
app.use('/api', audioUploadRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
