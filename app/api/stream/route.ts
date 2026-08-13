import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get('file');
  
  if (!file) {
    return new Response('File parameter is required', { status: 400 });
  }

  const musicDir = 'E:\\Entertainment\\music\\2';
  const filePath = path.join(musicDir, file);

  const resolvedPath = path.resolve(filePath);
  if (!resolvedPath.startsWith(path.resolve(musicDir))) {
    return new Response('Access Denied', { status: 403 });
  }

  if (!fs.existsSync(resolvedPath)) {
    return new Response('File Not Found', { status: 404 });
  }

  try {
    const stat = fs.statSync(resolvedPath);
    const fileSize = stat.size;
    const range = request.headers.get('range');

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
        return new Response('Requested Range Not Satisfiable', {
          status: 416,
          headers: { 'Content-Range': `bytes */${fileSize}` }
        });
      }

      const chunksize = (end - start) + 1;
      const fileStream = fs.createReadStream(resolvedPath, { start, end });

      const headers = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize.toString(),
        'Content-Type': contentType,
      };

      return new Response(fileStream as any, {
        status: 206,
        headers,
      });
    } else {
      const fileStream = fs.createReadStream(resolvedPath);
      const headers = {
        'Content-Length': fileSize.toString(),
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
      };

      return new Response(fileStream as any, {
        status: 200,
        headers,
      });
    }
  } catch (error: any) {
    console.error('Error streaming local audio file:', error);
    return new Response(`Streaming Error: ${error.message}`, { status: 500 });
  }
}
