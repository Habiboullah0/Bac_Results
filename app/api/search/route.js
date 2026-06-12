import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'bac_results.sqlite');
const db = new Database(dbPath);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.trim().length < 2) {
    return NextResponse.json([]);
  }

  try {
    const cleanQuery = query.trim();
    const isNumeric = /^\d+$/.test(cleanQuery);

    if (isNumeric) {
      const student = db
        .prepare('SELECT * FROM students WHERE seat_number = ? LIMIT 5')
        .all(cleanQuery);
        
      return NextResponse.json(student);
    } else {
      const students = db
        .prepare(
          `SELECT * FROM students 
           WHERE name_ar LIKE ? OR name_fr LIKE ? 
           LIMIT 15`
        )
        .all(`%${cleanQuery}%`, `%${cleanQuery}%`);
        
      return NextResponse.json(students);
    }

  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء البحث' }, { status: 500 });
  }
}