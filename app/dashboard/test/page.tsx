'use client';

import { useState } from 'react';
import { BookOpen, CheckCircle2, ChevronRight, Brain, Loader2, AlertCircle } from 'lucide-react';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

interface Question {
  id: string;
  text: string;
  options: string[];
}

interface Result {
  score: number;
  total: number;
  percentage: number;
  weaknesses: string[];
  recommendation: string;
}

// Fallback questions if backend is offline
const FALLBACK_QUESTIONS: Record<string, Question[]> = {
  ELEMENTARY: [
    { id: "e1", text: "What is 15 + 27?",              options: ["32","42","43","52"] },
    { id: "e2", text: "What is 63 ÷ 7?",               options: ["7","8","9","11"] },
    { id: "e3", text: "What is 12 × 4?",               options: ["36","48","42","56"] },
    { id: "e4", text: "What is 100 − 38?",             options: ["52","62","72","58"] },
    { id: "e5", text: "How many sides does a pentagon have?", options: ["4","5","6","7"] },
  ],
  HIGH_SCHOOL: [
    { id: "h1", text: "Solve: 2x + 5 = 13",            options: ["3","4","5","6"] },
    { id: "h2", text: "What is √144?",                 options: ["10","11","12","13"] },
    { id: "h3", text: "What is the slope of y = 3x − 7?", options: ["-7","3","7","-3"] },
    { id: "h4", text: "Solve: x² − 9 = 0",            options: ["x=3","x=±3","x=9","x=±9"] },
    { id: "h5", text: "What is sin(90°)?",             options: ["0","0.5","1","−1"] },
  ],
};

type Step = 'level' | 'loading-questions' | 'test' | 'submitting' | 'result';

