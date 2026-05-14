'use client';

import { useState } from 'react';
import { BookOpen, CheckCircle2, ChevronRight, Brain, Loader2, AlertCircle, Target, TrendingUp, Lightbulb, Star, Sparkles, GraduationCap, Rocket, Heart } from 'lucide-react';

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
      if (!data.questions?.length) throw new Error('No questions available');
      setQuestions(data.questions);
      setStep('test');
    } catch (e: any) {
      setError(e.message);
      setStep('level');
    }
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
      setStep('result');
    } catch (e: any) {
      setError(e.message);
      setStep('result');
    }
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
      <div className="max-w-3xl mx-auto space-y-8 py-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-p-sakura rounded-full shadow-sm">
            <Brain size={14} className="text-pink-500" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-pink-600">AI Placement Assessment</span>
          </div>
          <h2 className="text-4xl font-black tracking-tight">
            <span className="gradient-text">Find Your Level</span>
          </h2>
          <div className="flex items-center justify-center gap-2 text-text-muted">
            <Sparkles size={14} />
            <p className="font-bold text-xs uppercase tracking-widest">30 questions · All subjects · AI-powered analysis</p>
            <Sparkles size={14} />
          </div>
        </div>

        {/* Level Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => startTest('ELEMENTARY')}
            className="group relative overflow-hidden p-8 bg-gradient-to-br from-[#d3f9d8] to-[#b2f2bb] border-2 border-white rounded-[40px] text-left hover:shadow-xl transition-all duration-300 shadow-sm hover:-translate-y-1"
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#8ce99a]/30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10 space-y-5">
              <div className="flex items-center justify-between">
                <div className="inline-block px-3 py-1 bg-white/70 rounded-full text-[9px] font-black uppercase tracking-widest text-[#2b8a3e] shadow-sm">
                  Grades 1–6
                </div>
                <div className="w-10 h-10 bg-white/60 rounded-2xl flex items-center justify-center group-hover:bg-white/90 transition-colors group-hover:scale-110 duration-300">
                  <BookOpen className="text-[#2b8a3e]" size={20} />
                </div>
              </div>
              <h3 className="text-2xl font-black text-[#2b8a3e] tracking-tight">Elementary</h3>
              <p className="text-xs font-bold text-[#2b8a3e]/70 leading-relaxed">
                Filipino, English, Math, Science, Social Studies, MAPEH, EsP
              </p>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#2b8a3e] group-hover:gap-3 transition-all">
                Start Assessment <ChevronRight size={14} />
              </div>
            </div>
          </button>

          <button
            onClick={() => startTest('HIGH_SCHOOL')}
            className="group relative overflow-hidden p-8 bg-gradient-to-br from-[#d0ebff] to-[#a5d8ff] border-2 border-white rounded-[40px] text-left hover:shadow-xl transition-all duration-300 shadow-sm hover:-translate-y-1"
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#74c0fc]/30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10 space-y-5">
              <div className="flex items-center justify-between">
                <div className="inline-block px-3 py-1 bg-white/70 rounded-full text-[9px] font-black uppercase tracking-widest text-[#1971c2] shadow-sm">
                  Grades 7–12
                </div>
                <div className="w-10 h-10 bg-white/60 rounded-2xl flex items-center justify-center group-hover:bg-white/90 transition-colors group-hover:scale-110 duration-300">
                  <GraduationCap className="text-[#1971c2]" size={20} />
                </div>
              </div>
              <h3 className="text-2xl font-black text-[#1971c2] tracking-tight">High School</h3>
              <p className="text-xs font-bold text-[#1971c2]/70 leading-relaxed">
                Filipino, English, Algebra, Science, Social Studies, TLE, MAPEH, EsP
              </p>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#1971c2] group-hover:gap-3 transition-all">
                Start Assessment <ChevronRight size={14} />
              </div>
            </div>
          </button>
        </div>

        <p className="text-center text-[10px] font-bold text-text-muted uppercase tracking-widest opacity-60 flex items-center justify-center gap-2">
          <Sparkles size={12} className="text-primary" />
          Based on the Philippine K-12 Curriculum · Powered by AI
          <Sparkles size={12} className="text-primary" />
        </p>
      </div>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (step === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-pink-100 rounded-3xl flex items-center justify-center animate-bounce-cute">
            <Brain size={36} className="text-primary" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-p-sakura rounded-full flex items-center justify-center animate-sparkle">
            <Sparkles size={14} className="text-pink-500" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-sm font-black uppercase tracking-widest text-text-main">Preparing your test...</p>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Selecting 30 questions across all subjects</p>
        </div>
        <div className="flex gap-1.5 mt-2">
          {[0,1,2].map(i => (
            <div key={i} className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }} />
          ))}
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
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        {error && (
          <div className="flex items-center gap-3 p-4 bg-[#fff5f5] border-2 border-[#ffc9c9] rounded-2xl text-[#e03131] text-[10px] font-black uppercase tracking-widest">
            <AlertCircle size={14} className="shrink-0" /> {error}
          </div>
        )}

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted">
              <div className="w-7 h-7 bg-gradient-to-br from-primary/20 to-pink-100 rounded-lg flex items-center justify-center">
                <Brain size={14} className="text-primary" />
              </div>
              Question {currentIdx + 1} of {questions.length}
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-p-sakura rounded-full text-[9px] font-black uppercase tracking-widest text-pink-600">
                {topicLabel}
              </span>
              <span className="text-[10px] font-black text-text-muted">{Math.round(progress)}%</span>
            </div>
          </div>
          <div className="h-2.5 bg-[#f1f3f5] rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-primary to-pink-400 rounded-full transition-all duration-500 relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-surface border-2 border-border rounded-[40px] p-8 md:p-10 space-y-8 shadow-sm hover:shadow-md transition-shadow duration-300">
          <h3 className="text-xl md:text-2xl font-black text-text-main tracking-tight leading-snug flex items-start gap-3">
            <span className="w-8 h-8 bg-gradient-to-br from-primary/10 to-pink-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
              <Star size={16} className="text-primary" />
            </span>
            <span>{q.text}</span>
          </h3>

          {/* Options */}
          <div className="grid grid-cols-1 gap-3">
            {q.options.map((opt, idx) => (
              <button
                key={opt}
                onClick={() => handleAnswer(opt)}
                className={`group w-full text-left px-6 py-4 border-2 rounded-2xl font-bold text-sm transition-all duration-200 relative overflow-hidden
                  ${selectedOption === opt
                    ? 'border-primary bg-primary text-white scale-[0.98] shadow-lg shadow-primary/20'
                    : 'bg-[#f8f9fa] border-[#f1f3f5] text-text-main hover:border-primary/40 hover:bg-[#f0f4ff] hover:text-primary hover:shadow-md'
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs transition-all ${
                    selectedOption === opt
                      ? 'bg-white/20 text-white'
                      : 'bg-surface border-2 border-border text-text-muted group-hover:border-primary/30'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className="flex-1">{opt}</span>
                  {selectedOption === opt && (
                    <CheckCircle2 size={18} className="text-white/80" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex flex-wrap justify-center gap-1.5">
          {questions.slice(0, Math.min(30, questions.length)).map((_, idx) => (
            <div key={idx} className={`w-2 h-2 rounded-full transition-all duration-300 ${
              idx === currentIdx ? 'w-4 bg-primary scale-125' 
              : idx < currentIdx ? 'bg-primary/40' 
              : 'bg-[#f1f3f5]'
            }`} />
          ))}
        </div>
      </div>
    );
  }

  // ── Submitting ───────────────────────────────────────────────────────────
  if (step === 'submitting') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-to-br from-primary/10 via-pink-50 to-primary/5 rounded-[32px] flex items-center justify-center">
            <Brain size={48} className="text-primary animate-pulse" />
          </div>
          <div className="absolute -top-3 -right-3 w-10 h-10 bg-p-sakura rounded-full flex items-center justify-center">
            <Sparkles size={16} className="text-pink-500 animate-sparkle" />
          </div>
          <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-[#d3f9d8] rounded-full flex items-center justify-center animate-float-slow">
            <Heart size={12} className="text-[#2b8a3e]" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-lg font-black uppercase tracking-widest text-text-main">AI is analyzing your results...</p>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest max-w-xs mx-auto leading-relaxed">
            Identifying your strengths, weaknesses & building a personalized study plan
          </p>
        </div>
        <div className="flex gap-2 mt-4">
          {[0,1,2,3,4].map(i => (
            <div key={i} className="w-3 h-3 bg-gradient-to-r from-primary to-pink-400 rounded-full animate-bounce" 
              style={{ animationDelay: `${i * 0.12}s`, animationDuration: '0.7s' }} />
          ))}
        </div>
      </div>
    );
  }

  // ── Result ───────────────────────────────────────────────────────────────
  if (step === 'result') {
    if (error || !result) {
      return (
        <div className="max-w-2xl mx-auto py-12 space-y-6">
          <div className="flex items-center gap-4 p-6 bg-[#fff5f5] border-2 border-[#ffc9c9] rounded-3xl text-[#e03131]">
            <div className="w-12 h-12 bg-[#ffe3e3] rounded-2xl flex items-center justify-center shrink-0">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="font-black uppercase tracking-widest text-[10px] mb-1">Analysis Error</p>
              <p className="font-bold text-sm">{error ?? 'Something went wrong. Please try again.'}</p>
            </div>
          </div>
          <button onClick={reset} className="w-full py-5 bg-gradient-to-r from-primary to-pink-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:shadow-xl hover:shadow-primary/20 transition-all">
            Try Again
          </button>
        </div>
      );
    }

    const pct = result.percentage;
    const scoreColor = pct >= 80 ? '#2f9e44' : pct >= 60 ? '#e67700' : '#e03131';
    const scoreEmoji = pct >= 80 ? '★' : pct >= 60 ? '◆' : '●';
    const levelLabel = level === 'HIGH_SCHOOL' ? 'High School' : 'Elementary';

    const masteryColors: Record<string, string> = {
      'Advanced': '#2f9e44',
      'Proficient': '#1971c2',
      'Developing': '#e67700',
      'Beginner': '#e03131',
    };
    const masteryColor = masteryColors[result.mastery_level] ?? '#748ffc';

    return (
      <div className="max-w-2xl mx-auto space-y-6 py-8">

        {/* Score Card */}
        <div className="bg-surface border-2 border-border rounded-[40px] p-8 md:p-10 shadow-sm space-y-8 hover:shadow-md transition-shadow duration-300">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-pink-400 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
              <Star size={32} className="text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-p-sakura rounded-full text-[9px] font-black uppercase tracking-widest text-pink-600 mb-3">
                <Brain size={12} /> Assessment Complete
              </div>
              <h2 className="text-3xl font-black text-text-main tracking-tight">Your Results Are In!</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mt-1 flex items-center justify-center gap-2">
                <Star size={12} className="text-primary" />
                {levelLabel} · Philippine K-12 Curriculum
                <Star size={12} className="text-primary" />
              </p>
            </div>
            <div className="flex items-center justify-center gap-8 p-6 bg-gradient-to-br from-[#f8f9fa] to-[#f0f4ff] rounded-3xl">
              <div className="text-center">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#adb5bd] mb-2">Score</p>
                <p className="text-5xl font-black tracking-tighter" style={{ color: scoreColor }}>
                  {result.score}<span className="text-xl text-[#adb5bd]">/{result.total}</span>
                </p>
                <div className="mt-1 px-3 py-0.5 rounded-full text-[10px] font-black" style={{ backgroundColor: scoreColor + '15', color: scoreColor }}>
                  {pct}%
                </div>
              </div>
              <div className="w-px h-20 bg-[#f1f3f5]" />
              <div className="text-center">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#adb5bd] mb-2">Mastery Level</p>
                <p className="text-2xl font-black" style={{ color: masteryColor }}>{result.mastery_level}</p>
                <div className="mt-1 px-3 py-0.5 rounded-full text-[10px] font-black" style={{ backgroundColor: masteryColor + '15', color: masteryColor }}>
                  {pct >= 80 ? 'Keep Shining!' : pct >= 60 ? 'Keep Growing!' : 'Keep Trying!'}
                </div>
              </div>
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-[#f0f4ff] to-pink-50/50 border-2 border-primary/15 rounded-3xl p-6 space-y-3">
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-primary/5 rounded-full blur-2xl" />
            <div className="relative z-10 flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-pink-200/30 rounded-xl flex items-center justify-center shrink-0">
                <Brain size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                  <Rocket size={12} /> AI Recommendation
                </p>
                <p className="text-sm font-medium text-text-main leading-relaxed">
                  {result.recommendation}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Weaknesses */}
        {result.weaknesses?.length > 0 && (
          <div className="bg-surface border-2 border-border rounded-[40px] p-8 shadow-sm space-y-6 hover:shadow-md transition-shadow duration-300">
            <h4 className="text-sm font-black uppercase tracking-widest text-text-main flex items-center gap-2">
              <div className="w-8 h-8 bg-[#fff5f5] rounded-xl flex items-center justify-center">
                <Target size={16} className="text-red-500" />
              </div>
              Areas That Need Work
            </h4>
            <div className="space-y-4">
              {result.weaknesses.map((w, idx) => {
                const colors = [
                  { bg: '#fff5f5', border: '#ffc9c9', text: '#e03131', bar: '#e03131' },
                  { bg: '#fff9db', border: '#ffec99', text: '#e67700', bar: '#e67700' },
                  { bg: '#fff3bf', border: '#ffe066', text: '#c69100', bar: '#c69100' },
                ];
                const c = colors[Math.min(idx, 2)];
                return (
                  <div key={idx} className="p-5 rounded-3xl border-2 space-y-3 transition-all hover:shadow-sm" 
                    style={{ backgroundColor: c.bg, borderColor: c.border }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px]"
                          style={{ backgroundColor: c.text + '20', color: c.text }}>
                          {idx + 1}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: c.text }}>{w.topic}</span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: c.text }}>{w.accuracy}%</span>
                    </div>
                    <div className="h-3 bg-white/60 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${w.accuracy}%`, backgroundColor: c.bar }} />
                    </div>
                    <div className="flex items-start gap-2.5 mt-1 p-3 bg-white/40 rounded-2xl">
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
          <div className="bg-surface border-2 border-border rounded-[40px] p-8 shadow-sm space-y-5 hover:shadow-md transition-shadow duration-300">
            <h4 className="text-sm font-black uppercase tracking-widest text-text-main flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary/10 to-pink-100 rounded-xl flex items-center justify-center">
                <TrendingUp size={16} className="text-primary" />
              </div>
              {level === 'ELEMENTARY' ? 'Your Fun Study Plan' : 'Your Personalized Study Plan'}
            </h4>
            <div className="p-5 bg-gradient-to-br from-primary/[0.03] to-pink-50/30 rounded-3xl border border-primary/10">
              <p className="text-sm font-medium text-text-main leading-relaxed whitespace-pre-line">{result.study_plan}</p>
            </div>
          </div>
        )}

        {/* Strengths */}
        {result.strengths?.length > 0 && (
          <div className="bg-surface border-2 border-border rounded-[40px] p-8 shadow-sm space-y-5 hover:shadow-md transition-shadow duration-300">
            <h4 className="text-sm font-black uppercase tracking-widest text-text-main flex items-center gap-2">
              <div className="w-8 h-8 bg-[#d3f9d8] rounded-xl flex items-center justify-center">
                <CheckCircle2 size={16} className="text-[#2b8a3e]" />
              </div>
              Your Strong Subjects
            </h4>
            <div className="flex flex-wrap gap-2">
              {result.strengths.map((s, idx) => (
                <span key={idx} 
                  className="group relative overflow-hidden px-4 py-2 bg-gradient-to-r from-[#d3f9d8] to-[#b2f2bb] text-[#2b8a3e] border border-[#8ce99a] rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:shadow-md transition-all">
                  <CheckCircle2 size={12} />
                  {s.topic} · {s.accuracy}%
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Full Topic Breakdown */}
        {result.topic_breakdown?.length > 0 && (
          <div className="bg-surface border-2 border-border rounded-[40px] p-8 shadow-sm space-y-5 hover:shadow-md transition-shadow duration-300">
            <h4 className="text-sm font-black uppercase tracking-widest text-text-main">Full Subject Breakdown</h4>
            <div className="space-y-2.5">
              {result.topic_breakdown
                .sort((a, b) => a.accuracy - b.accuracy)
                .map((t, idx) => {
                  const color = t.accuracy >= 80 ? '#2f9e44' : t.accuracy >= 60 ? '#e67700' : '#e03131';
                  return (
                    <div key={idx} className="flex items-center gap-3 p-2 hover:bg-[#f8f9fa] rounded-2xl transition-colors">
                      <span className="text-[9px] font-black uppercase tracking-widest text-text-muted w-44 shrink-0 truncate">{t.topic}</span>
                      <div className="flex-1 h-3 bg-[#f1f3f5] rounded-full overflow-hidden shadow-inner">
                        <div className="h-full rounded-full transition-all duration-700 ease-out" 
                          style={{ width: `${t.accuracy}%`, backgroundColor: color }} />
                      </div>
                      <span className="text-[10px] font-black w-14 text-right" style={{ color }}>{t.accuracy}%</span>
                      <span className="text-[8px] font-bold text-text-muted">({t.correct}/{t.total})</span>
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
            className="group flex-1 flex items-center justify-center gap-2.5 bg-gradient-to-r from-primary to-pink-500 text-white font-black text-xs uppercase tracking-widest py-5 rounded-2xl hover:shadow-xl hover:shadow-primary/20 transition-all"
          >
            <Rocket size={16} className="group-hover:-translate-y-0.5 transition-transform" />
            Find a Tutor <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={reset}
            className="group flex-1 flex items-center justify-center gap-2.5 bg-surface border-2 border-border text-text-muted font-black text-xs uppercase tracking-widest py-5 rounded-2xl hover:border-primary/30 hover:text-primary hover:shadow-md transition-all"
          >
            <Brain size={16} className="group-hover:animate-sparkle" />
            Retake Test
          </button>
        </div>
      </div>
    );
  }

  return null;
}