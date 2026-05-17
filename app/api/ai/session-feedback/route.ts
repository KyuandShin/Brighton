import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';
import { getGradeLabel } from '../questions/bank';

export async function POST(req: NextRequest) {
  try {
    const { data } = await auth.getSession({
      fetchOptions: { headers: req.headers }
    });
    if (!data?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { bookingId } = await req.json();
    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
    }

    // Fetch booking with notes and student assessment data
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        notes: true,
        student: {
          include: {
            user: { select: { id: true, name: true } },
            attempts: {
              orderBy: { timestamp: 'desc' },
              take: 3,
            },
          },
        },
        tutor: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const sessionNotes = booking.notes;
    const studentAttempts = booking.student.attempts;

    // Generate AI session feedback from the notes + assessment data
    const feedback = generateSessionFeedback({
      subject: sessionNotes?.subject || undefined,
      topics: sessionNotes?.topics as string[] || [],
      skills: sessionNotes?.skills as Record<string, string[]> | null || null,
      notesContent: sessionNotes?.content || '',
      homework: sessionNotes?.homework || null,
      tutorName: booking.tutor.user.name || 'Your tutor',
      studentName: booking.student.user.name || 'Student',
      recentAttempts: studentAttempts.map(a => ({
        score: a.score,
        total: a.total,
        grade: a.grade,
        mastery: a.mastery,
        strengths: a.strengths as string[],
        weaknesses: a.weaknesses as any[],
        timestamp: a.timestamp,
      })),
    });

    return NextResponse.json(feedback);
  } catch (err: any) {
    console.error('[POST /api/ai/session-feedback]', err);
    return NextResponse.json({ error: err.message ?? 'Analysis failed' }, { status: 500 });
  }
}

interface FeedbackInput {
  subject?: string;
  topics: string[];
  skills: Record<string, string[]> | null;
  notesContent: string;
  homework: string | null;
  tutorName: string;
  studentName: string;
  recentAttempts: any[];
}

