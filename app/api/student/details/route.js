import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'bac_results.sqlite');
const db = new Database(dbPath);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('id');

  if (!studentId) {
    return NextResponse.json({ error: 'ID المطلوب غير موجود' }, { status: 400 });
  }

  try {
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);

    if (!student) {
      return NextResponse.json({ message: 'الطالب غير موجود' }, { status: 404 });
    }

    const { grade, serie, wilaya_ar, school_ar } = student;

    const natRankRes = db
      .prepare('SELECT COUNT(*) + 1 AS rank FROM students WHERE grade > ? AND serie = ?')
      .get(grade, serie);

    const wilRankRes = db
      .prepare('SELECT COUNT(*) + 1 AS rank FROM students WHERE grade > ? AND serie = ? AND wilaya_ar = ?')
      .get(grade, serie, wilaya_ar);

    const schRankRes = db
      .prepare('SELECT COUNT(*) + 1 AS rank FROM students WHERE grade > ? AND serie = ? AND school_ar = ?')
      .get(grade, serie, school_ar);

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