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

export async function GET() {
  try {
    const db = await openDb();

    const topStudentsQuery = `
      WITH RankedStudents AS (
        SELECT *,
               ROW_NUMBER() OVER (PARTITION BY serie ORDER BY grade DESC) as rank
        FROM students
      )
      SELECT * FROM RankedStudents WHERE rank <= 10;
    `;
    const topStudents = await db.all(topStudentsQuery);

    const wilayas = await db.all(`
      SELECT DISTINCT wilaya_ar, wilaya_fr 
      FROM students 
      WHERE wilaya_ar IS NOT NULL 
      ORDER BY wilaya_ar ASC
    `);

    const schools = await db.all(`
      SELECT DISTINCT school_ar, school_fr 
      FROM students 
      WHERE school_ar IS NOT NULL 
      ORDER BY school_ar ASC
    `);

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