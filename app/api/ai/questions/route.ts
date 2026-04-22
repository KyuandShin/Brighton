import { NextRequest, NextResponse } from 'next/server';
import { QUESTIONS } from './bank';

type Level = keyof typeof QUESTIONS;

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
  const requestedLevel = (searchParams.get('level') ?? 'ELEMENTARY').toUpperCase();
  const count = Math.min(parseInt(searchParams.get('count') ?? '30'), 40);

  // Safe level validation with fallback
  const level = (Object.keys(QUESTIONS).includes(requestedLevel) 
    ? requestedLevel 
    : 'ELEMENTARY') as Level;

  const pool = QUESTIONS[level];
  const selected = shuffle(pool).slice(0, count);

  // Strip correctAnswer before sending to client
  const questions = selected.map(({ correctAnswer: _ca, ...q }) => q);

  return NextResponse.json({ questions, total: questions.length });
}
