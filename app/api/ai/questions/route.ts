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

  // Select 5 per subject to ensure even distribution, then fill remaining randomly
  const subjects = ['Mathematics', 'Science', 'Filipino', 'English'] as const;
  const perSubject = Math.floor(count / subjects.length); // 5
  let selected: typeof pool = [];

  for (const subject of subjects) {
    const subjectQuestions = pool.filter(q => q.subject === subject);
    const shuffled = shuffle(subjectQuestions);
    selected.push(...shuffled.slice(0, perSubject));
  }

  // If we need more (due to rounding), add random remaining questions
  if (selected.length < count) {
    const used = new Set(selected.map(q => q.id));
    const remaining = shuffle(pool.filter(q => !used.has(q.id)));
    selected.push(...remaining.slice(0, count - selected.length));
  }

  // Shuffle the final selection so subjects are mixed
  selected = shuffle(selected);

  // Strip correctAnswer before sending to client
  const questions = selected.map(({ correctAnswer: _ca, ...q }) => q);

  return NextResponse.json({
    questions,
    total: questions.length,
    grade,
    subjects: [...new Set(selected.map(q => q.subject))],
  });
}