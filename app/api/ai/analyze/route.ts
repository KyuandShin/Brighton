import { NextRequest, NextResponse } from 'next/server';
import { QUESTIONS, getGradeLabel } from '../questions/bank';

interface AnswerItem { questionId: string; answer: string; }
interface AnalyzeBody { grade: string; answers: AnswerItem[]; }

export async function POST(req: NextRequest) {
  try {
    const body: AnalyzeBody = await req.json();
    const { grade, answers } = body;

    const pool = QUESTIONS[grade] ?? QUESTIONS.GRADE_1;
    const lookup = new Map(pool.map(q => [q.id, q]));

    // ── Grade each answer ────────────────────────────────────────────────────
    type Graded = { questionId: string; subject: string; topic: string; correct: boolean; studentAnswer: string; correctAnswer: string; };
    const graded: Graded[] = answers.map(({ questionId, answer }) => {
      const q = lookup.get(questionId);
      if (!q) return null;
      return {
        questionId,
        subject: q.subject,
        topic: q.topic,
        correct: answer === q.correctAnswer,
        studentAnswer: answer,
        correctAnswer: q.correctAnswer,
      };
    }).filter(Boolean) as Graded[];

    const score = graded.filter(g => g.correct).length;
    const total = graded.length;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

    // ── Per-subject accuracy ────────────────────────────────────────────────
    const subjectMap = new Map<string, { correct: number; total: number }>();
    for (const g of graded) {
      const s = subjectMap.get(g.subject) ?? { correct: 0, total: 0 };
      s.total++;
      if (g.correct) s.correct++;
      subjectMap.set(g.subject, s);
    }

    const subjectResults = Array.from(subjectMap.entries()).map(([subject, { correct, total: t }]) => ({
      subject,
      correct,
      total: t,
      accuracy: Math.round((correct / t) * 100),
    }));

    // ── Per-topic accuracy ──────────────────────────────────────────────────
    const topicMap = new Map<string, { correct: number; total: number }>();
    for (const g of graded) {
      const t = topicMap.get(g.topic) ?? { correct: 0, total: 0 };
      t.total++;
      if (g.correct) t.correct++;
      topicMap.set(g.topic, t);
    }

    const topicResults = Array.from(topicMap.entries()).map(([topic, { correct, total: t }]) => ({
      topic,
      correct,
      total: t,
      accuracy: Math.round((correct / t) * 100),
    }));

    // ── Identify weaknesses and strengths ────────────────────────────────────
    const weakSubjects = subjectResults
      .filter(s => s.accuracy < 70)
      .sort((a, b) => a.accuracy - b.accuracy);

    const strongSubjects = subjectResults
      .filter(s => s.accuracy >= 80);

    const weakTopics = topicResults
      .filter(t => t.accuracy < 70)
      .sort((a, b) => a.accuracy - b.accuracy);

    const strongTopics = topicResults
      .filter(t => t.accuracy >= 80);

    const masteryLevel = percentage >= 90 ? 'Advanced' : percentage >= 75 ? 'Proficient' : percentage >= 50 ? 'Developing' : 'Beginner';

    // ── Grade-specific study tips ────────────────────────────────────────────
    const gradeNum = parseInt(grade.replace('GRADE_', ''));
    const isElementary = gradeNum <= 6;

    const subjectTips: Record<string, Record<string, string>> = {
      'Mathematics': {
        elementary: 'Practice basic math facts daily. Use flashcards, math games, and real-life examples like counting money or measuring ingredients.',
        junior: 'Focus on understanding concepts, not just memorizing formulas. Practice step-by-step problem solving and check your work.',
        senior: 'Master fundamental formulas and practice applying them to complex problems. Study in groups and teach concepts to others.',
      },
      'Science': {
        elementary: 'Observe nature around you. Draw diagrams of plants, animals, and weather. Ask "why" questions and explore answers together.',
        junior: 'Create concept maps connecting scientific ideas. Practice explaining processes like photosynthesis in your own words.',
        senior: 'Focus on understanding scientific principles deeply. Practice lab techniques and connect concepts across biology, chemistry, and physics.',
      },
      'Filipino': {
        elementary: 'Magbasa ng mga kwentong Tagalog araw-araw. Magsanay sa pagtukoy ng mga bahagi ng pananalita at pagbuo ng pangungusap.',
        junior: 'Basahin ang mga klasikong akdang pampanitikan. Gumawa ng character map at suriin ang mga tema ng bawat kabanata.',
        senior: 'Pag-aralan ang mga teoryang pampanitikan at magsanay sa pagsulat ng pananaliksik. Gamitin ang Filipino sa pang-araw-araw na komunikasyon.',
      },
      'English': {
        elementary: 'Read storybooks aloud for 15 minutes daily. Practice writing simple sentences and identifying nouns, verbs, and adjectives.',
        junior: 'Read actively by taking notes on literary devices. Practice writing paragraphs with clear topic sentences and supporting details.',
        senior: 'Analyze complex texts for theme, tone, and literary techniques. Practice writing thesis-driven essays with textual evidence.',
      },
    };

    const getSubjectTip = (subject: string): string => {
      const tips = subjectTips[subject];
      if (!tips) return `Review your notes and practice more problems in ${subject}. Consider getting a tutor for extra help.`;
      if (isElementary) return tips.elementary;
      if (gradeNum <= 10) return tips.junior;
      return tips.senior;
    };

    const gradeLabel = getGradeLabel(grade);

    // ── Build analysis response ─────────────────────────────────────────────
    // ── Tutor recommendations based on weak subjects ────────────────────────
    const tutorRecommendations = weakSubjects.map(s => ({
      subject: s.subject,
      searchQuery: encodeURIComponent(s.subject),
      why: `You scored ${s.accuracy}% in ${s.subject}. A tutor can help you master ${getSubjectTip(s.subject).toLowerCase()}`,
    }));

    // If no weak subjects, recommend based on lowest score
    if (tutorRecommendations.length === 0 && subjectResults.length > 0) {
      const lowest = subjectResults.sort((a, b) => a.accuracy - b.accuracy)[0];
      if (lowest.accuracy < 90) {
        tutorRecommendations.push({
          subject: lowest.subject,
          searchQuery: encodeURIComponent(lowest.subject),
          why: `Keep sharpening your ${lowest.subject} skills! A tutor can help you reach advanced level.`,
        });
      }
    }

    const analysis = {
      mastery_level: masteryLevel,
      subject_breakdown: subjectResults,
      topic_breakdown: topicResults,
      weaknesses: weakTopics.map((t, i) => ({
        topic: t.topic,
        accuracy: t.accuracy,
        proficiency: t.accuracy < 40 ? 'Struggling' : 'Needs Work',
        priority: i + 1,
        tip: getSubjectTip(t.topic.split(' - ')[0] || t.topic),
      })),
      strengths: strongTopics.map(t => ({
        topic: t.topic,
        accuracy: t.accuracy,
      })),
      weak_subjects: weakSubjects.map(s => s.subject),
      strong_subjects: strongSubjects.map(s => s.subject),
      recommendation: generateRecommendation(percentage, score, total, weakSubjects, strongSubjects, gradeLabel, isElementary),
      study_plan: generateStudyPlan(weakSubjects, strongSubjects, weakTopics, gradeLabel, isElementary),
      tutor_recommendations: tutorRecommendations,
      grade: grade,
      grade_label: gradeLabel,
    };

    return NextResponse.json({
      score,
      total,
      percentage,
      grade,
      grade_label: gradeLabel,
      mastery_level: analysis.mastery_level,
      subject_breakdown: analysis.subject_breakdown,
      topic_breakdown: analysis.topic_breakdown,
      weaknesses: analysis.weaknesses ?? [],
      strengths: analysis.strengths ?? [],
      weak_subjects: analysis.weak_subjects ?? [],
      strong_subjects: analysis.strong_subjects ?? [],
      recommendation: analysis.recommendation,
      study_plan: analysis.study_plan,
      tutor_recommendations: analysis.tutor_recommendations,
    });
  } catch (err: any) {
    console.error('[POST /api/ai/analyze]', err);
    return NextResponse.json({ error: err.message ?? 'Analysis failed' }, { status: 500 });
  }
}

