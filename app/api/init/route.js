import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'bac_results.sqlite');
const db = new Database(dbPath);

export async function GET() {
  try {
    const topStudentsQuery = `
      WITH RankedStudents AS (
        SELECT *,
               ROW_NUMBER() OVER (PARTITION BY serie ORDER BY grade DESC) as rank
        FROM students
      )
      SELECT * FROM RankedStudents WHERE rank <= 10;
    `;
    
    const topStudents = db.prepare(topStudentsQuery).all();

    const wilayas = db.prepare(`
      SELECT DISTINCT wilaya_ar, wilaya_fr 
      FROM students 
      WHERE wilaya_ar IS NOT NULL 
      ORDER BY wilaya_ar ASC
    `).all();

    const schools = db.prepare(`
      SELECT DISTINCT school_ar, school_fr 
      FROM students 
      WHERE school_ar IS NOT NULL 
      ORDER BY school_ar ASC
    `).all();

    return NextResponse.json({
      topStudents,
      filters: {
        wilayas,
        schools
      }
    });

  } catch (error) {
    console.error('Init API Error:', error);
    return NextResponse.json({ error: 'حدث خطأ في السيرفر' }, { status: 500 });
  }
}