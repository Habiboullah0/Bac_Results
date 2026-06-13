import { NextResponse } from 'next/server';
import { getDatabase } from '../../../lib/db';

export async function GET() {
  try {
    const db = getDatabase();

    const topStudentsQuery = `
      WITH RankedStudents AS (
        SELECT id, seat_number, name_ar, name_fr, grade, serie, wilaya_ar, school_ar, decision,
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

    const globalStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN decision LIKE '%Admis%' OR decision LIKE '%ناجح%' THEN 1 ELSE 0 END) as passed,
        SUM(CASE WHEN decision LIKE '%Session%' OR decision LIKE '%تكميلية%' THEN 1 ELSE 0 END) as session_comp
      FROM students
    `).get();

    const serieStats = db.prepare(`
      SELECT 
        serie,
        COUNT(*) as total,
        SUM(CASE WHEN decision LIKE '%Admis%' OR decision LIKE '%ناجح%' THEN 1 ELSE 0 END) as passed,
        ROUND((SUM(CASE WHEN decision LIKE '%Admis%' OR decision LIKE '%ناجح%' THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 1) as pass_rate
      FROM students
      WHERE serie IS NOT NULL AND serie != ''
      GROUP BY serie
      ORDER BY total DESC
    `).all();

    const wilayaStats = db.prepare(`
      SELECT 
        wilaya_ar,
        COUNT(*) as total,
        SUM(CASE WHEN decision LIKE '%Admis%' OR decision LIKE '%ناجح%' THEN 1 ELSE 0 END) as passed,
        ROUND((SUM(CASE WHEN decision LIKE '%Admis%' OR decision LIKE '%ناجح%' THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 1) as pass_rate
      FROM students
      WHERE wilaya_ar IS NOT NULL AND wilaya_ar != ''
      GROUP BY wilaya_ar
      ORDER BY pass_rate DESC
    `).all();

    return NextResponse.json({
      topStudents,
      filters: {
        wilayas,
        schools
      },
      analytics: {
        global: {
          total: globalStats.total,
          passed: globalStats.passed,
          sessionComp: globalStats.session_comp,
          fail: globalStats.total - (globalStats.passed + globalStats.session_comp),
          passRate: globalStats.total > 0 ? ((globalStats.passed / globalStats.total) * 100).toFixed(1) : 0
        },
        series: serieStats,
        wilayas: wilayaStats
      }
    });

  } catch (error) {
    console.error('Init API Error:', error);
    return NextResponse.json({ error: 'حدث خطأ في السيرفر أثناء جلب البيانات الإحصائية' }, { status: 500 });
  }
}