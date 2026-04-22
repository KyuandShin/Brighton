'use client';

import { useState } from 'react';
import { BookOpen, CheckCircle2, ChevronRight, Brain, Loader2, AlertCircle, Target, TrendingUp, Lightbulb } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  options: string[];
  topic?: string;
}

interface Weakness {
  topic: string;
  accuracy: number;
  proficiency: string;
  priority: number;
  tip: string;
}

interface Strength {
  topic: string;
  accuracy: number;
}

interface TopicResult {
  topic: string;
  correct: number;
  total: number;
  accuracy: number;
}

interface Result {
  score: number;
  total: number;
  percentage: number;
  mastery_level: string;
  weaknesses: Weakness[];
  strengths: Strength[];
  recommendation: string;
  study_plan: string;
  topic_breakdown: TopicResult[];
}

type Step = 'level' | 'loading' | 'test' | 'submitting' | 'result';

export default function PlacementTestPage() {
  const [step, setStep] = useState<Step>('level');
  const [level, setLevel] = useState<'ELEMENTARY' | 'HIGH_SCHOOL' | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const startTest = async (chosenLevel: 'ELEMENTARY' | 'HIGH_SCHOOL') => {
    setLevel(chosenLevel);
    setStep('loading');
    setError(null);
    setAnswers({});
    setCurrentIdx(0);
    try {
      const res = await fetch(`/api/ai/questions?level=${chosenLevel}&count=30`);
      if (!res.ok) throw new Error('Failed to load questions');
      const data = await res.json();
      setQuestions(data.questions ?? []);
    } catch (e: any) {
      setError(e.message);
    }
    setStep('test');
  };

  const handleAnswer = async (answer: string) => {
    const q = questions[currentIdx];
    setSelectedOption(answer);
    // Brief flash so student sees their selection
    await new Promise(r => setTimeout(r, 220));
    setSelectedOption(null);

    const updatedAnswers = { ...answers, [q.id]: answer };
    setAnswers(updatedAnswers);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1);
      return;
    }

    // Last question — submit
    setStep('submitting');
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: level!,
          answers: Object.entries(updatedAnswers).map(([questionId, ans]) => ({ questionId, answer: ans })),
        }),
      });
      if (!res.ok) throw new Error('Analysis failed');
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    }
    setStep('result');
  };

  const reset = () => {
    setStep('level');
    setResult(null);
    setAnswers({});
    setCurrentIdx(0);
    setError(null);
    setLevel(null);
  };

  // ── Level Selection ──────────────────────────────────────────────────────
  if (step === 'level') {
    return (
      <div className="max-w-2xl mx-auto space-y-8 py-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-[10px] font-black uppercase tracking-widest">
            <Brain size={14} /> AI Placement Assessment
          </div>
          <h2 className="text-3xl font-black text-text-main tracking-tight">Find Your Level</h2>
          <p className="text-text-muted font-bold text-xs uppercase tracking-widest">
            30 questions · All subjects · AI-powered analysis
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LevelCard
            title="Elementary"
            desc="Filipino, English, Math, Science, Social Studies, MAPEH, EsP"
            badge="Grades 1–6"
            color="bg-[#d3f9d8]"
            textColor="text-[#2b8a3e]"
            onClick={() => startTest('ELEMENTARY')}
          />
          <LevelCard
            title="High School"
            desc="Filipino, English, Algebra, Science, Social Studies, TLE, MAPEH, EsP"
            badge="Grades 7–12"
            color="bg-[#d0ebff]"
            textColor="text-[#1971c2]"
            onClick={() => startTest('HIGH_SCHOOL')}
          />
        </div>

        <p className="text-center text-[10px] font-bold text-text-muted uppercase tracking-widest opacity-60">
          Based on the Philippine K-12 Curriculum · Powered by Claude AI
        </p>
      </div>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (step === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
        <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center">
          <Loader2 size={32} className="text-primary animate-spin" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-black uppercase tracking-widest text-text-main">Preparing your test...</p>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Selecting 30 questions across all subjects</p>
        </div>
      </div>
    );
  }

  // ── Test ─────────────────────────────────────────────────────────────────
  if (step === 'test' && questions.length > 0) {
    const q = questions[currentIdx];
    const progress = ((currentIdx + 1) / questions.length) * 100;
    const topicLabel = q.topic ? q.topic.split(' - ')[0] : '';

    return (
      <div className="max-w-2xl mx-auto space-y-8 py-12">
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-[10px] font-black uppercase tracking-widest">
            <AlertCircle size={14} className="shrink-0" /> {error}
          </div>
        )}

        <div className="bg-white border-2 border-[#f1f3f5] rounded-[40px] p-8 space-y-8 shadow-sm">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-text-muted">
              <span>Question {currentIdx + 1} of {questions.length}</span>
              <span className="px-3 py-1 bg-[#f1f3f5] rounded-full">{topicLabel}</span>
            </div>
            <div className="h-2 bg-[#f1f3f5] rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Question */}
          <h3 className="text-xl font-black text-text-main tracking-tight leading-snug">{q.text}</h3>

          {/* Options */}
          <div className="grid grid-cols-1 gap-3">
            {q.options.map((opt) => (
              <button
                key={opt}
                onClick={() => handleAnswer(opt)}
                className={`w-full text-left px-6 py-4 border-2 rounded-2xl font-bold text-sm transition-all
                  ${selectedOption === opt
                    ? 'border-primary bg-primary text-white scale-[0.98]'
                    : 'bg-[#f8f9fa] border-[#f1f3f5] text-text-main hover:border-primary hover:bg-[#f0f4ff] hover:text-primary'
                  }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Submitting ───────────────────────────────────────────────────────────
  if (step === 'submitting') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
        <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center">
          <Brain size={32} className="text-primary animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-sm font-black uppercase tracking-widest text-text-main">Claude AI is analyzing your results...</p>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Identifying strengths, weaknesses & building your study plan</p>
        </div>
      </div>
    );
  }

  // ── Result ───────────────────────────────────────────────────────────────
  if (step === 'result') {
    if (error || !result) {
      return (
        <div className="max-w-2xl mx-auto py-12 space-y-6">
          <div className="flex items-center gap-3 p-6 bg-red-50 border border-red-200 rounded-3xl text-red-600 text-sm font-bold">
            <AlertCircle size={20} className="shrink-0" />
            <div>
              <p className="font-black uppercase tracking-widest text-[10px] mb-1">Analysis Error</p>
              <p>{error ?? 'Something went wrong. Please try again.'}</p>
            </div>
          </div>
          <button onClick={reset} className="w-full py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-[#5c7cfa] transition-all">
            Try Again
          </button>
        </div>
      );
    }

    const pct = result.percentage;
    const scoreColor = pct >= 80 ? '#2f9e44' : pct >= 60 ? '#e67700' : '#e03131';
    const scoreEmoji = pct >= 80 ? '🏆' : pct >= 60 ? '📈' : '💪';

    const masteryColors: Record<string, string> = {
      'Advanced': '#2f9e44',
      'Proficient': '#1971c2',
      'Developing': '#e67700',
      'Beginner': '#e03131',
    };
    const masteryColor = masteryColors[result.mastery_level] ?? '#748ffc';

    return (
      <div className="max-w-2xl mx-auto space-y-6 py-12">

        {/* Score Card */}
        <div className="bg-white border-2 border-[#f1f3f5] rounded-[40px] p-10 shadow-sm space-y-8">
          <div className="text-center space-y-4">
            <div className="text-5xl">{scoreEmoji}</div>
            <div>
              <h2 className="text-3xl font-black text-text-main tracking-tight">Assessment Complete!</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mt-1">
                {level === 'HIGH_SCHOOL' ? 'High School' : 'Elementary'} · Philippine K-12 Curriculum
              </p>
            </div>
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#adb5bd] mb-1">Score</p>
                <p className="text-5xl font-black tracking-tighter" style={{ color: scoreColor }}>
                  {result.score}<span className="text-xl text-[#adb5bd]">/{result.total}</span>
                </p>
                <p className="text-sm font-black text-text-muted">{pct}%</p>
              </div>
              <div className="w-px h-16 bg-[#f1f3f5]" />
              <div className="text-center">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#adb5bd] mb-1">Mastery</p>
                <p className="text-xl font-black" style={{ color: masteryColor }}>{result.mastery_level}</p>
              </div>
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="bg-[#f0f4ff] border border-primary/20 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2">
              <Brain size={14} className="text-primary" />
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">AI Recommendation</p>
            </div>
            <p className="text-sm font-medium text-text-main leading-relaxed">
              {result.recommendation}
            </p>
          </div>
        </div>

        {/* Weaknesses */}
        {result.weaknesses?.length > 0 && (
          <div className="bg-white border-2 border-[#f1f3f5] rounded-[40px] p-8 shadow-sm space-y-5">
            <h4 className="text-xs font-black uppercase tracking-widest text-text-main flex items-center gap-2">
              <Target size={14} className="text-red-500" /> Areas That Need Work
            </h4>
            <div className="space-y-4">
              {result.weaknesses.map((w, idx) => {
                const colors = [
                  { bg: '#fff5f5', border: '#ffc9c9', text: '#e03131' },
                  { bg: '#fff9db', border: '#ffec99', text: '#e67700' },
                  { bg: '#fff3bf', border: '#ffe066', text: '#c69100' },
                ];
                const c = colors[Math.min(idx, 2)];
                return (
                  <div key={idx} className="p-4 rounded-2xl border space-y-2" style={{ backgroundColor: c.bg, borderColor: c.border }}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: c.text }}>{w.topic}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: c.text }}>{w.accuracy}%</span>
                    </div>
                    <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${w.accuracy}%`, backgroundColor: c.text }} />
                    </div>
                    <div className="flex items-start gap-2 mt-2">
                      <Lightbulb size={12} style={{ color: c.text }} className="shrink-0 mt-0.5" />
                      <p className="text-[10px] font-bold leading-relaxed" style={{ color: c.text }}>{w.tip}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Study Plan */}
        {result.study_plan && (
          <div className="bg-white border-2 border-[#f1f3f5] rounded-[40px] p-8 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-text-main flex items-center gap-2">
              <TrendingUp size={14} className="text-primary" /> Your Personalized Study Plan
            </h4>
            <p className="text-sm font-medium text-text-main leading-relaxed">{result.study_plan}</p>
          </div>
        )}

        {/* Strengths */}
        {result.strengths?.length > 0 && (
          <div className="bg-white border-2 border-[#f1f3f5] rounded-[40px] p-8 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-text-main flex items-center gap-2">
              <CheckCircle2 size={14} className="text-green-600" /> Your Strong Subjects
            </h4>
            <div className="flex flex-wrap gap-2">
              {result.strengths.map((s, idx) => (
                <span key={idx} className="px-3 py-1.5 bg-[#d3f9d8] text-[#2f9e44] border border-[#8ce99a] rounded-full text-[10px] font-black uppercase tracking-widest">
                  {s.topic} · {s.accuracy}%
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Full Topic Breakdown */}
        {result.topic_breakdown?.length > 0 && (
          <div className="bg-white border-2 border-[#f1f3f5] rounded-[40px] p-8 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-text-main">Full Subject Breakdown</h4>
            <div className="space-y-2">
              {result.topic_breakdown
                .sort((a, b) => a.accuracy - b.accuracy)
                .map((t, idx) => {
                  const color = t.accuracy >= 80 ? '#2f9e44' : t.accuracy >= 60 ? '#e67700' : '#e03131';
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-[9px] font-black uppercase tracking-widest text-text-muted w-44 shrink-0 truncate">{t.topic}</span>
                      <div className="flex-1 h-2 bg-[#f1f3f5] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${t.accuracy}%`, backgroundColor: color }} />
                      </div>
                      <span className="text-[10px] font-black w-12 text-right" style={{ color }}>{t.accuracy}%</span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => window.location.href = '/dashboard/tutors'}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-black text-xs uppercase tracking-widest py-4 rounded-2xl hover:bg-[#5c7cfa] transition-all shadow-lg shadow-primary/20"
          >
            Find a Tutor <ChevronRight size={16} />
          </button>
          <button
            onClick={reset}
            className="flex-1 flex items-center justify-center gap-2 bg-[#f8f9fa] border-2 border-[#f1f3f5] text-text-muted font-black text-xs uppercase tracking-widest py-4 rounded-2xl hover:border-primary hover:text-primary transition-all"
          >
            Retake Test
          </button>
        </div>
      </div>
    );
  }

  return null;
}

function LevelCard({
  title, desc, badge, color, textColor, onClick
}: {
  title: string; desc: string; badge: string; color: string; textColor: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-8 ${color} border-2 border-white rounded-[40px] text-left hover:shadow-xl transition-all group shadow-sm`}
    >
      <div className={`inline-block px-3 py-1 bg-white/60 rounded-full text-[9px] font-black uppercase tracking-widest ${textColor} mb-6`}>
        {badge}
      </div>
      <div className="w-12 h-12 bg-white/60 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-white transition-colors">
        <BookOpen className={textColor} size={22} />
      </div>
      <h3 className="text-xl font-black text-text-main mb-2 tracking-tight">{title}</h3>
      <p className="text-xs font-bold text-text-muted leading-relaxed">{desc}</p>
    </button>
  );
}
