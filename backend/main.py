from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Questions
# Each question has: id, text, options, correctAnswer, topic
QUESTIONS: Dict[str, List[Dict]] = {
    "ELEMENTARY": [
        {"id": "e1", "text": "What is 15 + 27?",              "options": ["32","42","43","52"],          "correctAnswer": "42",    "topic": "Addition"},
        {"id": "e2", "text": "What is 63 ÷ 7?",               "options": ["7","8","9","11"],             "correctAnswer": "9",     "topic": "Division"},
        {"id": "e3", "text": "What is 12 × 4?",               "options": ["36","48","42","56"],          "correctAnswer": "48",    "topic": "Multiplication"},
        {"id": "e4", "text": "What is 100 − 38?",             "options": ["52","62","72","58"],          "correctAnswer": "62",    "topic": "Subtraction"},
        {"id": "e5", "text": "What fraction is shaded if 3 of 8 equal parts are shaded?", "options": ["3/5","5/8","3/8","1/3"], "correctAnswer": "3/8", "topic": "Fractions"},
        {"id": "e6", "text": "How many sides does a pentagon have?", "options": ["4","5","6","7"],       "correctAnswer": "5",     "topic": "Geometry"},
        {"id": "e7", "text": "What is 5²?",                   "options": ["10","15","25","20"],          "correctAnswer": "25",    "topic": "Exponents"},
        {"id": "e8", "text": "What is the perimeter of a square with side 6?", "options": ["12","18","24","36"], "correctAnswer": "24", "topic": "Geometry"},
        {"id": "e9", "text": "Round 347 to the nearest ten.", "options": ["300","340","350","400"],      "correctAnswer": "350",   "topic": "Rounding"},
        {"id": "e10","text": "What is 20% of 50?",            "options": ["5","10","15","20"],           "correctAnswer": "10",    "topic": "Percentages"},
    ],
    "HIGH_SCHOOL": [
        {"id": "h1", "text": "Solve: 2x + 5 = 13",            "options": ["3","4","5","6"],              "correctAnswer": "4",     "topic": "Algebra"},
        {"id": "h2", "text": "What is √144?",                 "options": ["10","11","12","13"],          "correctAnswer": "12",    "topic": "Radicals"},
        {"id": "h3", "text": "Simplify: 3(x + 4) − 2x",      "options": ["x+4","x+12","5x+4","x+8"],   "correctAnswer": "x+12",  "topic": "Algebra"},
        {"id": "h4", "text": "What is the slope of y = 3x − 7?", "options": ["-7","3","7","-3"],        "correctAnswer": "3",     "topic": "Linear Equations"},
        {"id": "h5", "text": "Solve: x² − 9 = 0",            "options": ["x=3","x=±3","x=9","x=±9"],   "correctAnswer": "x=±3",  "topic": "Quadratic Equations"},
        {"id": "h6", "text": "What is sin(90°)?",             "options": ["0","0.5","1","−1"],           "correctAnswer": "1",     "topic": "Trigonometry"},
        {"id": "h7", "text": "What is the area of a circle with radius 5? (use π≈3.14)", "options": ["15.7","31.4","78.5","25"], "correctAnswer": "78.5", "topic": "Geometry"},
        {"id": "h8", "text": "Factor: x² + 5x + 6",          "options": ["(x+2)(x+3)","(x+1)(x+6)","(x−2)(x−3)","(x+6)(x−1)"], "correctAnswer": "(x+2)(x+3)", "topic": "Factoring"},
        {"id": "h9", "text": "What is log₁₀(1000)?",         "options": ["2","3","10","100"],           "correctAnswer": "3",     "topic": "Logarithms"},
        {"id": "h10","text": "If f(x) = 2x², what is f(3)?", "options": ["12","18","36","6"],           "correctAnswer": "18",    "topic": "Functions"},
    ]
}


class AnswerItem(BaseModel):
    questionId: str
    answer: str

class TestSubmission(BaseModel):
    level: str  # "ELEMENTARY" or "HIGH_SCHOOL"
    answers: List[AnswerItem]
    studentId: Optional[str] = None

@app.get("/")
async def root():
    return {"message": "Brighton AI Backend"}

@app.get("/questions/{level}")
async def get_questions(level: str):
    """Return questions for a given level (without correct answers)."""
    level = level.upper()
    if level not in QUESTIONS:
        return {"error": "Invalid level"}, 400
    safe = [
        {"id": q["id"], "text": q["text"], "options": q["options"]}
        for q in QUESTIONS[level]
    ]
    return {"level": level, "questions": safe}