export default function PlacementTestPage() {
  const [step, setStep] = useState<Step>('level');
  const [level, setLevel] = useState<'ELEMENTARY' | 'HIGH_SCHOOL' | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  // Use a ref-like accumulated map to avoid stale state in handleAnswer
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [backendError, setBackendError] = useState(false);

  // Fetch questions when level is chosen
  const startTest = async (chosenLevel: 'ELEMENTARY' | 'HIGH_SCHOOL') => {
    setLevel(chosenLevel);
    setStep('loading-questions');
    setAnswers({});
    setCurrentIdx(0);
    try {
      const res = await fetch(`${BACKEND}/questions/${chosenLevel}`);
      if (!res.ok) throw new Error('Backend error');
      const data = await res.json();
      setQuestions(data.questions ?? FALLBACK_QUESTIONS[chosenLevel]);
      setBackendError(false);
    } catch {
      setQuestions(FALLBACK_QUESTIONS[chosenLevel]);
      setBackendError(true);
    }
    setStep('test');
  };

  const handleAnswer = async (answer: string) => {
    const currentQ = questions[currentIdx];
    // Build the full answers map synchronously — don't rely on state flush
    const updatedAnswers = { ...answers, [currentQ.id]: answer };
    setAnswers(updatedAnswers);

    const isLast = currentIdx >= questions.length - 1;

    if (!isLast) {
      setCurrentIdx((i) => i + 1);
      return;
    }

    // Last question — submit with the fully built answers map
    setStep('submitting');
    try {
      const payload = {
        level: level!,
        answers: Object.entries(updatedAnswers).map(([questionId, ans]) => ({
          questionId,
          answer: ans,
        })),
      };
      const res = await fetch(`${BACKEND}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Analyze failed');
      const data = await res.json();
      setResult(data);
    } catch {
      // Fallback result based on rough scoring
      const correct = Object.entries(updatedAnswers).filter(([, a]) => a !== '').length;
      setResult({
        score: correct,
        total: questions.length,
        percentage: Math.round((correct / questions.length) * 100),
        weaknesses: ['Could not connect to AI backend'],
        recommendation: 'Please check that the Python backend is running, then retry.',
      });
    }
    setStep('result');
  };

  // ── Level Selection ──────────────────────────────────────────────────
  if (step === 'level') {
    return (
      <div className="max-w-2xl mx-auto space-y-8 py-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-[10px] font-black uppercase tracking-widest">
            <Brain size={14} /> AI Placement Assessment
          </div>
          <h2 className="text-3xl font-black text-text-main tracking-tight">Placement Test</h2>
          <p className="text-text-muted font-bold text-xs uppercase tracking-widest">
            Choose your academic level to begin
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LevelCard
            title="Elementary"
            desc="Basic arithmetic, fractions, geometry and more"
            onClick={() => startTest('ELEMENTARY')}
          />
          <LevelCard
            title="High School"
            desc="Algebra, quadratics, trigonometry and more"
            onClick={() => startTest('HIGH_SCHOOL')}
          />
        </div>
      </div>
    );
  }

  // ── Loading Questions ────────────────────────────────────────────────
  if (step === 'loading-questions') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
        <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center">
          <Loader2 size={32} className="text-primary animate-spin" />
        </div>
        <p className="text-sm font-black uppercase tracking-widest text-text-main">Loading Questions...</p>
      </div>
    );
  }

  // ── Question Screen ──────────────────────────────────────────────────
  if (step === 'test' && questions.length > 0) {
    const q = questions[currentIdx];
    const progress = ((currentIdx + 1) / questions.length) * 100;

    return (
      <div className="max-w-2xl mx-auto space-y-8 py-12">
        {backendError && (
          <div className="flex items-center gap-3 p-4 bg-p-yellow border border-[#fcc419]/30 rounded-2xl text-[#f08c00] text-[10px] font-black uppercase tracking-widest">
            <AlertCircle size={14} className="shrink-0" />
            Backend offline — using fallback questions. Results may be limited.
          </div>
        )}

        <div className="bg-white border-2 border-[#f1f3f5] rounded-[40px] p-8 space-y-8 shadow-sm">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-text-muted">
              <span>Question {currentIdx + 1} of {questions.length}</span>
              <span>{level === 'HIGH_SCHOOL' ? 'High School' : 'Elementary'}</span>
            </div>
            <div className="h-2 bg-[#f1f3f5] rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <h3 className="text-2xl font-black text-text-main tracking-tight leading-snug">{q.text}</h3>

          {/* Options */}
          <div className="grid grid-cols-1 gap-3">
            {q.options.map((opt) => (
              <button
                key={opt}
                onClick={() => handleAnswer(opt)}
                className="w-full text-left px-6 py-4 bg-[#f8f9fa] border-2 border-[#f1f3f5] rounded-2xl font-bold text-sm text-text-main hover:border-primary hover:bg-[#f0f4ff] hover:text-primary transition-all"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Submitting ───────────────────────────────────────────────────────
  if (step === 'submitting') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
        <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center">
          <Brain size={32} className="text-primary animate-pulse" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-black uppercase tracking-widest text-text-main">AI is analyzing your results...</p>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Identifying weak subjects</p>
        </div>
      </div>
    );
  }

  // ── Result ───────────────────────────────────────────────────────────
  if (step === 'result' && result) {
    const pct = result.percentage ?? Math.round((result.score / result.total) * 100);
    const scoreColor = pct >= 80 ? '#27ae60' : pct >= 50 ? '#f08c00' : '#e03131';

    return (
      <div className="max-w-2xl mx-auto space-y-8 py-12">
        <div className="bg-white border-2 border-[#f1f3f5] rounded-[40px] p-10 space-y-8 shadow-sm">
          {/* Score */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ backgroundColor: `${scoreColor}15` }}>
                <CheckCircle2 size={40} style={{ color: scoreColor }} />
              </div>
            </div>
            <h2 className="text-3xl font-black text-text-main tracking-tight">Assessment Complete</h2>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#adb5bd] mb-1">Your Score</p>
              <p className="text-6xl font-black tracking-tighter" style={{ color: scoreColor }}>
                {result.score}<span className="text-2xl text-[#adb5bd]">/{result.total}</span>
              </p>
              <p className="text-sm font-black text-text-muted mt-1">{pct}%</p>
            </div>
          </div>

          {/* Weaknesses */}
          {result.weaknesses.length > 0 && (
            <div className="space-y-3 border-t border-[#f1f3f5] pt-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-text-main flex items-center gap-2">
                <Brain size={14} className="text-primary" /> Areas to Improve
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.weaknesses.map((w) => (
                  <span key={w} className="px-3 py-1.5 bg-[#ffe3e3] text-[#e03131] border border-[#ffc9c9] rounded-full text-[10px] font-black uppercase tracking-widest">
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recommendation */}
          <div className="bg-[#f0f4ff] border border-primary/20 rounded-2xl p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">AI Recommendation</p>
            <p className="text-sm font-medium text-text-main leading-relaxed italic">
              &ldquo;{result.recommendation}&rdquo;
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => window.location.href = '/dashboard/tutors'}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-black text-xs uppercase tracking-widest py-4 rounded-2xl hover:bg-[#5c7cfa] transition-all shadow-lg shadow-primary/20"
            >
              Find Recommended Tutors <ChevronRight size={16} />
            </button>
            <button
              onClick={() => { setStep('level'); setResult(null); setAnswers({}); setCurrentIdx(0); }}
              className="flex-1 flex items-center justify-center gap-2 bg-[#f8f9fa] border-2 border-[#f1f3f5] text-text-muted font-black text-xs uppercase tracking-widest py-4 rounded-2xl hover:border-primary hover:text-primary transition-all"
            >
              Retake Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function LevelCard({ title, desc, onClick }: { title: string; desc: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-8 bg-white border-2 border-[#f1f3f5] rounded-[40px] text-left hover:border-primary/30 hover:shadow-xl transition-all group shadow-sm"
    >
      <div className="w-12 h-12 bg-[#f0f4ff] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
        <BookOpen className="text-primary group-hover:text-white transition-colors" size={22} />
      </div>
      <h3 className="text-xl font-black text-text-main mb-2 tracking-tight">{title}</h3>
      <p className="text-sm font-medium text-text-muted leading-relaxed">{desc}</p>
    </button>
  );
}
