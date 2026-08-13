import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const dbPath = path.join(process.cwd(), 'data', 'database.json');
  const uploadDir = path.join(process.cwd(), 'public', 'songs');

  try {
    let songs = [];

    // 1. If database exists, read it
    if (fs.existsSync(dbPath)) {
      try {
        const dbContent = fs.readFileSync(dbPath, 'utf8');
        songs = JSON.parse(dbContent);
      } catch (e) {
        console.warn('Error parsing database.json:', e);
      }
    }

    // 2. If database is empty or not found, check the public/songs folder to sync existing files
    if (songs.length === 0 && fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);
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
            title: title,
            artist: artist,
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
        // Save the synced files back to database.json
        const dbDir = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dbDir)) {
          fs.mkdirSync(dbDir, { recursive: true });
        }
        fs.writeFileSync(dbPath, JSON.stringify(songs, null, 2), 'utf8');
      }
    }

    return NextResponse.json({ songs });
  } catch (error: any) {
    console.error('Error fetching songs from database:', error);
    return NextResponse.json({ songs: [], error: error.message }, { status: 500 });
  }
}
