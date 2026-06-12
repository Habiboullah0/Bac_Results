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
  const studentId = searchParams.get('id');

  if (!studentId) {
    return NextResponse.json({ error: 'ID المطلوب غير موجود' }, { status: 400 });
  }

  try {
    const db = await openDb();

    const student = await db.get('SELECT * FROM students WHERE id = ?', [studentId]);

    if (!student) {
      return NextResponse.json({ message: 'الطالب غير موجود' }, { status: 404 });
    }

    const { grade, serie, wilaya_ar, school_ar } = student;

    const natRankRes = await db.get(
      'SELECT COUNT(*) + 1 AS rank FROM students WHERE grade > ? AND serie = ?',
      [grade, serie]
    );

    const wilRankRes = await db.get(
      'SELECT COUNT(*) + 1 AS rank FROM students WHERE grade > ? AND serie = ? AND wilaya_ar = ?',
      [grade, serie, wilaya_ar]
    );

    const schRankRes = await db.get(
      'SELECT COUNT(*) + 1 AS rank FROM students WHERE grade > ? AND serie = ? AND school_ar = ?',
      [grade, serie, school_ar]
    );

    return NextResponse.json({
      info: student,
      rankings: {
        national: natRankRes.rank,
        wilaya: wilRankRes.rank,
        school: schRankRes.rank
      }
    });

  } catch (error) {
    console.error('Details API Error:', error);
    return NextResponse.json({ error: 'حدث خطأ في السيرفر' }, { status: 500 });
  }
}