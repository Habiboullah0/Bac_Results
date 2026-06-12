import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

async function openDb() {
  return open({
    filename: path.join(process.cwd(), 'data', 'bac_results.sqlite'),
    driver: sqlite3.Database,
  });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.trim().length < 2) {
    return NextResponse.json([]);
  }

  try {
    const db = await openDb();
    const cleanQuery = query.trim();

    const isNumeric = /^\d+$/.test(cleanQuery);

    if (isNumeric) {
      const student = await db.all(
        'SELECT * FROM students WHERE seat_number = ? LIMIT 5', 
        [cleanQuery]
      );
      return NextResponse.json(student);
    } else {
      const students = await db.all(
        `SELECT * FROM students 
         WHERE name_ar LIKE ? OR name_fr LIKE ? 
         LIMIT 15`,
        [`%${cleanQuery}%`, `%${cleanQuery}%`]
      );
      return NextResponse.json(students);
    }

  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء البحث' }, { status: 500 });
  }
}