function generateSessionFeedback(input: FeedbackInput) {
  const { subject, topics, skills, notesContent, homework, tutorName, recentAttempts } = input;

  // Determine topics covered from notes
  const topicsCovered = topics.length > 0 
    ? topics 
    : extractTopicsFromNotes(notesContent);

  // Determine understanding levels from skills or infer from notes
  const confidentTopics = skills?.Confident || [];
  const needsPracticeTopics = skills?.NeedsPractice || [];
  const strugglingTopics = skills?.Struggling || [];

  // Connect to assessment data
  const weakAreasFromAssessment = recentAttempts.length > 0
    ? recentAttempts[0]?.weaknesses?.map((w: any) => w.topic || w) || []
    : [];

  const strengthsFromAssessment = recentAttempts[0]?.strengths || [];

  // Generate recommendations
  const recommendations: string[] = [];

  if (strugglingTopics.length > 0) {
    recommendations.push(`Focus on ${strugglingTopics.slice(0, 2).join(' and ')} — these need extra practice.`);
  }
  if (needsPracticeTopics.length > 0) {
    recommendations.push(`Review ${needsPracticeTopics.slice(0, 2).join(' and ')} with additional exercises.`);
  }
  if (homework) {
    recommendations.push(`Complete the assigned homework: ${homework}`);
  }
  if (weakAreasFromAssessment.length > 0) {
    const overlap = weakAreasFromAssessment.filter((w: string) => 
      topicsCovered.some(t => t.toLowerCase().includes(w.toLowerCase()))
    );
    if (overlap.length > 0) {
      recommendations.push(`This session addressed areas from your assessment: ${overlap.slice(0, 2).join(', ')}. Continue practicing to strengthen these.`);
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('Keep up the great work! Continue practicing and exploring new topics.');
  }

  // Generate study tips based on subject
  const studyTips = subject ? generateSubjectTips(subject, topicsCovered) : [];

  // Calculate session confidence score
  const totalSkills = confidentTopics.length + needsPracticeTopics.length + strugglingTopics.length;
  const confidenceScore = totalSkills > 0 
    ? Math.round((confidentTopics.length / totalSkills) * 100)
    : null;

  return {
    subject: subject || 'General',
    topics_covered: topicsCovered,
    understanding: {
      confident: confidentTopics,
      needs_practice: needsPracticeTopics,
      struggling: strugglingTopics,
      confidence_score: confidenceScore,
    },
    notes_summary: notesContent ? summarizeNotes(notesContent) : null,
    homework: homework || null,
    connection_to_assessment: {
      strengths_reinforced: strengthsFromAssessment.filter((s: string) =>
        topicsCovered.some(t => t.toLowerCase().includes(s.toLowerCase()))
      ),
      weaknesses_addressed: weakAreasFromAssessment.filter((w: string) =>
        topicsCovered.some(t => t.toLowerCase().includes(w.toLowerCase()))
      ),
    },
    recommendations,
    study_tips: studyTips,
    tutor_feedback: notesContent 
      ? `Based on your session with ${tutorName}, here's what you covered and how to build on it.`
      : `Your session with ${tutorName} has been completed. Review your notes and practice the topics discussed.`,
  };
}

function extractTopicsFromNotes(notes: string): string[] {
  if (!notes) return [];
  // Simple keyword-based topic extraction
  const topicKeywords = [
    'algebra', 'geometry', 'fractions', 'decimals', 'equations',
    'grammar', 'vocabulary', 'reading', 'writing', 'comprehension',
    'photosynthesis', 'cells', 'forces', 'energy', 'matter',
    'pangngalan', 'pandiwa', 'pang-uri', 'pang-abay', 'gramatika',
    'addition', 'subtraction', 'multiplication', 'division',
    'trigonometry', 'calculus', 'statistics', 'probability',
  ];
  
  const found = topicKeywords.filter(keyword => 
    notes.toLowerCase().includes(keyword.toLowerCase())
  );
  
  // Capitalize first letter
  return found.map(t => t.charAt(0).toUpperCase() + t.slice(1));
}

function summarizeNotes(notes: string): string {
  // Simple summarization - take first 2-3 sentences or first 150 chars
  const cleaned = notes.trim();
  if (cleaned.length <= 200) return cleaned;
  
  const sentences = cleaned.match(/[^.!?]+[.!?]+/g);
  if (sentences && sentences.length >= 2) {
    return sentences.slice(0, 2).join(' ').trim();
  }
  return cleaned.slice(0, 200) + '...';
}

function generateSubjectTips(subject: string, topics: string[]): string[] {
  const tips: Record<string, string[]> = {
    'Mathematics': [
      'Practice 10-15 problems daily to build fluency',
      'Use Khan Academy or YouTube tutorials for visual explanations',
      'Create formula cards for quick reference',
      'Teach concepts to someone else to reinforce understanding',
    ],
    'Science': [
      'Draw diagrams and concept maps to visualize processes',
      'Relate concepts to everyday observations',
      'Practice explaining scientific processes in your own words',
      'Watch educational videos related to the topics covered',
    ],
    'Filipino': [
      'Magbasa ng mga kwento at artikulo araw-araw',
      'Magsanay sa pagsulat ng mga pangungusap at talata',
      'Gumamit ng Filipino sa pang-araw-araw na usapan',
      'Manood ng mga programang Filipino para sa mas malawak na bokabularyo',
    ],
    'English': [
      'Read for 20 minutes daily — fiction and non-fiction',
      'Keep a vocabulary journal with new words and example sentences',
      'Practice writing short paragraphs on different topics',
      'Review grammar rules with online exercises',
    ],
  };

  const subjectTips = tips[subject] || [
    'Review your notes within 24 hours for better retention',
    'Practice with exercises related to the topics covered',
    'Book another session to build on what you learned',
  ];

  if (topics.length > 0) {
    subjectTips.unshift(`Review these topics from today's session: ${topics.slice(0, 3).join(', ')}`);
  }

  return subjectTips;
}