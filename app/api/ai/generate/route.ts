import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';

interface GenerateBody {
  type: 'bio' | 'headline';
  name: string;
  subjects?: string[];
  experience?: string;
  education?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { data } = await auth.getSession({
      fetchOptions: { headers: req.headers }
    });
    if (!data?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body: GenerateBody = await req.json();
    const { type, name } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const firstName = name.split(' ')[0] || name;

    if (type === 'headline') {
      const headlines = [
        `${firstName} | Experienced & Patient Tutor for All Ages`,
        `Dedicated Tutor Specializing in Personalized Learning`,
        `Passionate Educator | Results-Driven Instruction`,
        `${firstName} | Making Learning Enjoyable & Effective`,
        `Patient Tutor Committed to Your Academic Success`,
        `${firstName} | Expert Guidance for Elementary to High School`,
        `${firstName} | Building Confidence Through Quality Tutoring`,
        `${firstName} | Helping Students Reach Their Full Potential`,
        `Licensed Professional Tutor with Proven Track Record`,
        `${firstName} | Customized Lessons for Every Learning Style`,
      ];
      
      const selected = headlines[Math.floor(Math.random() * headlines.length)];
      return NextResponse.json({ result: selected });
    }

    if (type === 'bio') {
      const bios = [
        `Hi! I'm ${firstName}, a passionate and experienced educator dedicated to helping students reach their full potential. I specialize in creating engaging, personalized lessons that adapt to each student's unique learning style and goals. With a focus on building confidence and making learning enjoyable, I provide clear explanations, practical examples, and constructive feedback to ensure real progress. Let's work together to achieve your learning objectives!`,
        
        `Hello! My name is ${firstName} and I love helping students discover their potential. I believe that every student can succeed with the right guidance and support. My teaching approach is patient, encouraging, and focused on understanding each student's individual needs. I create a comfortable learning environment where questions are welcome, mistakes are seen as opportunities to grow, and progress is celebrated.`,
        
        `Greetings! I'm ${firstName}, an enthusiastic educator with a passion for teaching. My goal is to make learning not just effective, but also enjoyable. I use real-world examples, interactive methods, and personalized strategies to help students grasp concepts thoroughly. Whether you're a beginner or looking to advance your skills, I will support you every step of the way on your learning journey.`,
        
        `I'm ${firstName}, and teaching is my calling. I believe education transforms lives, and I'm committed to making a difference in every student I work with. My sessions are structured yet flexible — I follow a clear learning path while adapting to each student's pace. I emphasize critical thinking, curiosity, and a genuine love for learning in every lesson I teach.`,
        
        `${firstName} here! I bring patience, creativity, and deep subject knowledge to every tutoring session. Whether you need help catching up, staying ahead, or preparing for exams, I tailor my approach specifically for you. My students describe me as approachable, thorough, and inspiring. Let's start your learning journey together!`,
      ];

      const selected = bios[Math.floor(Math.random() * bios.length)];
      return NextResponse.json({ result: selected });
    }

    return NextResponse.json({ error: 'Invalid generation type' }, { status: 400 });
  } catch (err: any) {
    console.error('[POST /api/ai/generate]', err);
    return NextResponse.json({ error: err.message ?? 'Generation failed' }, { status: 500 });
  }
}