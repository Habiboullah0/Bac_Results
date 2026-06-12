import { NextResponse } from 'next/server';
import { getDatabase } from '../../../lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    const db = getDatabase();
    const isNumeric = /^\d+$/.test(query);

    if (isNumeric) {
      const student = db
        .prepare(`
          SELECT id, seat_number, name_ar, name_fr, grade, serie, wilaya_ar, school_ar 
          FROM students 
          WHERE seat_number = ? 
          LIMIT 5
        `)
        .all(query);
        
      return NextResponse.json(student);
    } else {
      const students = db
        .prepare(`
          SELECT id, seat_number, name_ar, name_fr, grade, serie, wilaya_ar, school_ar 
          FROM students 
          WHERE name_ar LIKE ? OR name_fr LIKE ? 
          LIMIT 15
        `)
        .all(`%${query}%`, `%${query}%`);
        
      return NextResponse.json(students);
    }

  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء البحث' }, { status: 500 });
  }
}