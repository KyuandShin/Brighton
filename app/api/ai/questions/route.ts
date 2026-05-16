import { NextRequest, NextResponse } from 'next/server';
import { QUESTIONS, GRADE_KEYS } from './bank';

type GradeKey = keyof typeof QUESTIONS;

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const requestedGrade = searchParams.get('grade') ?? 'GRADE_1';
  const count = Math.min(parseInt(searchParams.get('count') ?? '20'), 32);

  // Validate grade
  const grade = GRADE_KEYS.includes(requestedGrade) ? requestedGrade : 'GRADE_1';

  const pool = QUESTIONS[grade];
  const selected = shuffle(pool).slice(0, count);

  // Strip correctAnswer before sending to client
  const questions = selected.map(({ correctAnswer: _ca, ...q }) => q);

  return NextResponse.json({
    questions,
    total: questions.length,
    grade,
    subjects: [...new Set(selected.map(q => q.subject))],
  });
}