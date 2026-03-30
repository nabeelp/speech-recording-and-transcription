import { Router, Request, Response } from 'express';
import multer from 'multer';
import { uploadToBlob } from '../services/blobStorage';

export const audioUploadRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max
});

audioUploadRouter.post(
  '/upload-audio',
  upload.single('audio'),
  async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: 'No audio file provided.' });
      return;
    }

    const transcript = req.body.transcript || '';

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const uniqueId = Math.random().toString(36).substring(2, 10);
      const blobName = `${timestamp}_${uniqueId}.webm`;

      const blobUrl = await uploadToBlob(blobName, req.file.buffer, req.file.mimetype, transcript);

      // Upload transcript as a companion text file
      if (transcript) {
        const transcriptBlobName = `${timestamp}_${uniqueId}.txt`;
        await uploadToBlob(
          transcriptBlobName,
          Buffer.from(transcript, 'utf-8'),
          'text/plain',
          ''
        );
      }

      res.json({
        message: 'Audio uploaded successfully.',
        blobName,
        blobUrl,
      });
    } catch (err) {
      console.error('Error uploading audio:', err);
      res.status(500).json({
        error: 'Failed to upload audio to storage.',
        ...(process.env.NODE_ENV !== 'production' && {
          details: err instanceof Error ? err.message : String(err),
        }),
      });
    }
  }
);
