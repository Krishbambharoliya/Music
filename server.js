import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Setup multer memory storage for uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Directories setup
const publicDir = path.join(__dirname, 'public');
const songsDir = path.join(publicDir, 'songs');
const bgDir = path.join(publicDir, 'bg');
const dataDir = path.join(__dirname, 'data');
const songsDbPath = path.join(dataDir, 'database.json');
const bgDbPath = path.join(dataDir, 'backgrounds.json');

// Ensure database and upload folders exist
if (!fs.existsSync(songsDir)) fs.mkdirSync(songsDir, { recursive: true });
if (!fs.existsSync(bgDir)) fs.mkdirSync(bgDir, { recursive: true });
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Static assets serving
app.use(express.static(publicDir));

// --- API: SONGS ---
app.get('/api/songs', (req, res) => {
  try {
    let songs = [];
    if (fs.existsSync(songsDbPath)) {
      try {
        const dbContent = fs.readFileSync(songsDbPath, 'utf8');
        songs = JSON.parse(dbContent);
      } catch (e) {
        console.warn('Error parsing database.json:', e);
      }
    }

    // Sync if database is empty and files exist on disk
    if (songs.length === 0 && fs.existsSync(songsDir)) {
      const files = fs.readdirSync(songsDir);
      const audioExtensions = ['.mp3', '.wav', '.m4a', '.ogg', '.flac'];
      
      const syncedSongs = files
        .filter(file => audioExtensions.includes(path.extname(file).toLowerCase()))
        .map((file, index) => {
          const nameWithoutExt = path.basename(file, path.extname(file));
          let artist = 'Local Database';
          let title = nameWithoutExt;
          
          if (nameWithoutExt.includes(' - ')) {
            const parts = nameWithoutExt.split(' - ');
            artist = parts[0].trim();
            title = parts.slice(1).join(' - ').trim();
          }

          return {
            id: `db-sync-${index}`,
            title,
            artist,
            film: 'Local Database',
            year: 2026,
            duration: 0,
            fileName: file,
            filePath: `/songs/${encodeURIComponent(file)}`,
            videoId: '',
          };
        });

      if (syncedSongs.length > 0) {
        songs = syncedSongs;
        fs.writeFileSync(songsDbPath, JSON.stringify(songs, null, 2), 'utf8');
      }
    }

    res.json({ songs });
  } catch (error) {
    console.error('Error fetching songs:', error);
    res.status(500).json({ songs: [], error: error.message });
  }
});

