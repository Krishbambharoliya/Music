import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  const uploadDir = path.join(process.cwd(), 'public', 'songs');
  const dbDir = path.join(process.cwd(), 'data');
  const dbPath = path.join(dbDir, 'database.json');

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Ensure upload and database directories exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Clean file name to prevent traversal attacks
    const safeName = path.basename(file.name);
    const filePath = path.join(uploadDir, safeName);

    // Save the binary audio file locally
    fs.writeFileSync(filePath, buffer);

    // Parse metadata from filename
    const nameWithoutExt = path.basename(safeName, path.extname(safeName));
    let artist = 'Uploaded Collection';
    let title = nameWithoutExt;

    if (nameWithoutExt.includes(' - ')) {
      const parts = nameWithoutExt.split(' - ');
      artist = parts[0].trim();
      title = parts.slice(1).join(' - ').trim();
    }

    // Read and update the JSON database
    let songs = [];
    if (fs.existsSync(dbPath)) {
      try {
        const dbContent = fs.readFileSync(dbPath, 'utf8');
        songs = JSON.parse(dbContent);
      } catch (e) {
        console.warn('Failed to parse database.json, initializing empty:', e);
      }
    }

    // Prevent duplicate entries
    const existingIndex = songs.findIndex((s: any) => s.fileName === safeName);
    const newSong = {
      id: `db-${Date.now()}`,
      title: title,
      artist: artist,
      film: 'Local Database',
      year: new Date().getFullYear(),
      duration: 0,
      fileName: safeName,
      filePath: `/songs/${encodeURIComponent(safeName)}`,
      videoId: '',
    };

    if (existingIndex > -1) {
      songs[existingIndex] = { ...songs[existingIndex], ...newSong };
    } else {
      songs.push(newSong);
    }

    fs.writeFileSync(dbPath, JSON.stringify(songs, null, 2), 'utf8');

    return NextResponse.json({ success: true, fileName: safeName });
  } catch (error: any) {
    console.error('Error saving uploaded file to database:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