// ── Recommendation generator ────────────────────────────────────────────
function generateRecommendation(
  percentage: number,
  score: number,
  total: number,
  weakSubjects: { subject: string; accuracy: number }[],
  strongSubjects: { subject: string; accuracy: number }[],
  gradeLabel: string,
  isElementary: boolean = true
): string {
  const weakNames = weakSubjects.map(s => s.subject);
  const strongNames = strongSubjects.map(s => s.subject);

  if (isElementary) {
    let msg = '';
    if (percentage >= 90) {
      msg = `🌟 Amazing work, ${gradeLabel} student! You scored ${percentage}% — that's outstanding! `;
      if (weakNames.length > 0) msg += `To get even better, spend extra time on ${weakNames.slice(0, 2).join(' and ')}. `;
      msg += `Keep reading, practicing, and asking questions — you're a superstar! 🎯`;
    } else if (percentage >= 75) {
      msg = `📈 Great job! You scored ${percentage}%. You're learning well! `;
      if (weakNames.length > 0) msg += `Let's focus on ${weakNames.slice(0, 2).join(' and ')} — with more practice, you'll master these too! `;
      if (strongNames.length > 0) msg += `You're doing great in ${strongNames.slice(0, 2).join(' and ')}! `;
      msg += `A tutor can help make learning even more fun! 💪`;
    } else if (percentage >= 50) {
      msg = `📚 You scored ${percentage}% — a great start! Every step counts! `;
      if (weakNames.length > 0) msg += `Focus more on ${weakNames.slice(0, 3).join(', ')}. `;
      msg += `With fun activities and a tutor's help, you'll see big improvements. Keep going! ✨`;
    } else {
      msg = `💪 You scored ${percentage}% — and that's okay! Everyone starts somewhere! `;
      if (weakNames.length > 0) msg += `This tells us you need help with: ${weakNames.slice(0, 3).join(', ')}. `;
      msg += `With the right support, you can improve a lot. A tutor can make learning fun! 🌱`;
    }
    msg += ` Keep studying and never stop being curious!`;
    return msg;
  }

  let msg = '';
  if (percentage >= 90) {
    msg = `Excellent work! You scored ${percentage}% on this ${gradeLabel} assessment. 🌟 `;
    if (weakNames.length > 0) msg += `For a quick boost, review ${weakNames.slice(0, 2).join(' and ')}. `;
    msg += `Keep up the great habits! 🎯`;
  } else if (percentage >= 75) {
    msg = `Good job! You scored ${percentage}%. You're on the right track! 📈 `;
    if (weakNames.length > 0) msg += `Focus on ${weakNames.slice(0, 2).join(' and ')} — great areas for tutoring. `;
    if (strongNames.length > 0) msg += `Your strengths in ${strongNames.slice(0, 2).join(' and ')} show a solid foundation. `;
    msg += `A tutor can turn weak spots into strengths! 💪`;
  } else if (percentage >= 50) {
    msg = `You scored ${percentage}% — a good starting point! 📚 `;
    if (weakNames.length > 0) msg += `Prioritize: ${weakNames.slice(0, 3).join(', ')}. `;
    msg += `With consistent practice and guidance, you'll improve. Don't give up! ✨`;
  } else {
    msg = `You scored ${percentage}%. This tells us where you need support! 💪 `;
    if (weakNames.length > 0) msg += `Focus on: ${weakNames.slice(0, 3).join(', ')}. `;
    msg += `With the right tutor, these can become your best subjects! 🌱`;
  }
  msg += ` I recommend at least 2-3 tutoring sessions per week.`;
  return msg;
}

