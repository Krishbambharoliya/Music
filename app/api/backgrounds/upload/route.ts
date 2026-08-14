import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  const uploadDir = path.join(process.cwd(), 'public', 'bg');
  const dbDir = path.join(process.cwd(), 'data');
  const dbPath = path.join(dbDir, 'backgrounds.json');

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

    // Check count of backgrounds (limit to 12 total including default)
    let customBgs: any[] = [];
    if (fs.existsSync(dbPath)) {
      try {
        const dbContent = fs.readFileSync(dbPath, 'utf8');
        customBgs = JSON.parse(dbContent);
      } catch (e) {
        console.warn('Failed to parse backgrounds.json:', e);
      }
    }

    // 1 default + custom count must be < 12
    if (customBgs.length >= 11) {
      return NextResponse.json({ error: 'Maximum of 12 background images reached. Please delete an existing one first.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Clean file name to prevent traversal attacks
    const ext = path.extname(file.name) || '.jpg';
    const timestamp = Date.now();
    const safeName = `uploaded-${timestamp}${ext}`;
    const filePath = path.join(uploadDir, safeName);

    // Save the file locally
    fs.writeFileSync(filePath, buffer);

    const newBg = {
      id: `bg-${timestamp}`,
      name: file.name.split('.')[0] || `Background ${customBgs.length + 2}`,
      url: `/bg/${safeName}`,
      tallUrl: `/bg/${safeName}`, // For uploaded images, use the same file for both wide and tall
      isDefault: false
    };

    customBgs.push(newBg);
    fs.writeFileSync(dbPath, JSON.stringify(customBgs, null, 2), 'utf8');

    return NextResponse.json({ success: true, backgrounds: [{ id: 'default', name: 'Engineering Building', url: '/bg/engineering.jpg', tallUrl: '/bg/engineering.jpg', isDefault: true }, ...customBgs] });
  } catch (error: any) {
    console.error('Error saving uploaded background:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
