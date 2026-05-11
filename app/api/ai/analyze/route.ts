import { NextRequest, NextResponse } from 'next/server';

// ─────────────────────────────────────────────────────────────────────────────
// Full question bank — kept here so the analyzer can look up correctAnswers
// ─────────────────────────────────────────────────────────────────────────────
const ALL_QUESTIONS: Record<string, { id: string; text: string; options: string[]; correctAnswer: string; topic: string }[]> = {
  ELEMENTARY: [
    { id: 'fil_e01', text: 'Ano ang kahulugan ng salitang "masipag"?', options: ['Tamad','Masigla','Masikap','Malungkot'], correctAnswer: 'Masikap', topic: 'Filipino - Vocabulary' },
    { id: 'fil_e02', text: 'Alin ang tamang pangungusap?', options: ['Kumain ako ng kanin.','Ako kumain kanin ng.','Kanin kumain ako ng.','Ng kanin ako kumain.'], correctAnswer: 'Kumain ako ng kanin.', topic: 'Filipino - Grammar' },
    { id: 'fil_e03', text: 'Sino ang sumulat ng Noli Me Tangere?', options: ['Andres Bonifacio','Jose Rizal','Apolinario Mabini','Emilio Aguinaldo'], correctAnswer: 'Jose Rizal', topic: 'Filipino - Panitikan' },
    { id: 'fil_e04', text: 'Ano ang pang-uri sa pangungusap: "Ang bata ay masaya"?', options: ['bata','ay','masaya','ang'], correctAnswer: 'masaya', topic: 'Filipino - Parts of Speech' },
    { id: 'fil_e05', text: 'Ilang pantig mayroon ang salitang "paaralan"?', options: ['3','4','5','6'], correctAnswer: '4', topic: 'Filipino - Syllables' },
    { id: 'fil_e06', text: 'Ano ang pangngalan sa pangungusap: "Lumangoy ang isda sa ilog"?', options: ['lumangoy','isda','sa','ang'], correctAnswer: 'isda', topic: 'Filipino - Parts of Speech' },
    { id: 'fil_e07', text: 'Ano ang kahulugan ng "magalang"?', options: ['Bastos','May respeto','Palalo','Tamad'], correctAnswer: 'May respeto', topic: 'Filipino - Vocabulary' },
    { id: 'fil_e08', text: 'Alin ang halimbawa ng panghalip?', options: ['Maganda','Tumakbo','Siya','Bahay'], correctAnswer: 'Siya', topic: 'Filipino - Parts of Speech' },
    { id: 'fil_e09', text: 'Ano ang kabaligtaran ng "mataas"?', options: ['Malapit','Mababa','Malayo','Mabilis'], correctAnswer: 'Mababa', topic: 'Filipino - Vocabulary' },
    { id: 'fil_e10', text: 'Ang "Lupang Hinirang" ay ang ______ ng Pilipinas.', options: ['Pambansang Wika','Pambansang Awit','Pambansang Sagisag','Pambansang Bulaklak'], correctAnswer: 'Pambansang Awit', topic: 'Filipino - Culture' },
    { id: 'fil_e11', text: 'Alin ang pangungusap na may tamang bantas?', options: ['Kumain ka na ba.','Kumain ka na ba!','Kumain ka na ba?','Kumain ka na ba,'], correctAnswer: 'Kumain ka na ba?', topic: 'Filipino - Punctuation' },
    { id: 'fil_e12', text: 'Ano ang salitang-ugat ng "maganda"?', options: ['mag','ganda','maganda','anda'], correctAnswer: 'ganda', topic: 'Filipino - Word Structure' },
    { id: 'eng_e01', text: 'What is the past tense of "go"?', options: ['goed','gone','went','going'], correctAnswer: 'went', topic: 'English - Grammar' },
    { id: 'eng_e02', text: 'Choose the correct sentence:', options: ["She don't like apples.","She doesn't likes apples.","She doesn't like apples.","She not like apples."], correctAnswer: "She doesn't like apples.", topic: 'English - Grammar' },
    { id: 'eng_e03', text: 'What is the opposite of "beautiful"?', options: ['pretty','ugly','happy','tall'], correctAnswer: 'ugly', topic: 'English - Vocabulary' },
    { id: 'eng_e04', text: 'Which word is a noun?', options: ['run','quick','book','happily'], correctAnswer: 'book', topic: 'English - Parts of Speech' },
    { id: 'eng_e05', text: 'What is the plural of "child"?', options: ['childs','children','childes','child'], correctAnswer: 'children', topic: 'English - Plurals' },
    { id: 'eng_e06', text: 'Which sentence is correct?', options: ['I am going to store.','I am going to the store.','I going to the store.','I go to store.'], correctAnswer: 'I am going to the store.', topic: 'English - Grammar' },
    { id: 'eng_e07', text: 'What is a synonym for "happy"?', options: ['Sad','Angry','Joyful','Tired'], correctAnswer: 'Joyful', topic: 'English - Vocabulary' },
    { id: 'eng_e08', text: 'Which word is an adjective?', options: ['run','beautiful','quickly','they'], correctAnswer: 'beautiful', topic: 'English - Parts of Speech' },
    { id: 'eng_e09', text: 'What punctuation ends a question?', options: ['.','!','?',','], correctAnswer: '?', topic: 'English - Punctuation' },
    { id: 'eng_e10', text: 'The cat ___ on the mat.', options: ['sit','sits','sitting','sat down'], correctAnswer: 'sits', topic: 'English - Grammar' },
    { id: 'eng_e11', text: 'What is the plural of "tooth"?', options: ['tooths','teeths','teeth','tooth'], correctAnswer: 'teeth', topic: 'English - Plurals' },
    { id: 'eng_e12', text: 'Which word rhymes with "cat"?', options: ['dog','hat','cup','bed'], correctAnswer: 'hat', topic: 'English - Phonics' },
    { id: 'math_e01', text: 'What is 15 + 27?', options: ['32','42','43','52'], correctAnswer: '42', topic: 'Mathematics - Addition' },
    { id: 'math_e02', text: 'What is 63 ÷ 7?', options: ['7','8','9','11'], correctAnswer: '9', topic: 'Mathematics - Division' },
    { id: 'math_e03', text: 'What is 12 × 4?', options: ['36','48','42','56'], correctAnswer: '48', topic: 'Mathematics - Multiplication' },
    { id: 'math_e04', text: 'What is 100 − 38?', options: ['52','62','72','58'], correctAnswer: '62', topic: 'Mathematics - Subtraction' },
    { id: 'math_e05', text: 'What fraction is shaded if 3 of 8 equal parts are shaded?', options: ['3/5','5/8','3/8','1/3'], correctAnswer: '3/8', topic: 'Mathematics - Fractions' },
    { id: 'math_e06', text: 'How many sides does a hexagon have?', options: ['5','6','7','8'], correctAnswer: '6', topic: 'Mathematics - Geometry' },
    { id: 'math_e07', text: 'What is 7²?', options: ['14','42','49','56'], correctAnswer: '49', topic: 'Mathematics - Exponents' },
    { id: 'math_e08', text: 'What is 50% of 80?', options: ['20','30','40','50'], correctAnswer: '40', topic: 'Mathematics - Percentages' },
    { id: 'math_e09', text: 'Which is the largest: 2/3, 1/2, 3/4, 1/4?', options: ['2/3','1/2','3/4','1/4'], correctAnswer: '3/4', topic: 'Mathematics - Fractions' },
    { id: 'math_e10', text: 'What is the perimeter of a square with side 5cm?', options: ['10 cm','15 cm','20 cm','25 cm'], correctAnswer: '20 cm', topic: 'Mathematics - Geometry' },
    { id: 'math_e11', text: 'Round 473 to the nearest hundred.', options: ['400','470','500','480'], correctAnswer: '500', topic: 'Mathematics - Rounding' },
    { id: 'math_e12', text: 'What comes next: 2, 4, 8, 16, ___?', options: ['24','28','32','20'], correctAnswer: '32', topic: 'Mathematics - Patterns' },
    { id: 'math_e13', text: 'What is the area of a rectangle 6m × 4m?', options: ['10 m²','20 m²','24 m²','28 m²'], correctAnswer: '24 m²', topic: 'Mathematics - Geometry' },
    { id: 'math_e14', text: 'How many minutes are in 2 hours?', options: ['60','100','120','150'], correctAnswer: '120', topic: 'Mathematics - Time' },
    { id: 'sci_e01', text: 'What part of the plant absorbs water from the soil?', options: ['Leaves','Flower','Roots','Stem'], correctAnswer: 'Roots', topic: 'Science - Biology' },
    { id: 'sci_e02', text: 'What is the boiling point of water?', options: ['50°C','75°C','100°C','150°C'], correctAnswer: '100°C', topic: 'Science - Chemistry' },
    { id: 'sci_e03', text: 'Which planet is closest to the Sun?', options: ['Venus','Mercury','Earth','Mars'], correctAnswer: 'Mercury', topic: 'Science - Earth Science' },
    { id: 'sci_e04', text: 'What gas do plants release during photosynthesis?', options: ['Carbon Dioxide','Oxygen','Nitrogen','Hydrogen'], correctAnswer: 'Oxygen', topic: 'Science - Biology' },
    { id: 'sci_e05', text: 'What force pulls objects toward the ground?', options: ['Magnetism','Friction','Gravity','Pressure'], correctAnswer: 'Gravity', topic: 'Science - Physics' },
    { id: 'sci_e06', text: 'What is the largest planet in our solar system?', options: ['Earth','Saturn','Jupiter','Neptune'], correctAnswer: 'Jupiter', topic: 'Science - Earth Science' },
    { id: 'sci_e07', text: 'What do tadpoles grow into?', options: ['Fish','Frogs','Lizards','Snakes'], correctAnswer: 'Frogs', topic: 'Science - Biology' },
    { id: 'sci_e08', text: 'Which is NOT a state of matter?', options: ['Solid','Liquid','Gas','Energy'], correctAnswer: 'Energy', topic: 'Science - Chemistry' },
    { id: 'sci_e09', text: 'What organ pumps blood through the body?', options: ['Lungs','Liver','Kidney','Heart'], correctAnswer: 'Heart', topic: 'Science - Biology' },
    { id: 'sci_e10', text: 'What gives plants their green color?', options: ['Water','Chlorophyll','Sunlight','Soil'], correctAnswer: 'Chlorophyll', topic: 'Science - Biology' },
    { id: 'sci_e11', text: 'The sun rises in the ___?', options: ['North','South','East','West'], correctAnswer: 'East', topic: 'Science - Earth Science' },
    { id: 'sci_e12', text: 'Which animal is a mammal?', options: ['Shark','Eagle','Dolphin','Frog'], correctAnswer: 'Dolphin', topic: 'Science - Biology' },
    { id: 'soc_e01', text: 'When is Philippine Independence Day?', options: ['June 12','December 25','January 1','May 1'], correctAnswer: 'June 12', topic: 'Social Studies - Philippine History' },
    { id: 'soc_e02', text: 'What is the capital city of the Philippines?', options: ['Cebu','Davao','Manila','Quezon City'], correctAnswer: 'Manila', topic: 'Social Studies - Geography' },
    { id: 'soc_e03', text: 'How many stars are on the Philippine flag?', options: ['2','3','4','5'], correctAnswer: '3', topic: 'Social Studies - Philippine History' },
    { id: 'soc_e04', text: 'Who is the national hero of the Philippines?', options: ['Bonifacio','Rizal','Mabini','Aguinaldo'], correctAnswer: 'Rizal', topic: 'Social Studies - Philippine History' },
    { id: 'soc_e05', text: 'What is the national language of the Philippines?', options: ['English','Tagalog','Filipino','Cebuano'], correctAnswer: 'Filipino', topic: 'Social Studies - Culture' },
    { id: 'soc_e06', text: 'What is the national flower of the Philippines?', options: ['Rose','Sampaguita','Sunflower','Orchid'], correctAnswer: 'Sampaguita', topic: 'Social Studies - Culture' },
    { id: 'soc_e07', text: 'The Philippines is located in which continent?', options: ['Africa','Europe','Asia','America'], correctAnswer: 'Asia', topic: 'Social Studies - Geography' },
    { id: 'soc_e08', text: 'How many islands does the Philippines have?', options: ['More than 7,000','About 500','Exactly 100','About 1,000'], correctAnswer: 'More than 7,000', topic: 'Social Studies - Geography' },
    { id: 'soc_e09', text: 'Who wrote the Philippine national anthem "Lupang Hinirang"?', options: ['Jose Rizal','Julian Felipe','Andres Bonifacio','Apolinario Mabini'], correctAnswer: 'Julian Felipe', topic: 'Social Studies - Philippine History' },
    { id: 'soc_e10', text: 'What ocean surrounds the Philippines to the east?', options: ['Indian Ocean','Atlantic Ocean','Pacific Ocean','Arctic Ocean'], correctAnswer: 'Pacific Ocean', topic: 'Social Studies - Geography' },
    { id: 'mapeh_e01', text: 'How many beats does a whole note have?', options: ['2','3','4','6'], correctAnswer: '4', topic: 'MAPEH - Music' },
    { id: 'mapeh_e02', text: 'What is the main muscle used in breathing?', options: ['Heart','Diaphragm','Bicep','Liver'], correctAnswer: 'Diaphragm', topic: 'MAPEH - Health' },
    { id: 'mapeh_e03', text: 'Which of these is a primary color?', options: ['Green','Orange','Red','Purple'], correctAnswer: 'Red', topic: 'MAPEH - Arts' },
    { id: 'mapeh_e04', text: 'What is the most popular sport in the Philippines?', options: ['Basketball','Football','Volleyball','Boxing'], correctAnswer: 'Basketball', topic: 'MAPEH - Physical Education' },
    { id: 'mapeh_e05', text: 'How many minutes should children exercise each day?', options: ['10','20','30','60'], correctAnswer: '60', topic: 'MAPEH - Health' },
    { id: 'mapeh_e06', text: 'What are the three primary colors?', options: ['Red, Green, Blue','Red, Yellow, Blue','Red, Orange, Yellow','Blue, Green, Purple'], correctAnswer: 'Red, Yellow, Blue', topic: 'MAPEH - Arts' },
    { id: 'mapeh_e07', text: 'What is the national sport of the Philippines?', options: ['Basketball','Arnis','Boxing','Swimming'], correctAnswer: 'Arnis', topic: 'MAPEH - Physical Education' },
    { id: 'mapeh_e08', text: 'Which musical instrument has keys, strings, and pedals?', options: ['Guitar','Violin','Piano','Drums'], correctAnswer: 'Piano', topic: 'MAPEH - Music' },
    { id: 'mapeh_e09', text: 'What vitamin does sunlight provide?', options: ['Vitamin A','Vitamin B','Vitamin C','Vitamin D'], correctAnswer: 'Vitamin D', topic: 'MAPEH - Health' },
    { id: 'mapeh_e10', text: 'The mixing of red and blue makes what color?', options: ['Green','Orange','Purple','Brown'], correctAnswer: 'Purple', topic: 'MAPEH - Arts' },
    { id: 'esp_e01', text: 'Ano ang ibig sabihin ng "paggalang"?', options: ['Pakikipag-away','Pagpapakita ng respeto','Pagsisinungaling','Pagnanakaw'], correctAnswer: 'Pagpapakita ng respeto', topic: 'EsP - Values' },
    { id: 'esp_e02', text: 'Dapat ba nating tulungan ang mga matatanda?', options: ['Hindi','Minsan','Palagi','Kapag may pera'], correctAnswer: 'Palagi', topic: 'EsP - Values' },
    { id: 'esp_e03', text: 'Ano ang dapat gawin kapag nakakita ka ng basura sa daan?', options: ['Hayaan lang','Tapakan','Pulutin at itapon sa tamang lugar','Iwanan'], correctAnswer: 'Pulutin at itapon sa tamang lugar', topic: 'EsP - Character' },
    { id: 'esp_e04', text: 'Ano ang tamang gawin kapag nahiram mo ang bagay ng iyong kaibigan?', options: ['Ibalik pagkatapos gamitin','Itago na','Ibigay sa iba','Hindi na ibalik'], correctAnswer: 'Ibalik pagkatapos gamitin', topic: 'EsP - Values' },
    { id: 'esp_e05', text: 'Ang pakikinig nang mabuti sa guro ay isang halimbawa ng?', options: ['Katamaran','Paggalang','Pagmamalaki','Kapabayaan'], correctAnswer: 'Paggalang', topic: 'EsP - Character' },
    { id: 'esp_e06', text: 'Ano ang tamang gawin kapag nagkamali ka?', options: ['Magtago','Sisihin ang iba','Humingi ng tawad at ayusin','Magalit'], correctAnswer: 'Humingi ng tawad at ayusin', topic: 'EsP - Values' },
    { id: 'esp_e07', text: 'Ano ang kahulugan ng "katapatan"?', options: ['Pagiging tamad','Pagiging tapat','Pagiging maingay','Pagiging matalino'], correctAnswer: 'Pagiging tapat', topic: 'EsP - Character' },
  ],
  HIGH_SCHOOL: [
    { id: 'fil_h01', text: 'Sino ang may-akda ng "Florante at Laura"?', options: ['Jose Rizal','Francisco Balagtas','Andres Bonifacio','Apolinario Mabini'], correctAnswer: 'Francisco Balagtas', topic: 'Filipino - Panitikan' },
    { id: 'fil_h02', text: 'Ano ang tawag sa tulang may labing-apat na pantig?', options: ['Haiku','Soneto','Tanaga','Dalit'], correctAnswer: 'Soneto', topic: 'Filipino - Panitikan' },
    { id: 'fil_h03', text: 'Alin ang halimbawa ng pang-abay na panlunan?', options: ['Mabilis','Bukas','Dito','Mahal'], correctAnswer: 'Dito', topic: 'Filipino - Grammar' },
    { id: 'fil_h04', text: 'Ano ang ibig sabihin ng "bahag ang buntot"?', options: ['Masaya','Matapang','Duwag','Galit'], correctAnswer: 'Duwag', topic: 'Filipino - Idyoma' },
    { id: 'fil_h05', text: 'Sino ang tinaguriang "Ama ng Wikang Pambansa"?', options: ['Jose Rizal','Manuel Quezon','Andres Bonifacio','Carlos Romulo'], correctAnswer: 'Manuel Quezon', topic: 'Filipino - History' },
    { id: 'fil_h06', text: 'Ang El Filibusterismo ay ikalawang nobela ni Jose Rizal. Ano ang pangunahing paksa nito?', options: ['Pag-ibig','Rebolusyon at paghihiganti','Kalikasan','Pamilya'], correctAnswer: 'Rebolusyon at paghihiganti', topic: 'Filipino - Panitikan' },
    { id: 'fil_h07', text: 'Ano ang tamang gamit ng "ng" at "nang"? "Kumain ___ kanin si Ana."', options: ['nang','ng','na','ni'], correctAnswer: 'ng', topic: 'Filipino - Grammar' },
    { id: 'fil_h08', text: 'Ang "Ibong Adarna" ay isang uri ng?', options: ['Nobela','Korido','Maikling Kuwento','Tula'], correctAnswer: 'Korido', topic: 'Filipino - Panitikan' },
    { id: 'fil_h09', text: 'Ano ang tawag sa pagpapalitan ng kahulugan ng mga salita sa paglipas ng panahon?', options: ['Semantikong Pagbabago','Ponolohiya','Morpolohiya','Sintaksis'], correctAnswer: 'Semantikong Pagbabago', topic: 'Filipino - Linggwistika' },
    { id: 'fil_h10', text: 'Ang Katipunan ay itinatag ni?', options: ['Jose Rizal','Manuel Quezon','Andres Bonifacio','Emilio Aguinaldo'], correctAnswer: 'Andres Bonifacio', topic: 'Filipino - History' },
    { id: 'eng_h01', text: 'Which sentence uses correct past perfect tense?', options: ['I eat dinner before he arrived.','I had eaten dinner before he arrived.','I ate dinner before he had arrived.','I have eaten dinner before he arrives.'], correctAnswer: 'I had eaten dinner before he arrived.', topic: 'English - Grammar' },
    { id: 'eng_h02', text: 'What is a metaphor?', options: ['Comparison using like or as','Direct comparison without like or as','Giving human traits to objects','Exaggeration for effect'], correctAnswer: 'Direct comparison without like or as', topic: 'English - Literature' },
    { id: 'eng_h03', text: 'Who wrote "Romeo and Juliet"?', options: ['Charles Dickens','William Shakespeare','Mark Twain','Jane Austen'], correctAnswer: 'William Shakespeare', topic: 'English - Literature' },
    { id: 'eng_h04', text: 'Which word is an adverb?', options: ['quick','quickly','quicker','quickest'], correctAnswer: 'quickly', topic: 'English - Grammar' },
    { id: 'eng_h05', text: 'What is the central idea or message of a literary work called?', options: ['Plot','Theme','Setting','Character'], correctAnswer: 'Theme', topic: 'English - Literature' },
    { id: 'eng_h06', text: 'Identify the type: "The stars are diamonds in the sky."', options: ['Simile','Metaphor','Personification','Hyperbole'], correctAnswer: 'Metaphor', topic: 'English - Figurative Language' },
    { id: 'eng_h07', text: 'Which sentence is in passive voice?', options: ['She baked the cake.','The cake was baked by her.','They are baking a cake.','She will bake the cake.'], correctAnswer: 'The cake was baked by her.', topic: 'English - Grammar' },
    { id: 'eng_h08', text: '"The wind howled through the trees." This is an example of?', options: ['Metaphor','Simile','Personification','Alliteration'], correctAnswer: 'Personification', topic: 'English - Figurative Language' },
    { id: 'eng_h09', text: 'What is the correct form? "Neither the students nor the teacher ___ ready."', options: ['were','are','was','is'], correctAnswer: 'was', topic: 'English - Grammar' },
    { id: 'eng_h10', text: 'Which is the correct spelling?', options: ['accomodate','accommodate','acommodate','acomodate'], correctAnswer: 'accommodate', topic: 'English - Spelling' },
    { id: 'math_h01', text: 'Solve: 2x + 5 = 13', options: ['3','4','5','6'], correctAnswer: '4', topic: 'Mathematics - Algebra' },
    { id: 'math_h02', text: 'What is √144?', options: ['10','11','12','13'], correctAnswer: '12', topic: 'Mathematics - Radicals' },
    { id: 'math_h03', text: 'Simplify: 3(x + 4) − 2x', options: ['x+4','x+12','5x+4','x+8'], correctAnswer: 'x+12', topic: 'Mathematics - Algebra' },
    { id: 'math_h04', text: 'What is the slope of y = 3x − 7?', options: ['-7','3','7','-3'], correctAnswer: '3', topic: 'Mathematics - Linear Equations' },
    { id: 'math_h05', text: 'Solve: x² − 9 = 0', options: ['x=3','x=±3','x=9','x=±9'], correctAnswer: 'x=±3', topic: 'Mathematics - Quadratic Equations' },
    { id: 'math_h06', text: 'What is sin(90°)?', options: ['0','0.5','1','−1'], correctAnswer: '1', topic: 'Mathematics - Trigonometry' },
    { id: 'math_h07', text: 'What is the area of a circle with radius 5? (π≈3.14)', options: ['15.7','31.4','78.5','25'], correctAnswer: '78.5', topic: 'Mathematics - Geometry' },
    { id: 'math_h08', text: 'Factor: x² + 5x + 6', options: ['(x+2)(x+3)','(x+1)(x+6)','(x−2)(x−3)','(x+6)(x−1)'], correctAnswer: '(x+2)(x+3)', topic: 'Mathematics - Factoring' },
    { id: 'math_h09', text: 'What is log₁₀(1000)?', options: ['2','3','10','100'], correctAnswer: '3', topic: 'Mathematics - Logarithms' },
    { id: 'math_h10', text: 'If f(x) = 2x², what is f(3)?', options: ['12','18','36','6'], correctAnswer: '18', topic: 'Mathematics - Functions' },
    { id: 'math_h11', text: 'What is cos(0°)?', options: ['0','0.5','1','-1'], correctAnswer: '1', topic: 'Mathematics - Trigonometry' },
    { id: 'math_h12', text: 'Solve the system: x + y = 5 and x − y = 1. What is x?', options: ['1','2','3','4'], correctAnswer: '3', topic: 'Mathematics - Systems of Equations' },
    { id: 'math_h13', text: 'What is the sum of interior angles of a triangle?', options: ['90°','180°','270°','360°'], correctAnswer: '180°', topic: 'Mathematics - Geometry' },
    { id: 'math_h14', text: 'Simplify: (x³)(x⁴)', options: ['x⁷','x¹²','2x⁷','x⁷⁺'], correctAnswer: 'x⁷', topic: 'Mathematics - Exponents' },
    { id: 'math_h15', text: 'What is the mean of: 4, 8, 6, 10, 2?', options: ['5','6','7','8'], correctAnswer: '6', topic: 'Mathematics - Statistics' },
    { id: 'math_h16', text: 'What is the Pythagorean theorem?', options: ['a+b=c','a²+b²=c²','a×b=c²','a²-b²=c'], correctAnswer: 'a²+b²=c²', topic: 'Mathematics - Geometry' },
    { id: 'sci_h01', text: 'What is the chemical symbol for gold?', options: ['Go','Gd','Au','Ag'], correctAnswer: 'Au', topic: 'Science - Chemistry' },
    { id: 'sci_h02', text: 'What is the powerhouse of the cell?', options: ['Nucleus','Ribosome','Mitochondria','Golgi Body'], correctAnswer: 'Mitochondria', topic: 'Science - Biology' },
    { id: 'sci_h03', text: "What is Newton's Second Law of Motion?", options: ['F=ma','E=mc²','PV=nRT','a²+b²=c²'], correctAnswer: 'F=ma', topic: 'Science - Physics' },
    { id: 'sci_h04', text: 'How many chromosomes do humans have?', options: ['23','46','48','52'], correctAnswer: '46', topic: 'Science - Biology' },
    { id: 'sci_h05', text: "What is the most abundant gas in Earth's atmosphere?", options: ['Oxygen','Carbon Dioxide','Nitrogen','Argon'], correctAnswer: 'Nitrogen', topic: 'Science - Chemistry' },
    { id: 'sci_h06', text: 'What is the process by which plants make food using sunlight?', options: ['Respiration','Photosynthesis','Transpiration','Osmosis'], correctAnswer: 'Photosynthesis', topic: 'Science - Biology' },
    { id: 'sci_h07', text: 'What is the atomic number of Carbon?', options: ['4','6','8','12'], correctAnswer: '6', topic: 'Science - Chemistry' },
    { id: 'sci_h08', text: 'What type of bond involves sharing of electrons?', options: ['Ionic bond','Covalent bond','Metallic bond','Hydrogen bond'], correctAnswer: 'Covalent bond', topic: 'Science - Chemistry' },
    { id: 'sci_h09', text: "What is Ohm's Law?", options: ['V=IR','F=ma','E=mc²','P=IV'], correctAnswer: 'V=IR', topic: 'Science - Physics' },
    { id: 'sci_h10', text: 'Which organelle controls the activities of the cell?', options: ['Mitochondria','Ribosome','Nucleus','Cell Membrane'], correctAnswer: 'Nucleus', topic: 'Science - Biology' },
    { id: 'sci_h11', text: 'What is the speed of light?', options: ['3×10⁶ m/s','3×10⁷ m/s','3×10⁸ m/s','3×10⁹ m/s'], correctAnswer: '3×10⁸ m/s', topic: 'Science - Physics' },
    { id: 'sci_h12', text: 'What gas is produced during cellular respiration?', options: ['Oxygen','Nitrogen','Carbon Dioxide','Hydrogen'], correctAnswer: 'Carbon Dioxide', topic: 'Science - Biology' },
    { id: 'soc_h01', text: 'When did the Philippine Revolution against Spain begin?', options: ['1896','1898','1900','1910'], correctAnswer: '1896', topic: 'Social Studies - Philippine History' },
    { id: 'soc_h02', text: 'What document proclaimed Philippine independence from the US in 1946?', options: ['Malolos Constitution','Treaty of Paris','Philippine Independence Act','Manila Accord'], correctAnswer: 'Philippine Independence Act', topic: 'Social Studies - Philippine History' },
    { id: 'soc_h03', text: 'Who was the first President of the Philippine Commonwealth?', options: ['Emilio Aguinaldo','Manuel Quezon','Sergio Osmeña','Jose Laurel'], correctAnswer: 'Manuel Quezon', topic: 'Social Studies - Philippine History' },
    { id: 'soc_h04', text: 'What is the ASEAN?', options: ['Asian Science and Engineering Association Network','Association of Southeast Asian Nations','Asian Securities and Exchange Assembly Network','Association of South and East Asian Nations'], correctAnswer: 'Association of Southeast Asian Nations', topic: 'Social Studies - Asian Studies' },
    { id: 'soc_h05', text: 'What economic system is characterized by private ownership of production?', options: ['Socialism','Communism','Capitalism','Feudalism'], correctAnswer: 'Capitalism', topic: 'Social Studies - Economics' },
    { id: 'soc_h06', text: 'The concept of supply and demand means that when supply decreases and demand stays the same, price?', options: ['Decreases','Stays the same','Increases','Doubles'], correctAnswer: 'Increases', topic: 'Social Studies - Economics' },
    { id: 'soc_h07', text: 'What was the Cold War primarily between?', options: ['USA and China','USA and USSR','UK and Germany','France and Russia'], correctAnswer: 'USA and USSR', topic: 'Social Studies - World History' },
    { id: 'soc_h08', text: 'What is GDP?', options: ['General Defense Policy','Gross Domestic Product','Government Debt Policy','Global Development Program'], correctAnswer: 'Gross Domestic Product', topic: 'Social Studies - Economics' },
    { id: 'soc_h09', text: 'The Battle of Mactan (1521) resulted in the death of?', options: ['Christopher Columbus','Ferdinand Magellan','Juan de Salcedo','Miguel Lopez de Legazpi'], correctAnswer: 'Ferdinand Magellan', topic: 'Social Studies - Philippine History' },
    { id: 'soc_h10', text: 'What year did World War II end?', options: ['1943','1944','1945','1946'], correctAnswer: '1945', topic: 'Social Studies - World History' },
    { id: 'tle_h01', text: 'In ICT, what does HTML stand for?', options: ['Hyper Text Markup Language','High Tech Machine Language','Hyper Transfer Mode Language','Home Tool Markup Language'], correctAnswer: 'Hyper Text Markup Language', topic: 'TLE - ICT' },
    { id: 'tle_h02', text: 'Which of these is a spreadsheet application?', options: ['Microsoft Word','Microsoft Excel','Microsoft PowerPoint','Microsoft Access'], correctAnswer: 'Microsoft Excel', topic: 'TLE - ICT' },
    { id: 'tle_h03', text: 'In cooking, what does "sauté" mean?', options: ['To boil in water','To fry quickly in a little oil','To bake in an oven','To steam over water'], correctAnswer: 'To fry quickly in a little oil', topic: 'TLE - Home Economics' },
    { id: 'tle_h04', text: 'What is the proper internal temperature for cooked chicken?', options: ['65°C','72°C','74°C','82°C'], correctAnswer: '74°C', topic: 'TLE - Home Economics' },
    { id: 'tle_h05', text: 'In agriculture, what is crop rotation?', options: ['Moving crops to new locations','Growing different crops in the same field each season','Rotating irrigation schedules','Using different fertilizers each year'], correctAnswer: 'Growing different crops in the same field each season', topic: 'TLE - Agriculture' },
    { id: 'tle_h06', text: 'What does CPU stand for?', options: ['Central Processing Unit','Computer Power Unit','Control Process Unit','Central Program Utility'], correctAnswer: 'Central Processing Unit', topic: 'TLE - ICT' },
    { id: 'mapeh_h01', text: 'What musical term means to gradually get louder?', options: ['Diminuendo','Crescendo','Forte','Piano'], correctAnswer: 'Crescendo', topic: 'MAPEH - Music' },
    { id: 'mapeh_h02', text: 'In art, what is the term for the area between and around subjects?', options: ['Foreground','Background','Negative space','Perspective'], correctAnswer: 'Negative space', topic: 'MAPEH - Arts' },
    { id: 'mapeh_h03', text: 'What is the BMI formula?', options: ['Weight÷Height','Weight(kg)÷Height(m)²','Weight×Height','Weight(lb)÷Height(ft)²'], correctAnswer: 'Weight(kg)÷Height(m)²', topic: 'MAPEH - Health' },
    { id: 'mapeh_h04', text: 'In volleyball, how many players are on each side of the court?', options: ['5','6','7','8'], correctAnswer: '6', topic: 'MAPEH - Physical Education' },
    { id: 'mapeh_h05', text: 'What is the time signature 4/4 also called?', options: ['Cut time','Common time','Waltz time','March time'], correctAnswer: 'Common time', topic: 'MAPEH - Music' },
    { id: 'mapeh_h06', text: 'Which art movement is Salvador Dalí associated with?', options: ['Impressionism','Surrealism','Cubism','Realism'], correctAnswer: 'Surrealism', topic: 'MAPEH - Arts' },
    { id: 'esp_h01', text: 'Ano ang kahulugan ng "integridad"?', options: ['Pagiging mayaman','Pagiging tapat at may prinsipyo','Pagiging matalino','Pagiging makapangyarihan'], correctAnswer: 'Pagiging tapat at may prinsipyo', topic: 'EsP - Values' },
    { id: 'esp_h02', text: 'Alin sa mga sumusunod ang nagpapakita ng "pagpapahalaga sa sarili"?', options: ['Pagkopya sa pagsusulit','Pagbibigay ng tamang sagot kahit mahirap','Pag-aaway sa kapwa','Pagiging palalo'], correctAnswer: 'Pagbibigay ng tamang sagot kahit mahirap', topic: 'EsP - Character' },
    { id: 'esp_h03', text: 'Ang pagkakaroon ng "empathy" ay nangangahulugang?', options: ['Pakiramdaman ang nararamdaman ng iba','Pagtulong lamang sa pamilya','Pagiging makasarili','Pagbibigay ng pera sa mahirap'], correctAnswer: 'Pakiramdaman ang nararamdaman ng iba', topic: 'EsP - Values' },
    { id: 'esp_h04', text: 'Ano ang nangangahulugang "makabayan"?', options: ['Pagiging mayaman','Pagmamahal at paglilingkod sa bansa','Pagiging sikat','Paglalakbay sa ibang bansa'], correctAnswer: 'Pagmamahal at paglilingkod sa bansa', topic: 'EsP - Character' },
  ],
};