// ── Study plan generator ────────────────────────────────────────────────
function generateStudyPlan(
  weakSubjects: { subject: string; accuracy: number }[],
  strongSubjects: { subject: string; accuracy: number }[],
  weakTopics: { topic: string; accuracy: number }[],
  gradeLabel: string,
  isElementary: boolean = true
): string {
  const weakSubjectNames = weakSubjects.map(s => s.subject).slice(0, 3);
  const strongSubjectNames = strongSubjects.map(s => s.subject).slice(0, 2);
  const weakTopicNames = weakTopics.map(t => t.topic).slice(0, 3);

  if (weakSubjectNames.length === 0) {
    if (isElementary) {
      return `🌟 You're doing great across all subjects for ${gradeLabel}! Here's how to keep shining:\n\n1. Read for 20 minutes every day.\n2. Practice math facts with fun games for 10 minutes daily.\n3. Explore science with simple experiments at home.\n4. Review ${strongSubjectNames.join(' and ') || 'your favorite subjects'} once a week.\n\nKeep up the amazing work! 🎯`;
    }
    return `Great job! You're doing well across all subjects for ${gradeLabel}. To stay sharp, review ${strongSubjectNames.join(' and ') || 'advanced topics in your strongest areas'}. Consider peer tutoring to reinforce your knowledge!`;
  }

  if (isElementary) {
    let plan = `Here's a fun study plan for a ${gradeLabel} student like you! 🎒\n\n`;
    plan += `📌 1. Start with ${weakSubjectNames[0] || weakTopicNames[0]} — practice for 15 minutes daily with fun activities. `;
    if (weakSubjectNames.length > 1) plan += `\n📌 2. Next, work on ${weakSubjectNames[1] || weakTopicNames[1]} — 10 minutes every other day. `;
    if (weakSubjectNames.length > 2) plan += `\n📌 3. Then tackle ${weakSubjectNames[2] || weakTopicNames[2]} — use colorful pictures and short videos. `;
    plan += `\n📌 4. Review ${strongSubjectNames.join(' and ') || 'subjects you enjoy'} for 10 minutes weekly. `;
    plan += `\n\n🎯 Book a tutor 2-3 times a week to learn with someone who makes studying exciting!`;
    return plan;
  }

  let plan = `Study Plan for ${gradeLabel}:\n\n`;
  plan += `1. Prioritize ${weakSubjectNames[0] || weakTopicNames[0]} — 20 minutes daily reviewing concepts and practicing problems. `;
  if (weakSubjectNames.length > 1) plan += `2. Work on ${weakSubjectNames[1] || weakTopicNames[1]} — 15 minutes every other day. `;
  if (weakSubjectNames.length > 2) plan += `3. Focus on ${weakSubjectNames[2] || weakTopicNames[2]} — use flashcards and concept maps. `;
  if (strongSubjectNames.length > 0) plan += `4. Maintain strengths in ${strongSubjectNames.join(' and ')} — review weekly. `;
  plan += `Book a tutor at least twice a week for personalized guidance on weak areas.`;
  return plan;
}