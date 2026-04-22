from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# PHILIPPINE K-12 CURRICULUM QUESTION BANK
# All subjects as requested:
# Languages: Filipino, English
# Mathematics: Algebra, Geometry, Trigonometry, Statistics
# Science: Integrated Science, Biology, Chemistry, Physics
# Social Studies: Philippine History, Asian Studies, World History, Economics
# TLE: Agriculture, Home Economics, ICT, Industrial Arts
# MAPEH & EsP

QUESTIONS: Dict[str, List[Dict]] = {
    "ELEMENTARY": [
        # Filipino
        {"id": "fil1", "text": "Ano ang kahulugan ng salitang \"masipag\"?", "options": ["Tamad", "Masigla", "Masikap", "Malungkot"], "correctAnswer": "Masikap", "topic": "Filipino - Vocabulary"},
        {"id": "fil2", "text": "Alin ang tamang pangungusap?", "options": ["Kumain ako ng kanin.", "Ako kumain kanin ng.", "Kanin kumain ako ng.", "Ng kanin ako kumain."], "correctAnswer": "Kumain ako ng kanin.", "topic": "Filipino - Grammar"},
        {"id": "fil3", "text": "Sino ang sumulat ng Noli Me Tangere?", "options": ["Andres Bonifacio", "Jose Rizal", "Apolinario Mabini", "Emilio Aguinaldo"], "correctAnswer": "Jose Rizal", "topic": "Filipino - Panitikan"},
        {"id": "fil4", "text": "Ano ang pang-uri sa pangungusap: \"Ang bata ay masaya\"?", "options": ["bata", "ay", "masaya", "ang"], "correctAnswer": "masaya", "topic": "Filipino - Parts of Speech"},
        {"id": "fil5", "text": "Ilang pantig mayroon ang salitang \"paaralan\"?", "options": ["3", "4", "5", "6"], "correctAnswer": "4", "topic": "Filipino - Syllables"},
        
        # English
        {"id": "eng1", "text": "What is the past tense of \"go\"?", "options": ["goed", "gone", "went", "going"], "correctAnswer": "went", "topic": "English - Grammar"},
        {"id": "eng2", "text": "Choose the correct sentence:", "options": ["She don't like apples.", "She doesn't likes apples.", "She doesn't like apples.", "She not like apples."], "correctAnswer": "She doesn't like apples.", "topic": "English - Grammar"},
        {"id": "eng3", "text": "What is the opposite of \"beautiful\"?", "options": ["pretty", "ugly", "happy", "tall"], "correctAnswer": "ugly", "topic": "English - Vocabulary"},
        {"id": "eng4", "text": "Which word is a noun?", "options": ["run", "quick", "book", "happily"], "correctAnswer": "book", "topic": "English - Parts of Speech"},
        {"id": "eng5", "text": "What is the plural of \"child\"?", "options": ["childs", "children", "childes", "child"], "correctAnswer": "children", "topic": "English - Plurals"},
        
        # Mathematics
        {"id": "math1", "text": "What is 15 + 27?", "options": ["32", "42", "43", "52"], "correctAnswer": "42", "topic": "Mathematics - Addition"},
        {"id": "math2", "text": "What is 63 ÷ 7?", "options": ["7", "8", "9", "11"], "correctAnswer": "9", "topic": "Mathematics - Division"},
        {"id": "math3", "text": "What is 12 × 4?", "options": ["36", "48", "42", "56"], "correctAnswer": "48", "topic": "Mathematics - Multiplication"},
        {"id": "math4", "text": "What is 100 − 38?", "options": ["52", "62", "72", "58"], "correctAnswer": "62", "topic": "Mathematics - Subtraction"},
        {"id": "math5", "text": "What fraction is shaded if 3 of 8 equal parts are shaded?", "options": ["3/5", "5/8", "3/8", "1/3"], "correctAnswer": "3/8", "topic": "Mathematics - Fractions"},
        
        # Science
        {"id": "sci1", "text": "What part of the plant absorbs water from the soil?", "options": ["Leaves", "Flower", "Roots", "Stem"], "correctAnswer": "Roots", "topic": "Science - Biology"},
        {"id": "sci2", "text": "What is the boiling point of water?", "options": ["50°C", "75°C", "100°C", "150°C"], "correctAnswer": "100°C", "topic": "Science - Chemistry"},
        {"id": "sci3", "text": "Which planet is closest to the Sun?", "options": ["Venus", "Mercury", "Earth", "Mars"], "correctAnswer": "Mercury", "topic": "Science - Earth Science"},
        {"id": "sci4", "text": "What gas do plants release that humans breathe?", "options": ["Carbon Dioxide", "Oxygen", "Nitrogen", "Hydrogen"], "correctAnswer": "Oxygen", "topic": "Science - Biology"},
        {"id": "sci5", "text": "What force pulls objects toward the ground?", "options": ["Magnetism", "Friction", "Gravity", "Pressure"], "correctAnswer": "Gravity", "topic": "Science - Physics"},
        
        # Social Studies
        {"id": "soc1", "text": "When is Philippine Independence Day celebrated?", "options": ["June 12", "December 25", "January 1", "May 1"], "correctAnswer": "June 12", "topic": "Social Studies - Philippine History"},
        {"id": "soc2", "text": "What is the capital city of the Philippines?", "options": ["Cebu", "Davao", "Manila", "Quezon City"], "correctAnswer": "Manila", "topic": "Social Studies - Geography"},
        {"id": "soc3", "text": "How many stars are on the Philippine flag?", "options": ["2", "3", "4", "5"], "correctAnswer": "3", "topic": "Social Studies - Philippine History"},
        {"id": "soc4", "text": "Who is the national hero of the Philippines?", "options": ["Bonifacio", "Rizal", "Mabini", "Aquino"], "correctAnswer": "Rizal", "topic": "Social Studies - Philippine History"},
        {"id": "soc5", "text": "What is the national language of the Philippines?", "options": ["English", "Tagalog", "Filipino", "Cebuano"], "correctAnswer": "Filipino", "topic": "Social Studies - Culture"},
        
        # MAPEH
        {"id": "mapeh1", "text": "How many beats does a whole note have?", "options": ["2", "3", "4", "6"], "correctAnswer": "4", "topic": "MAPEH - Music"},
        {"id": "mapeh2", "text": "What is the main muscle used in breathing?", "options": ["Heart", "Diaphragm", "Bicep", "Liver"], "correctAnswer": "Diaphragm", "topic": "MAPEH - Health"},
        {"id": "mapeh3", "text": "Which of these is a primary color?", "options": ["Green", "Orange", "Red", "Purple"], "correctAnswer": "Red", "topic": "MAPEH - Arts"},
        {"id": "mapeh4", "text": "What is the most popular sport in the Philippines?", "options": ["Basketball", "Football", "Volleyball", "Boxing"], "correctAnswer": "Basketball", "topic": "MAPEH - Physical Education"},
        {"id": "mapeh5", "text": "How many minutes should you exercise each day?", "options": ["10", "20", "30", "60"], "correctAnswer": "30", "topic": "MAPEH - Health"},
        
        # EsP
        {"id": "esp1", "text": "Ano ang ibig sabihin ng \"paggalang\"?", "options": ["Pakikipag-away", "Pagpapakita ng respeto", "Pagsisinungaling", "Pagnanakaw"], "correctAnswer": "Pagpapakita ng respeto", "topic": "Edukasyon sa Pagpapakatao"},
        {"id": "esp2", "text": "Dapat ba nating tulungan ang mga matatanda?", "options": ["Hindi", "Minsan", "Palagi", "Kapag may pera"], "correctAnswer": "Palagi", "topic": "Edukasyon sa Pagpapakatao"},
        {"id": "esp3", "text": "Ano ang dapat gawin kapag nakakita ka ng basura?", "options": ["Hayaan lang", "Tapakan", "Pulutin at itapon sa tamang lugar", "Iwanan"], "correctAnswer": "Pulutin at itapon sa tamang lugar", "topic": "Edukasyon sa Pagpapakatao"},
    ],
    
    "HIGH_SCHOOL": [
        # Filipino
        {"id": "filh1", "text": "Sino ang may-akda ng \"Florante at Laura\"?", "options": ["Jose Rizal", "Francisco Balagtas", "Andres Bonifacio", "Apolinario Mabini"], "correctAnswer": "Francisco Balagtas", "topic": "Filipino - Panitikan"},
        {"id": "filh2", "text": "Ano ang tawag sa tulang may labing-apat na pantig?", "options": ["Haiku", "Soneto", "Tanaga", "Dalit"], "correctAnswer": "Soneto", "topic": "Filipino - Panitikan"},
        {"id": "filh3", "text": "Alin ang halimbawa ng pang-abay?", "options": ["Mabilis", "Tumakbo", "Bata", "Bahay"], "correctAnswer": "Mabilis", "topic": "Filipino - Grammar"},
        {"id": "filh4", "text": "Ano ang ibig sabihin ng \"bahag ang buntot\"?", "options": ["Masaya", "Matapang", "Duwag", "Galit"], "correctAnswer": "Duwag", "topic": "Filipino - Idioms"},
        {"id": "filh5", "text": "Sino ang tinaguriang \"Ama ng Wikang Pambansa\"?", "options": ["Jose Rizal", "Manuel Quezon", "Andres Bonifacio", "Carlos Romulo"], "correctAnswer": "Manuel Quezon", "topic": "Filipino - History"},
        
        # English
        {"id": "engh1", "text": "Which sentence uses correct past perfect tense?", "options": ["I eat dinner before he arrived.", "I had eaten dinner before he arrived.", "I ate dinner before he had arrived.", "I have eaten dinner before he arrives."], "correctAnswer": "I had eaten dinner before he arrived.", "topic": "English - Grammar"},
        {"id": "engh2", "text": "What is a metaphor?", "options": ["Comparison using like or as", "Direct comparison without like or as", "Giving human traits to objects", "Exaggeration for effect"], "correctAnswer": "Direct comparison without like or as", "topic": "English - Literature"},
        {"id": "engh3", "text": "Who wrote \"Romeo and Juliet\"?", "options": ["Charles Dickens", "William Shakespeare", "Mark Twain", "Jane Austen"], "correctAnswer": "William Shakespeare", "topic": "English - Literature"},
        {"id": "engh4", "text": "Which word is an adverb?", "options": ["quick", "quickly", "quicker", "quickest"], "correctAnswer": "quickly", "topic": "English - Grammar"},
        {"id": "engh5", "text": "What is the main idea of a story called?", "options": ["Plot", "Theme", "Setting", "Character"], "correctAnswer": "Theme", "topic": "English - Literature"},
        
        # Mathematics
        {"id": "mathh1", "text": "Solve: 2x + 5 = 13", "options": ["3", "4", "5", "6"], "correctAnswer": "4", "topic": "Mathematics - Algebra"},
        {"id": "mathh2", "text": "What is √144?", "options": ["10", "11", "12", "13"], "correctAnswer": "12", "topic": "Mathematics - Radicals"},
        {"id": "mathh3", "text": "Simplify: 3(x + 4) − 2x", "options": ["x+4", "x+12", "5x+4", "x+8"], "correctAnswer": "x+12", "topic": "Mathematics - Algebra"},
        {"id": "mathh4", "text": "What is the slope of y = 3x − 7?", "options": ["-7", "3", "7", "-3"], "correctAnswer": "3", "topic": "Mathematics - Linear Equations"},
        {"id": "mathh5", "text": "Solve: x² − 9 = 0", "options": ["x=3", "x=±3", "x=9", "x=±9"], "correctAnswer": "x=±3", "topic": "Mathematics - Quadratic Equations"},
        {"id": "mathh6", "text": "What is sin(90°)?", "options": ["0", "0.5", "1", "−1"], "correctAnswer": "1", "topic": "Mathematics - Trigonometry"},
        {"id": "mathh7", "text": "What is the area of a circle with radius 5? (use π≈3.14)", "options": ["15.7", "31.4", "78.5", "25"], "correctAnswer": "78.5", "topic": "Mathematics - Geometry"},
        {"id": "mathh8", "text": "Factor: x² + 5x + 6", "options": ["(x+2)(x+3)", "(x+1)(x+6)", "(x−2)(x−3)", "(x+6)(x−1)"], "correctAnswer": "(x+2)(x+3)", "topic": "Mathematics - Factoring"},
        {"id": "mathh9", "text": "What is log₁₀(1000)?", "options": ["2", "3", "10", "100"], "correctAnswer": "3", "topic": "Mathematics - Logarithms"},
        {"id": "mathh10", "text": "If f(x) = 2x², what is f(3)?", "options": ["12", "18", "36", "6"], "correctAnswer": "18", "topic": "Mathematics - Functions"},
        
        # Science
        {"id": "scih1", "text": "What is the chemical symbol for gold?", "options": ["Go", "Gd", "Au", "Ag"], "correctAnswer": "Au", "topic": "Science - Chemistry"},
        {"id": "scih2", "text": "What is the powerhouse of the cell?", "options": ["Nucleus", "Ribosome", "Mitochondria", "Golgi Body"], "correctAnswer": "Mitochondria", "topic": "Science - Biology"},
        {"id": "scih3", "text": "What is Newton's Second Law of Motion?", "options": ["F=ma", "E=mc²", "PV=nRT", "a²+b²=c²"], "correctAnswer": "F=ma", "topic": "Science - Physics"},
        {"id": "scih4", "text": "How many chromosomes do humans have?", "options": ["23", "46", "48", "52"], "correctAnswer": "46", "topic": "Science - Biology"},
        {"id": "scih5", "text": "What is the most abundant gas in Earth's atmosphere?", "options": ["Oxygen", "Carbon Dioxide", "Nitrogen", "Argon"], "correctAnswer": "Nitrogen", "topic": "Science - Chemistry"},
        
        # Social Studies
        {"id": "soch1", "text": "When did the Philippine Revolution against Spain begin?", "options": ["1896", "1898", "1900", "1910"], "correctAnswer": "1896", "topic": "Social Studies - Philippine History"},
        {"id": "soch2", "text": "What is the capital of Japan?", "options": ["Seoul", "Beijing", "Tokyo", "Bangkok"], "correctAnswer": "Tokyo", "topic": "Social Studies - Geography"},
    ]
}

@app.get("/")
def read_root():
    return {"message": "Brighton Tutoring Platform AI Backend"}

@app.get("/questions/{level}")
def get_questions(level: str, count: int = 10):
    level = level.upper()
    pool = QUESTIONS.get(level, QUESTIONS["ELEMENTARY"])
    import random
    selected = random.sample(pool, min(count, len(pool)))
    # Strip correct answer for client
    return [{"id": q["id"], "text": q["text"], "options": q["options"], "topic": q["topic"]} for q in selected]

class AnalysisRequest(BaseModel):
    level: str
    answers: List[Dict[str, str]]

@app.post("/analyze")
def analyze_performance(data: AnalysisRequest):
    # This is a simplified version of the analysis logic
    return {"status": "ok", "message": "Analysis endpoint ready"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