interface AnswerItem { questionId: string; answer: string; }
interface AnalyzeBody { level: string; answers: AnswerItem[]; }

export async function POST(req: NextRequest) {
  try {
    const body: AnalyzeBody = await req.json();
    const { level, answers } = body;

    const pool = ALL_QUESTIONS[level?.toUpperCase()] ?? ALL_QUESTIONS.ELEMENTARY;
    const lookup = new Map(pool.map(q => [q.id, q]));

    // ── Grade each answer ────────────────────────────────────────────────────
    type Graded = { questionId: string; topic: string; correct: boolean; studentAnswer: string; correctAnswer: string; };
    const graded: Graded[] = answers.map(({ questionId, answer }) => {
      const q = lookup.get(questionId);
      if (!q) return null;
      return { questionId, topic: q.topic, correct: answer === q.correctAnswer, studentAnswer: answer, correctAnswer: q.correctAnswer };
    }).filter(Boolean) as Graded[];

    const score = graded.filter(g => g.correct).length;
    const total = graded.length;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

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

    // ── Local analysis engine ─────────────────────────────────────────────────
    const weakTopics = topicResults
      .filter(t => t.accuracy < 70)
      .sort((a, b) => a.accuracy - b.accuracy);

    const strongTopics = topicResults
      .filter(t => t.accuracy >= 80);

    const masteryLevel = percentage >= 90 ? 'Advanced' : percentage >= 75 ? 'Proficient' : percentage >= 50 ? 'Developing' : 'Beginner';

    const elementaryTips: Record<string, string> = {
      'Filipino': 'Magbasa ng mga kwentong Tagalog araw-araw. Magsanay sa pagtukoy ng mga bahagi ng pananalita tulad ng pangngalan, pang-uri, at pandiwa.',
      'English': 'Read short storybooks aloud for 15 minutes every day. Practice writing simple sentences about things you see around you.',
      'Mathematics': 'Practice your math facts with flashcards for 10 minutes daily. Draw pictures to help solve word problems!',
      'Science': 'Observe plants and animals around your home. Draw and label what you see to remember science concepts better.',
      'Social Studies': 'Look at maps of the Philippines and learn fun facts about each region. Create a simple timeline of important dates.',
      'MAPEH': 'Practice identifying notes and rhythms by clapping along to your favorite songs. Draw or color to improve art skills.',
      'EsP': 'Think about how you can show kindness and respect to your family and classmates every day.',
      'Vocabulary': 'Make your own picture dictionary — draw a picture for each new word you learn.',
      'Grammar': 'Practice writing correct sentences and ask a parent or teacher to check them.',
      'Addition': 'Use objects like coins or toys to help you add numbers. Practice adding 2-digit numbers daily.',
      'Subtraction': 'Practice "take away" with real objects first, then try without them. Check your work by adding back.',
      'Multiplication': 'Sing multiplication songs and use skip-counting. Practice 5 facts at a time until you master them.',
      'Division': 'Think of division as sharing equally. Use small objects to practice dividing them into groups.',
      'Fractions': 'Practice with pizza or cake slices — cutting food into equal parts makes fractions fun and easy to understand!',
      'Geometry': 'Look for shapes around your house — circles, squares, triangles. Draw and count their sides and corners.',
      'Biology': 'Draw and color different animals and plants. Label their body parts with correct names.',
      'Earth Science': 'Go outside and observe the weather. Draw pictures of clouds, rain, and sunshine in your science notebook.',
      'Physics': 'Play with magnets and observe what they attract. Drop different objects and see which ones fall faster.',
      'Culture': 'Learn about your local traditions and celebrations. Share one fun fact about your culture with your classmates.',
      'Philippine History': 'Read simple stories about Philippine heroes. Draw a picture of your favorite hero and write why you admire them.',
      'Music': 'Practice clapping to the beat of different songs. Learn to identify loud (forte) and soft (piano) sounds.',
      'Health': 'Drink plenty of water and eat fruits and vegetables every day. Get at least 60 minutes of active play!',
      'Arts': 'Practice mixing primary colors to make new colors. Draw something you see outside every day.',
      'Physical Education': 'Play active games like tag, jump rope, or ball games for at least 30 minutes daily.',
      'Values': 'Practice saying "please" and "thank you". Help with simple chores at home to show you care.',
      'Character': 'Think about what makes a good friend. Draw a picture showing you being a good friend to someone.',
      'Patterns': 'Look for patterns in tiles, clothes, and nature. Try creating your own patterns with colors or shapes.',
      'Time': 'Practice reading analog clocks. Set a timer and see how many things you can do in 5 minutes!',
      'Word Structure': 'Break big words into smaller parts. Look for root words and common endings like -an, -in, -um.',
      'Punctuation': 'Practice ending sentences with the correct mark — period for telling, question mark for asking, exclamation for excitement!',
      'Plurals': 'Remember: one cat, two cats. Practice changing singular words to plural by adding -s or -es.',
      'Phonics': 'Sound out new words letter by letter. Practice common letter combinations like "sh", "ch", "th".',
      'Percentages': 'Think of percentages as "out of 100". If 50 out of 100 squares are shaded, that\'s 50%!',
      'Rounding': 'Use a number line — numbers ending in 0-4 round down, numbers ending in 5-9 round up!',
      'Exponents': 'Think of exponents as repeated multiplication. 7² is just 7 × 7 = 49!',
      'Parts of Speech': 'Learn the 8 parts of speech with fun songs and hand motions. Practice identifying them in sentences you read.',
      'Literature': 'Read with your family and talk about the story — who are the characters, where does it take place, what happens?',
    };

    const highSchoolTips: Record<string, string> = {
      'Filipino': 'Basahin ang mga klasikong akda tulad ng Florante at Laura at Noli Me Tangere. Gumawa ng character map at suriin ang mga tema ng bawat kabanata.',
      'English': 'Read actively by taking notes on themes, characters, and literary devices. Practice writing analytical essays with clear thesis statements.',
      'Mathematics': 'Practice 10 problems daily and review formulas before attempting harder ones. Focus on understanding the "why" not just the "how".',
      'Science': 'Create concept maps connecting different scientific ideas and processes. Practice explaining concepts in your own words.',
      'Social Studies': 'Create timelines of historical events and use mnemonic devices for key facts. Connect past events to current situations.',
      'MAPEH': 'Practice active recall: cover and repeat key concepts from each MAPEH area. Create study guides with diagrams.',
      'EsP': 'Reflect on real-life ethical dilemmas and how core values apply. Discuss moral issues with peers to deepen understanding.',
      'TLE': 'Watch tutorial videos and practice hands-on exercises. Create a portfolio of your projects to track skill development.',
      'Algebra': 'Practice solving equations step-by-step and check your work by substituting answers back in. Show all work neatly.',
      'Geometry': 'Draw diagrams for every problem and memorize key formulas with flashcards. Practice proofs by writing each logical step.',
      'Trigonometry': 'Learn the unit circle and practice SOH-CAH-TOA with different angle measures. Memorize special angle values.',
      'Statistics': 'Work with real data sets and practice calculating mean, median, and mode. Learn to interpret graphs and charts critically.',
      'Biology': 'Draw and label diagrams of biological processes to improve memorization. Use the Feynman technique — teach it to someone else.',
      'Chemistry': 'Practice balancing chemical equations and memorize periodic table trends. Understand the logic behind formulas, don\'t just memorize.',
      'Physics': 'Work through problems methodically, writing down every formula and unit conversion. Focus on understanding fundamental principles.',
      'Philippine History': 'Create a timeline of key events and use storytelling to remember historical figures. Analyze causes and effects of major events.',
      'Economics': 'Apply economic concepts to real-world news stories and daily purchases. Follow current events to see supply and demand in action.',
      'Literature': 'Read actively by taking notes on themes, characters, and plot developments. Practice writing literary analysis with textual evidence.',
      'Asian Studies': 'Research the cultures, histories, and economies of different Asian countries. Make comparison charts to understand regional differences.',
      'World History': 'Connect historical events across different civilizations. Look for patterns in how societies rise, develop, and change over time.',
      'Factoring': 'Practice identifying common factors first. Remember: factoring is just "un-multiplying" — check by multiplying back!',
      'Radicals': 'Simplify by finding perfect square factors. Practice rationalizing denominators step by step.',
      'Linear Equations': 'Remember: slope tells you steepness and direction. Use y=mx+b as your trusty formula for graphing any line.',
      'Quadratic Equations': 'Learn all three methods: factoring, completing the square, and quadratic formula. Practice each until you find your strongest method.',
      'Functions': 'Think of functions as machines — input goes in, output comes out. Practice evaluating f(x) by substituting values carefully.',
      'Logarithms': 'Remember: log is just the inverse of exponentiation. If you know 10²=100, then log₁₀(100)=2!',
      'Systems of Equations': 'Practice both substitution and elimination methods. Always check your answer by plugging back into both original equations.',
      'Exponents': 'Master the laws of exponents: product rule, quotient rule, and power rule. Write them on a reference card.',
      'Grammar': 'Review subject-verb agreement and tense consistency. Read your writing aloud to catch errors in sentence structure.',
      'Vocabulary': 'Learn 5 new words daily and use them in sentences. Keep a vocabulary journal with definitions and example sentences.',
      'Literature Analysis': 'Identify themes, symbols, and motifs as you read. Take marginal notes and highlight passages that support your analysis.',
      'Figurative Language': 'Practice identifying similes, metaphors, personification, and hyperbole in songs and poems you enjoy.',
      'Spelling': 'Create mnemonic devices for difficult words. Break words into syllables and practice writing them multiple times.',
      'Chemistry Principles': 'Understand the periodic table organization — groups, periods, and trends. Practice electron configuration for elements.',
      'Biology Systems': 'Create flowcharts for biological processes like photosynthesis and cellular respiration. Label diagrams from memory.',
      'Physics Principles': 'Memorize key equations and practice unit conversions. Work through sample problems under timed conditions.',
    };

    // Select level-appropriate tips
    const isElementary = level?.toUpperCase() === 'ELEMENTARY';
    const tips = isElementary ? elementaryTips : highSchoolTips;

    const getTip = (topic: string): string => {
      for (const [key, tip] of Object.entries(tips)) {
        if (topic.toLowerCase().includes(key.toLowerCase())) return tip;
      }
      if (isElementary) {
        return `Practice makes perfect! Spend 15 minutes each day reviewing ${topic}. Ask your parent or teacher to help you with this subject. You can do it! 🌟`;
      }
      return `Review your notes and practice more problems on ${topic}. Consider finding a tutor who specializes in this area to help you improve faster.`;
    };

    const analysis = {
      mastery_level: masteryLevel,
      weaknesses: weakTopics.map((t, i) => ({
        topic: t.topic,
        accuracy: t.accuracy,
        proficiency: t.accuracy < 40 ? 'Struggling' : 'Needs Work',
        priority: i + 1,
        tip: getTip(t.topic),
      })),
      strengths: strongTopics.map(t => ({ topic: t.topic, accuracy: t.accuracy })),
      recommendation: generateRecommendation(percentage, score, total, weakTopics, strongTopics, isElementary),
      study_plan: generateStudyPlan(weakTopics, strongTopics, isElementary),
    };

    return NextResponse.json({
      score,
      total,
      percentage,
      mastery_level: analysis.mastery_level,
      weaknesses: analysis.weaknesses ?? [],
      strengths: analysis.strengths ?? [],
      recommendation: analysis.recommendation,
      study_plan: analysis.study_plan,
      topic_breakdown: topicResults,
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
  weakTopics: { topic: string; accuracy: number }[],
  strongTopics: { topic: string; accuracy: number }[],
  isElementary: boolean = true
): string {
  const weakNames = weakTopics.map(t => t.topic.split(' - ')[0]).filter((v, i, a) => a.indexOf(v) === i);
  const strongNames = strongTopics.map(t => t.topic.split(' - ')[0]).filter((v, i, a) => a.indexOf(v) === i);

  if (isElementary) {
    let msg = '';
    if (percentage >= 90) {
      msg = `🌟 Amazing work! You scored ${percentage}% — that's outstanding! You're doing a fantastic job in your studies. `;
      if (weakNames.length > 0) msg += `To get even better, try spending a little extra time on ${weakNames.slice(0, 2).join(' and ')}. `;
      msg += `Keep reading, practicing, and asking questions — you're a superstar! 🎯`;
    } else if (percentage >= 75) {
      msg = `📈 Great job! You scored ${percentage}%. You're learning well and should be proud of yourself! `;
      if (weakNames.length > 0) msg += `Let's focus on ${weakNames.slice(0, 2).join(' and ')} — with a little more practice, you'll master these too! `;
      if (strongNames.length > 0) msg += `You're already doing great in ${strongNames.slice(0, 2).join(' and ')}! `;
      msg += `A tutor can help make learning even more fun! 💪`;
    } else if (percentage >= 50) {
      msg = `📚 You scored ${percentage}% — and that's a great start! Learning is a journey and every step counts! `;
      if (weakNames.length > 0) msg += `The subjects that need a little more practice are ${weakNames.slice(0, 3).join(', ')}. `;
      msg += `With fun activities and help from a tutor, you'll see big improvements. Keep going, you can do it! ✨`;
    } else {
      msg = `💪 You scored ${percentage}% — and that's perfectly okay! Everyone starts somewhere! `;
      if (weakNames.length > 0) msg += `This tells us exactly where you need help: ${weakNames.slice(0, 3).join(', ')}. `;
      msg += `The good news is that with the right support, you can improve a lot. Learning should be fun, and a tutor can help make it that way! 🌱`;
    }
    msg += ` We recommend studying with a tutor 2-3 times each week to build confidence and have fun while learning!`;
    return msg;
  }

  let msg = '';
  if (percentage >= 90) {
    msg = `Excellent work! You scored ${percentage}% on the assessment, showing strong mastery across subjects. 🌟 `;
    if (weakNames.length > 0) msg += `To reach even higher, consider a quick refresher on ${weakNames.slice(0, 2).join(' and ')}. `;
    msg += `Keep up the great study habits! 🎯`;
  } else if (percentage >= 75) {
    msg = `Good job! You scored ${percentage}%. You're on the right track! 📈 `;
    if (weakNames.length > 0) msg += `Focus extra attention on ${weakNames.slice(0, 2).join(' and ')} — these areas will benefit the most from tutoring. `;
    if (strongNames.length > 0) msg += `Your strengths in ${strongNames.slice(0, 2).join(' and ')} show you have a solid foundation. `;
    msg += `A tutor can help turn those weak spots into strengths too! 💪`;
  } else if (percentage >= 50) {
    msg = `You scored ${percentage}% — a good starting point! 📚 `;
    if (weakNames.length > 0) msg += `The areas that need the most work are ${weakNames.slice(0, 3).join(', ')}. `;
    msg += `With consistent practice and guidance from a tutor, you'll see big improvements. Don't give up! ✨`;
  } else {
    msg = `You scored ${percentage}% — and that's perfectly okay! 💪 `;
    if (weakNames.length > 0) msg += `This shows exactly where you need support: ${weakNames.slice(0, 3).join(', ')}. `;
    msg += `The good news is that with the right tutor, these subjects can become your favorites. Every expert was once a beginner! 🌱`;
  }
  msg += ` I recommend booking a tutor session to work on your weak areas at least 2-3 times per week.`;
  return msg;
}

// ── Study plan generator ────────────────────────────────────────────────
function generateStudyPlan(
  weakTopics: { topic: string; accuracy: number }[],
  strongTopics: { topic: string; accuracy: number }[],
  isElementary: boolean = true
): string {
  const weakNames = weakTopics.map(t => t.topic).slice(0, 3);
  const strongNames = strongTopics.map(t => t.topic).slice(0, 2);

  if (weakNames.length === 0) {
    if (isElementary) {
      return `🌟 You're doing great across all subjects! Here's how to keep shining:\n\n1. Keep reading for 20 minutes every day — try storybooks, comics, or articles you enjoy.\n2. Practice math facts with fun games or apps for 10 minutes daily.\n3. Explore science by doing simple experiments at home with a parent's help.\n4. Review ${strongNames.join(' and ') || 'your favorite subjects'} once a week to stay sharp.\n\nKeep up the amazing work and never stop being curious! 🎯`;
    }
    return `Great job! You're doing well across all subjects. To stay sharp, continue practicing challenging problems and exploring advanced topics in ${strongNames.join(' and ') || 'your favorite subjects'}. Consider peer tutoring to reinforce your knowledge!`;
  }

  if (isElementary) {
    let plan = `Here's a fun and easy study plan just for you! 🎒\n\n`;
    plan += `📌 1. Let's start with ${weakNames[0]} — spend 15 minutes each day practicing with fun activities like flashcards, drawing, or learning games. `;
    if (weakNames.length > 1) plan += `\n📌 2. Next, work on ${weakNames[1]} — practice for 10 minutes every other day. Try making it a game with a friend or family member! `;
    if (weakNames.length > 2) plan += `\n📌 3. Then, let's tackle ${weakNames[2]} — use colorful pictures, songs, or short videos to make learning easy and fun. `;
    plan += `\n📌 4. Don't forget to review ${strongNames.join(' and ') || 'subjects you enjoy'} for 10 minutes once a week. `;
    plan += `\n\n🎯 Book a tutor session 2-3 times a week so you can learn with someone who makes studying exciting and helps you grow!`;
    return plan;
  }

  let plan = `1. Prioritize ${weakNames[0]} — spend 20 minutes daily reviewing key concepts and practicing sample problems. `;
  if (weakNames.length > 1) plan += `2. Move on to ${weakNames[1]} — set aside 15 minutes every other day for targeted practice. `;
  if (weakNames.length > 2) plan += `3. Work on ${weakNames[2]} — use flashcards and concept maps to reinforce understanding. `;
  
  if (strongNames.length > 0) {
    plan += `4. Maintain your strengths in ${strongNames.join(' and ')} by reviewing them once a week. `;
  }
  
  plan += `Book a tutor session at least twice a week for personalized guidance on your weak areas.`;
  return plan;
}
