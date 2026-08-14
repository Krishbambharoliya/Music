import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const defaultBgs = [
  {
    id: 'default',
    name: 'Engineering Building',
    url: '/bg/engineering.jpg',
    tallUrl: '/bg/engineering.jpg',
    isDefault: true,
  }
];

export async function GET() {
  const dbDir = path.join(process.cwd(), 'data');
  const dbPath = path.join(dbDir, 'backgrounds.json');

  try {
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    let bgs = [...defaultBgs];
    if (fs.existsSync(dbPath)) {
      try {
        const dbContent = fs.readFileSync(dbPath, 'utf8');
        const customBgs = JSON.parse(dbContent);
        bgs = [...defaultBgs, ...customBgs];
      } catch (e) {
        console.warn('Failed to parse backgrounds.json:', e);
      }
    } else {
      fs.writeFileSync(dbPath, JSON.stringify([], null, 2), 'utf8');
    }

    return NextResponse.json({ backgrounds: bgs.slice(0, 12) });
  } catch (error: any) {
    console.error('Error fetching backgrounds:', error);
    return NextResponse.json({ backgrounds: defaultBgs, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const dbPath = path.join(process.cwd(), 'data', 'backgrounds.json');
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id || id === 'default') {
    return NextResponse.json({ error: 'Cannot delete default background' }, { status: 400 });
  }

  try {
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ error: 'No backgrounds database found' }, { status: 404 });
    }

    const dbContent = fs.readFileSync(dbPath, 'utf8');
    const customBgs = JSON.parse(dbContent);
    
    // Find image to delete physically
    const toDelete = customBgs.find((bg: any) => bg.id === id);
    if (toDelete && toDelete.url.startsWith('/bg/uploaded-')) {
      const filePath = path.join(process.cwd(), 'public', toDelete.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    const filtered = customBgs.filter((bg: any) => bg.id !== id);
    fs.writeFileSync(dbPath, JSON.stringify(filtered, null, 2), 'utf8');

    const allBgs = [...defaultBgs, ...filtered];
    return NextResponse.json({ success: true, backgrounds: allBgs.slice(0, 12) });
  } catch (error: any) {
    console.error('Error deleting background:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