app.post('/api/songs/upload', upload.single('file'), (req, res) => {
  try {
    const file = req.file;
    const playlistId = req.body.playlist || 'night';

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const safeName = path.basename(file.originalname);
    const filePath = path.join(songsDir, safeName);

    // Save song file physically
    fs.writeFileSync(filePath, file.buffer);

    // Parse metadata
    const nameWithoutExt = path.basename(safeName, path.extname(safeName));
    let artist = 'Uploaded Collection';
    let title = nameWithoutExt;

    if (nameWithoutExt.includes(' - ')) {
      const parts = nameWithoutExt.split(' - ');
      artist = parts[0].trim();
      title = parts.slice(1).join(' - ').trim();
    }

    // Read and update the database
    let songs = [];
    if (fs.existsSync(songsDbPath)) {
      try {
        const dbContent = fs.readFileSync(songsDbPath, 'utf8');
        songs = JSON.parse(dbContent);
      } catch (e) {
        console.warn('Failed to parse database.json:', e);
      }
    }

    const existingIndex = songs.findIndex(s => s.fileName === safeName);
    const newSong = {
      id: `db-${Date.now()}`,
      title,
      artist,
      film: 'Local Database',
      year: new Date().getFullYear(),
      duration: 0,
      fileName: safeName,
      filePath: `/songs/${encodeURIComponent(safeName)}`,
      videoId: '',
      playlist: playlistId,
    };

    if (existingIndex > -1) {
      songs[existingIndex] = { ...songs[existingIndex], ...newSong };
    } else {
      songs.push(newSong);
    }

    fs.writeFileSync(songsDbPath, JSON.stringify(songs, null, 2), 'utf8');

    res.json({ success: true, fileName: safeName, playlist: playlistId });
  } catch (error) {
    console.error('Error uploading song:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/songs', (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Song ID is required' });
  }

  try {
    if (!fs.existsSync(songsDbPath)) {
      return res.status(404).json({ error: 'No songs database found' });
    }

    const dbContent = fs.readFileSync(songsDbPath, 'utf8');
    const songs = JSON.parse(dbContent);

    // Delete physically
    const toDelete = songs.find(s => s.id === id);
    if (toDelete && toDelete.fileName) {
      const filePath = path.join(songsDir, toDelete.fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    const filtered = songs.filter(s => s.id !== id);
    fs.writeFileSync(songsDbPath, JSON.stringify(filtered, null, 2), 'utf8');

    res.json({ success: true, songs: filtered });
  } catch (error) {
    console.error('Error deleting song:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- API: BACKGROUNDS ---
const defaultBgs = [
  {
    id: 'default',
    name: 'Engineering Building',
    url: '/bg/engineering.jpg',
    tallUrl: '/bg/engineering.jpg',
    isDefault: true,
  }
];

app.get('/api/backgrounds', (req, res) => {
  try {
    let customBgs = [];
    if (fs.existsSync(bgDbPath)) {
      try {
        const dbContent = fs.readFileSync(bgDbPath, 'utf8');
        customBgs = JSON.parse(dbContent);
      } catch (e) {
        console.warn('Failed to parse backgrounds.json:', e);
      }
    } else {
      fs.writeFileSync(bgDbPath, JSON.stringify([], null, 2), 'utf8');
    }

    const backgrounds = [...defaultBgs, ...customBgs];
    res.json({ backgrounds: backgrounds.slice(0, 12) });
  } catch (error) {
    console.error('Error fetching backgrounds:', error);
    res.status(500).json({ backgrounds: defaultBgs, error: error.message });
  }
});

app.post('/api/backgrounds/upload', upload.single('file'), (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let customBgs = [];
    if (fs.existsSync(bgDbPath)) {
      try {
        const dbContent = fs.readFileSync(bgDbPath, 'utf8');
        customBgs = JSON.parse(dbContent);
      } catch (e) {
        console.warn('Failed to parse backgrounds.json:', e);
      }
    }

    // Limit to 12 total backgrounds (1 default + 11 custom)
    if (customBgs.length >= 11) {
      return res.status(400).json({ error: 'Maximum of 12 background images reached. Please delete an existing one first.' });
    }

    const ext = path.extname(file.originalname) || '.jpg';
    const timestamp = Date.now();
    const safeName = `uploaded-${timestamp}${ext}`;
    const filePath = path.join(bgDir, safeName);

    // Save image physically
    fs.writeFileSync(filePath, file.buffer);

    const newBg = {
      id: `bg-${timestamp}`,
      name: file.originalname.split('.')[0] || `Background ${customBgs.length + 2}`,
      url: `/bg/${safeName}`,
      tallUrl: `/bg/${safeName}`,
      isDefault: false
    };

    customBgs.push(newBg);
    fs.writeFileSync(bgDbPath, JSON.stringify(customBgs, null, 2), 'utf8');

    res.json({ success: true, backgrounds: [...defaultBgs, ...customBgs].slice(0, 12) });
  } catch (error) {
    console.error('Error uploading background:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/backgrounds', (req, res) => {
  const { id } = req.query;

  if (!id || id === 'default') {
    return res.status(400).json({ error: 'Cannot delete default background' });
  }

  try {
    if (!fs.existsSync(bgDbPath)) {
      return res.status(404).json({ error: 'No backgrounds database found' });
    }

    const dbContent = fs.readFileSync(bgDbPath, 'utf8');
    const customBgs = JSON.parse(dbContent);

    // Find and delete physically
    const toDelete = customBgs.find(bg => bg.id === id);
    if (toDelete && toDelete.url.startsWith('/bg/uploaded-')) {
      const filePath = path.join(publicDir, toDelete.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    const filtered = customBgs.filter(bg => bg.id !== id);
    fs.writeFileSync(bgDbPath, JSON.stringify(filtered, null, 2), 'utf8');

    res.json({ success: true, backgrounds: [...defaultBgs, ...filtered].slice(0, 12) });
  } catch (error) {
    console.error('Error deleting background:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- API: LOCAL FILE STREAMING ---
app.get('/api/stream', (req, res) => {
  const file = req.query.file;

  if (!file) {
    return res.status(400).send('File parameter is required');
  }

  const musicDir = 'E:\\Entertainment\\music\\2';
  const filePath = path.join(musicDir, file);

  const resolvedPath = path.resolve(filePath);
  if (!resolvedPath.startsWith(path.resolve(musicDir))) {
    return res.status(403).send('Access Denied');
  }

  if (!fs.existsSync(resolvedPath)) {
    return res.status(404).send('File Not Found');
  }

  try {
    const stat = fs.statSync(resolvedPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    const ext = path.extname(file).toLowerCase();
    let contentType = 'audio/mpeg';
    if (ext === '.wav') contentType = 'audio/wav';
    if (ext === '.ogg') contentType = 'audio/ogg';
    if (ext === '.m4a') contentType = 'audio/x-m4a';
    if (ext === '.flac') contentType = 'audio/flac';

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        res.status(416).set('Content-Range', `bytes */${fileSize}`).send('Requested Range Not Satisfiable');
        return;
      }

      const chunksize = (end - start) + 1;
      const fileStream = fs.createReadStream(resolvedPath, { start, end });

      res.status(206).set({
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize.toString(),
        'Content-Type': contentType,
      });

      fileStream.pipe(res);
    } else {
      const fileStream = fs.createReadStream(resolvedPath);
      res.status(200).set({
        'Content-Length': fileSize.toString(),
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
      });
      fileStream.pipe(res);
    }
  } catch (error) {
    console.error('Error streaming file:', error);
    res.status(500).send(`Streaming Error: ${error.message}`);
  }
});

// Serve frontend compiled client
const distDir = path.join(__dirname, 'dist');
app.use(express.static(distDir));

// Fallback all routes to frontend index.html (SPA routing support)
app.get('*', (req, res, next) => {
  // If requesting an API route that wasn't matched, skip
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  const indexPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Not Found');
  }
});

// Start listening
app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});