@app.post("/analyze")
async def analyze_test(submission: TestSubmission):
    level = submission.level.upper()
    bank = QUESTIONS.get(level, [])

    if not bank:
        return {"error": "Invalid level"}, 400

    # Build lookup: questionId → correct answer & topic
    lookup = {q["id"]: q for q in bank}

    total_score = 0
    topic_stats = {}

    # Initialize topic tracking
    for q in bank:
        topic = q["topic"]
        if topic not in topic_stats:
            topic_stats[topic] = {
                "correct": 0,
                "total": 0,
                "questions": 0
            }
        topic_stats[topic]["questions"] += 1

    # Process answers
    for item in submission.answers:
        q = lookup.get(item.questionId)
        if not q:
            continue
        
        topic = q["topic"]
        topic_stats[topic]["total"] += 1
        
        if item.answer.strip() == q["correctAnswer"].strip():
            total_score += 1
            topic_stats[topic]["correct"] += 1

    total = len(bank)
    overall_percentage = round((total_score / total) * 100) if total else 0

    # Calculate detailed topic analysis
    detailed_topics = []
    weaknesses = []
    strengths = []

    for topic, stats in topic_stats.items():
        if stats["total"] == 0:
            continue
            
        accuracy = round((stats["correct"] / stats["total"]) * 100)
        
        # Determine proficiency level
        if accuracy < 40:
            proficiency = "Severe Weakness"
            weaknesses.append({"topic": topic, "accuracy": accuracy, "proficiency": proficiency, "priority": 1})
        elif accuracy < 60:
            proficiency = "Moderate Weakness"
            weaknesses.append({"topic": topic, "accuracy": accuracy, "proficiency": proficiency, "priority": 2})
        elif accuracy < 80:
            proficiency = "Mild Weakness"
            weaknesses.append({"topic": topic, "accuracy": accuracy, "proficiency": proficiency, "priority": 3})
        else:
            proficiency = "Strong"
            strengths.append({"topic": topic, "accuracy": accuracy, "proficiency": proficiency})

        detailed_topics.append({
            "topic": topic,
            "correct": stats["correct"],
            "attempted": stats["total"],
            "accuracy": accuracy,
            "proficiency": proficiency
        })

    # Sort weaknesses by priority (most severe first)
    weaknesses.sort(key=lambda x: (x["priority"], x["accuracy"]))

    # Generate personalized recommendation
    recommendation_parts = []
    
    if overall_percentage >= 90:
        recommendation_parts.append("Excellent performance! You have demonstrated exceptional understanding.")
    elif overall_percentage >= 75:
        recommendation_parts.append("Good work! You have a solid foundation with room for improvement.")
    elif overall_percentage >= 60:
        recommendation_parts.append("Fair effort. You understand the basics but need more practice.")
    else:
        recommendation_parts.append("Additional study is recommended to build your fundamentals.")

    if weaknesses:
        top_weaknesses = [w["topic"] for w in weaknesses[:3]]
        if len(top_weaknesses) == 1:
            recommendation_parts.append(f"Focus your attention on {top_weaknesses[0]} which is your weakest area.")
        elif len(top_weaknesses) == 2:
            recommendation_parts.append(f"Prioritize studying {top_weaknesses[0]} and {top_weaknesses[1]}.")
        else:
            recommendation_parts.append(f"The highest priority topics to review are {', '.join(top_weaknesses)}.")
        
        # Add specific advice based on severity
        severe = [w["topic"] for w in weaknesses if w["priority"] == 1]
        if severe:
            recommendation_parts.append(f"⚠️ Critical: {', '.join(severe)} require immediate attention. Consider working with a tutor.")

    if strengths:
        strong_topics = [s["topic"] for s in strengths]
        recommendation_parts.append(f"✅ Strengths: You excel at {', '.join(strong_topics)}. Great job!")

    # Success metrics
    mastery_level = "Beginner"
    if overall_percentage >= 90:
        mastery_level = "Advanced"
    elif overall_percentage >= 75:
        mastery_level = "Proficient"
    elif overall_percentage >= 60:
        mastery_level = "Developing"

    return {
        "score": total_score,
        "total": total,
        "percentage": overall_percentage,
        "mastery_level": mastery_level,
        "weaknesses": weaknesses,
        "strengths": strengths,
        "detailed_analysis": detailed_topics,
        "recommendation": " ".join(recommendation_parts),
        "improvement_suggestions": [
            f"Practice more problems in {w['topic']}" for w in weaknesses[:3]
        ] + [
            "Review textbook chapters on weak topics",
            "Create flashcards for key concepts",
            "Take additional practice tests weekly"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
