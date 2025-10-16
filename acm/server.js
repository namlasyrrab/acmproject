import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

// Serve static files from public so /audios/* is reachable by the browser
app.use('/audios', express.static(path.join(__dirname, 'public', 'audios')));

app.get('/api/playlist', (req, res) => {
  try {
    const audioDir = path.join(__dirname, 'public', 'audios');

    if (!fs.existsSync(audioDir)) {
      return res.json([]); // directory missing => empty array, not object
    }

    const files = fs.readdirSync(audioDir);

    // Only .mp3, and optionally require a matching .txt
    const mp3s = files.filter(f => f.toLowerCase().endsWith('.mp3'));

    // Build track list and sort newest-first by mtime
    const tracks = mp3s.map((mp3, idx) => {
      const base = mp3.replace(/\.mp3$/i, '');
      const mp3Path = path.join(audioDir, mp3);
      const txtName = `${base}.txt`;
      const txtExists = files.some(f => f.toLowerCase() === txtName.toLowerCase());
      const stat = fs.statSync(mp3Path);
      return {
        id: idx + 1,
        title: base.replace(/[_-]+/g, ' ').trim(),
        url: `/audios/${mp3}`,
        transcript: txtExists ? `/audios/${txtName}` : null,
        mtimeMs: stat.mtimeMs
      };
    })
    // If you want to enforce "must have matching txt", uncomment next line:
    // .filter(t => t.transcript)

    .sort((a,b) => b.mtimeMs - a.mtimeMs)
    .map(({mtimeMs, ...rest}) => rest); // drop mtimeMs from response

    return res.json(tracks);
  } catch (e) {
    console.error(e);
    // On any error, return an ARRAY so the frontend never crashes
    return res.status(500).json([]);
  }
});

app.listen(PORT, () => {
  console.log(`Audio API running on http://localhost:${PORT}`);
});
