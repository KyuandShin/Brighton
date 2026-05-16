// ─────────────────────────────────────────────────────────────────────────────
// PHILIPPINE K-12 CURRICULUM QUESTION BANK
// 4 Core Subjects: Mathematics, Science, Filipino, English
// Per grade level: 5-8 questions each, grades 1-12
// ─────────────────────────────────────────────────────────────────────────────

export interface QuestionItem {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  subject: 'Mathematics' | 'Science' | 'Filipino' | 'English';
  topic: string;
}

type GradeQuestions = QuestionItem[];

export const QUESTIONS: Record<string, GradeQuestions> = {
  // ── GRADE 1 ──────────────────────────────────────────────────────────────
  GRADE_1: [
    // Math
    { id: 'm1_01', text: 'What is 2 + 3?', options: ['4', '5', '6', '7'], correctAnswer: '5', subject: 'Mathematics', topic: 'Addition' },
    { id: 'm1_02', text: 'What shape has 4 equal sides?', options: ['Triangle', 'Square', 'Circle', 'Rectangle'], correctAnswer: 'Square', subject: 'Mathematics', topic: 'Shapes' },
    { id: 'm1_03', text: 'What is 7 − 3?', options: ['3', '4', '5', '6'], correctAnswer: '4', subject: 'Mathematics', topic: 'Subtraction' },
    { id: 'm1_04', text: 'Count by tens: 10, 20, 30, ___?', options: ['35', '40', '50', '25'], correctAnswer: '40', subject: 'Mathematics', topic: 'Counting' },
    { id: 'm1_05', text: 'Which number is bigger: 67 or 76?', options: ['67', '76', 'They are equal', 'Neither'], correctAnswer: '76', subject: 'Mathematics', topic: 'Comparing Numbers' },
    { id: 'm1_06', text: 'What is 5 + 4?', options: ['8', '9', '10', '7'], correctAnswer: '9', subject: 'Mathematics', topic: 'Addition' },
    // Science
    { id: 's1_01', text: 'What do plants need to grow?', options: ['Sunlight and water', 'Only water', 'Only soil', 'Only sunlight'], correctAnswer: 'Sunlight and water', subject: 'Science', topic: 'Plants' },
    { id: 's1_02', text: 'Which animal lives in water?', options: ['Dog', 'Fish', 'Cat', 'Bird'], correctAnswer: 'Fish', subject: 'Science', topic: 'Animals' },
    { id: 's1_03', text: 'What part of the body do you use to see?', options: ['Ears', 'Eyes', 'Nose', 'Mouth'], correctAnswer: 'Eyes', subject: 'Science', topic: 'Body Parts' },
    { id: 's1_04', text: 'What season comes after summer?', options: ['Spring', 'Fall/Autumn', 'Winter', 'Rainy'], correctAnswer: 'Fall/Autumn', subject: 'Science', topic: 'Weather' },
    { id: 's1_05', text: 'What is the color of the sky on a clear day?', options: ['Green', 'Red', 'Blue', 'Yellow'], correctAnswer: 'Blue', subject: 'Science', topic: 'Weather' },
    { id: 's1_06', text: 'Which sense do you use to smell a flower?', options: ['Eyes', 'Tongue', 'Nose', 'Ears'], correctAnswer: 'Nose', subject: 'Science', topic: 'Senses' },
    // Filipino
    { id: 'f1_01', text: 'Ano ang tamang baybay ng salitang "aso"?', options: ['aso', 'aso', 'ha-so', 'a-so'], correctAnswer: 'aso', subject: 'Filipino', topic: 'Pagbaybay' },
    { id: 'f1_02', text: 'Alin ang pangngalan: "Ang ___ ay tumatakbo."', options: ['mabilis', 'bata', 'kahapon', 'talaga'], correctAnswer: 'bata', subject: 'Filipino', topic: 'Pangngalan' },
    { id: 'f1_03', text: 'Ilang pantig mayroon ang salitang "bahay"?', options: ['1', '2', '3', '4'], correctAnswer: '2', subject: 'Filipino', topic: 'Pantig' },
    { id: 'f1_04', text: 'Ano ang Alpabetong Filipino ay may ___ na titik?', options: ['26', '28', '20', '30'], correctAnswer: '28', subject: 'Filipino', topic: 'Alpabeto' },
    { id: 'f1_05', text: 'Alin ang tamang pangungusap?', options: ['Ako ay Pilipino.', 'Ako Pilipino ay.', 'Pilipino ako ay.', 'Ay ako Pilipino.'], correctAnswer: 'Ako ay Pilipino.', subject: 'Filipino', topic: 'Pangungusap' },
    { id: 'f1_06', text: 'Ano ang tawag sa guhit na ginagamit sa pagsulat?', options: ['Bilang', 'Titik', 'Pantig', 'Salita'], correctAnswer: 'Titik', subject: 'Filipino', topic: 'Pagsulat' },
    // English
    { id: 'e1_01', text: 'What letter comes after "A"?', options: ['C', 'B', 'D', 'E'], correctAnswer: 'B', subject: 'English', topic: 'Alphabet' },
    { id: 'e1_02', text: 'The cat ___ on the mat.', options: ['sat', 'sits', 'siting', 'sitted'], correctAnswer: 'sat', subject: 'English', topic: 'Simple Sentences' },
    { id: 'e1_03', text: 'Which word starts with the letter "B"?', options: ['Apple', 'Ball', 'Cat', 'Dog'], correctAnswer: 'Ball', subject: 'English', topic: 'Initial Sounds' },
    { id: 'e1_04', text: 'What is the plural of "cat"?', options: ['Cats', 'Cates', 'Caties', 'Cat'], correctAnswer: 'Cats', subject: 'English', topic: 'Plurals' },
    { id: 'e1_05', text: 'Which is a color?', options: ['Run', 'Red', 'Read', 'Rest'], correctAnswer: 'Red', subject: 'English', topic: 'Vocabulary' },
    { id: 'e1_06', text: '"I ___ a student."', options: ['are', 'is', 'am', 'be'], correctAnswer: 'am', subject: 'English', topic: 'Grammar' },
  ],

  // ── GRADE 2 ──────────────────────────────────────────────────────────────
  GRADE_2: [
    // Math
    { id: 'm2_01', text: 'What is 15 + 8?', options: ['22', '23', '24', '25'], correctAnswer: '23', subject: 'Mathematics', topic: 'Addition' },
    { id: 'm2_02', text: 'What is 20 − 7?', options: ['12', '13', '14', '15'], correctAnswer: '13', subject: 'Mathematics', topic: 'Subtraction' },
    { id: 'm2_03', text: 'What is 3 × 5?', options: ['10', '12', '15', '18'], correctAnswer: '15', subject: 'Mathematics', topic: 'Multiplication' },
    { id: 'm2_04', text: 'Which is greater: 1/2 or 1/4?', options: ['1/2', '1/4', 'They are equal', 'Cannot tell'], correctAnswer: '1/2', subject: 'Mathematics', topic: 'Fractions' },
    { id: 'm2_05', text: 'How many sides does a triangle have?', options: ['2', '3', '4', '5'], correctAnswer: '3', subject: 'Mathematics', topic: 'Geometry' },
    { id: 'm2_06', text: 'What number is 10 more than 45?', options: ['35', '55', '65', '45'], correctAnswer: '55', subject: 'Mathematics', topic: 'Place Value' },
    // Science
    { id: 's2_01', text: 'What are the three states of matter?', options: ['Solid, liquid, gas', 'Hard, soft, wet', 'Hot, cold, warm', 'Big, small, medium'], correctAnswer: 'Solid, liquid, gas', subject: 'Science', topic: 'Matter' },
    { id: 's2_02', text: 'What do humans breathe out?', options: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Hydrogen'], correctAnswer: 'Carbon dioxide', subject: 'Science', topic: 'Human Body' },
    { id: 's2_03', text: 'Which animal can fly?', options: ['Fish', 'Eagle', 'Snake', 'Dog'], correctAnswer: 'Eagle', subject: 'Science', topic: 'Animals' },
    { id: 's2_04', text: 'What is the process of water turning into vapor?', options: ['Condensation', 'Evaporation', 'Freezing', 'Melting'], correctAnswer: 'Evaporation', subject: 'Science', topic: 'Water Cycle' },
    { id: 's2_05', text: 'What is the biggest planet?', options: ['Earth', 'Mars', 'Jupiter', 'Saturn'], correctAnswer: 'Jupiter', subject: 'Science', topic: 'Solar System' },
    // Filipino
    { id: 'f2_01', text: 'Alin ang tamang gamit ng "ng"? "Kumain ___ saging si Ana."', options: ['nang', 'ng', 'na', 'ng mga'], correctAnswer: 'ng', subject: 'Filipino', topic: 'Gramatika' },
    { id: 'f2_02', text: 'Ano ang pang-uri? "Ang bulaklak ay ___."', options: ['tumakbo', 'maganda', 'kumain', 'umiyak'], correctAnswer: 'maganda', subject: 'Filipino', topic: 'Pang-uri' },
    { id: 'f2_03', text: 'Ano ang kabaligtaran ng "malaki"?', options: ['Mataba', 'Maliit', 'Mahaba', 'Malawak'], correctAnswer: 'Maliit', subject: 'Filipino', topic: 'Kasasalungat' },
    { id: 'f2_04', text: 'Sino ang pangulo ng Pilipinas na kilala sa "People Power"?', options: ['Ferdinand Marcos', 'Corazon Aquino', 'Joseph Estrada', 'Fidel Ramos'], correctAnswer: 'Corazon Aquino', subject: 'Filipino', topic: 'Bayan' },
    { id: 'f2_05', text: 'Ano ang panghalip para sa "Maria"?', options: ['Siya', 'Ako', 'Kami', 'Tayo'], correctAnswer: 'Siya', subject: 'Filipino', topic: 'Panghalip' },
    // English
    { id: 'e2_01', text: 'Choose the correct spelling:', options: ['recieve', 'receive', 'receeve', 'reciève'], correctAnswer: 'receive', subject: 'English', topic: 'Spelling' },
    { id: 'e2_02', text: 'She ___ to school every day.', options: ['go', 'goes', 'going', 'went'], correctAnswer: 'goes', subject: 'English', topic: 'Grammar' },
    { id: 'e2_03', text: 'What is the opposite of "hot"?', options: ['Warm', 'Cold', 'Cool', 'Mild'], correctAnswer: 'Cold', subject: 'English', topic: 'Antonyms' },
    { id: 'e2_04', text: 'Which word is a verb?', options: ['Happiness', 'Run', 'Beautiful', 'Slowly'], correctAnswer: 'Run', subject: 'English', topic: 'Parts of Speech' },
    { id: 'e2_05', text: 'What do you use to write on a blackboard?', options: ['Pen', 'Pencil', 'Chalk', 'Crayon'], correctAnswer: 'Chalk', subject: 'English', topic: 'Vocabulary' },
    { id: 'e2_06', text: 'The dog is ___ the table.', options: ['in', 'on', 'under', 'over'], correctAnswer: 'under', subject: 'English', topic: 'Prepositions' },
  ],

  // ── GRADE 3 ──────────────────────────────────────────────────────────────
  GRADE_3: [
    // Math
    { id: 'm3_01', text: 'What is 45 + 37?', options: ['72', '82', '92', '80'], correctAnswer: '82', subject: 'Mathematics', topic: 'Addition' },
    { id: 'm3_02', text: 'What is 6 × 7?', options: ['36', '42', '48', '54'], correctAnswer: '42', subject: 'Mathematics', topic: 'Multiplication' },
    { id: 'm3_03', text: 'What is 24 ÷ 3?', options: ['6', '7', '8', '9'], correctAnswer: '8', subject: 'Mathematics', topic: 'Division' },
    { id: 'm3_04', text: 'What fraction is 1/4 of a pizza?', options: ['One slice of 4', 'One slice of 2', 'One slice of 8', 'One slice of 6'], correctAnswer: 'One slice of 4', subject: 'Mathematics', topic: 'Fractions' },
    { id: 'm3_05', text: 'How many minutes are in 1 hour?', options: ['30', '45', '60', '100'], correctAnswer: '60', subject: 'Mathematics', topic: 'Time' },
    { id: 'm3_06', text: 'What is the perimeter of a square with side 4 cm?', options: ['8 cm', '12 cm', '16 cm', '20 cm'], correctAnswer: '16 cm', subject: 'Mathematics', topic: 'Geometry' },
    // Science
    { id: 's3_01', text: 'What force pulls things toward the ground?', options: ['Magnetism', 'Friction', 'Gravity', 'Air pressure'], correctAnswer: 'Gravity', subject: 'Science', topic: 'Forces' },
    { id: 's3_02', text: 'What organ pumps blood in your body?', options: ['Lungs', 'Brain', 'Heart', 'Liver'], correctAnswer: 'Heart', subject: 'Science', topic: 'Human Body' },
    { id: 's3_03', text: 'Which planet is called the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Mercury'], correctAnswer: 'Mars', subject: 'Science', topic: 'Solar System' },
    { id: 's3_04', text: 'What is the boiling point of water?', options: ['50°C', '75°C', '100°C', '120°C'], correctAnswer: '100°C', subject: 'Science', topic: 'Matter' },
    { id: 's3_05', text: 'What type of animal lays eggs?', options: ['Dog', 'Cat', 'Chicken', 'Horse'], correctAnswer: 'Chicken', subject: 'Science', topic: 'Animals' },
    { id: 's3_06', text: 'What causes a rainbow?', options: ['Wind', 'Sunlight and rain', 'Clouds', 'Moonlight'], correctAnswer: 'Sunlight and rain', subject: 'Science', topic: 'Weather' },
    // Filipino
    { id: 'f3_01', text: 'Ano ang salitang-ugat ng "tumakbo"?', options: ['tumak', 'takbo', 'tumakbo', 'bo'], correctAnswer: 'takbo', subject: 'Filipino', topic: 'Salitang-ugat' },
    { id: 'f3_02', text: 'Alin ang tamang bantas? "Magandang umaga___"', options: ['.', '!', '?', ','], correctAnswer: '!', subject: 'Filipino', topic: 'Bantas' },
    { id: 'f3_03', text: 'Ano ang kasingkahulugan ng "masaya"?', options: ['Malungkot', 'Matamlay', 'Masigla', 'Galit'], correctAnswer: 'Masigla', subject: 'Filipino', topic: 'Kasingkahulugan' },
    { id: 'f3_04', text: '"Si Maria ay naglalaro sa parke." Ano ang pandiwa?', options: ['Maria', 'naglalaro', 'parke', 'sa'], correctAnswer: 'naglalaro', subject: 'Filipino', topic: 'Pandiwa' },
    { id: 'f3_05', text: 'Ilang pantig mayroon ang salitang "maganda"?', options: ['2', '3', '4', '5'], correctAnswer: '3', subject: 'Filipino', topic: 'Pantig' },
    // English
    { id: 'e3_01', text: '"The sun is very bright today." What is the adjective?', options: ['sun', 'very', 'bright', 'today'], correctAnswer: 'bright', subject: 'English', topic: 'Adjectives' },
    { id: 'e3_02', text: 'They ___ playing outside yesterday.', options: ['are', 'is', 'were', 'was'], correctAnswer: 'were', subject: 'English', topic: 'Grammar' },
    { id: 'e3_03', text: 'What is a synonym for "big"?', options: ['Small', 'Tiny', 'Large', 'Narrow'], correctAnswer: 'Large', subject: 'English', topic: 'Synonyms' },
    { id: 'e3_04', text: 'Which sentence is a question?', options: ['I went home.', 'Are you okay?', 'Close the door.', 'She sings well.'], correctAnswer: 'Are you okay?', subject: 'English', topic: 'Sentence Types' },
    { id: 'e3_05', text: 'What is the past tense of "jump"?', options: ['jumped', 'jumping', 'jumps', 'jump'], correctAnswer: 'jumped', subject: 'English', topic: 'Verb Tenses' },
    { id: 'e3_06', text: 'The book is ___ the shelf.', options: ['in', 'at', 'on', 'by'], correctAnswer: 'on', subject: 'English', topic: 'Prepositions' },
  ],

  // ── GRADE 4 ──────────────────────────────────────────────────────────────
  GRADE_4: [
    // Math
    { id: 'm4_01', text: 'What is 89 + 47?', options: ['126', '136', '146', '116'], correctAnswer: '136', subject: 'Mathematics', topic: 'Addition' },
    { id: 'm4_02', text: 'What is 8 × 9?', options: ['64', '72', '81', '56'], correctAnswer: '72', subject: 'Mathematics', topic: 'Multiplication' },
    { id: 'm4_03', text: 'What is 56 ÷ 8?', options: ['6', '7', '8', '9'], correctAnswer: '7', subject: 'Mathematics', topic: 'Division' },
    { id: 'm4_04', text: 'What is 1/3 + 1/3?', options: ['1/3', '2/3', '1/6', '2/6'], correctAnswer: '2/3', subject: 'Mathematics', topic: 'Fractions' },
    { id: 'm4_05', text: 'Round 345 to the nearest hundred.', options: ['300', '350', '400', '340'], correctAnswer: '300', subject: 'Mathematics', topic: 'Rounding' },
    { id: 'm4_06', text: 'What is the area of a 5m × 3m rectangle?', options: ['8 m²', '15 m²', '16 m²', '10 m²'], correctAnswer: '15 m²', subject: 'Mathematics', topic: 'Area' },
    { id: 'm4_07', text: 'How many sides does a pentagon have?', options: ['4', '5', '6', '7'], correctAnswer: '5', subject: 'Mathematics', topic: 'Geometry' },
    // Science
    { id: 's4_01', text: 'What is the largest organ in the human body?', options: ['Liver', 'Brain', 'Skin', 'Heart'], correctAnswer: 'Skin', subject: 'Science', topic: 'Human Body' },
    { id: 's4_02', text: 'What gas do plants absorb from the air?', options: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Argon'], correctAnswer: 'Carbon dioxide', subject: 'Science', topic: 'Plants' },
    { id: 's4_03', text: 'What is a food chain?', options: ['A chain made of food', 'Who eats whom in nature', 'A grocery list', 'A cooking recipe'], correctAnswer: 'Who eats whom in nature', subject: 'Science', topic: 'Ecosystems' },
    { id: 's4_04', text: 'What is the closest star to Earth?', options: ['Moon', 'Sun', 'Mars', 'Venus'], correctAnswer: 'Sun', subject: 'Science', topic: 'Astronomy' },
    { id: 's4_05', text: 'What does a thermometer measure?', options: ['Weight', 'Temperature', 'Length', 'Volume'], correctAnswer: 'Temperature', subject: 'Science', topic: 'Measurement' },
    // Filipino
    { id: 'f4_01', text: 'Ano ang pang-abay? "Tumakbo siya nang ___."', options: ['mabilis', 'bata', 'bahay', 'lapis'], correctAnswer: 'mabilis', subject: 'Filipino', topic: 'Pang-abay' },
    { id: 'f4_02', text: 'Alin ang tamang baybay?', options: ['kumustà', 'kamustá', 'kumusta', 'kumustá'], correctAnswer: 'kumusta', subject: 'Filipino', topic: 'Pagbaybay' },
    { id: 'f4_03', text: 'Ano ang ibig sabihin ng "nag-aaral"?', options: ['Naglalaro', 'Natutulog', 'Nag-aaral', 'Kumakain'], correctAnswer: 'Nag-aaral', subject: 'Filipino', topic: 'Pagbasa' },
    { id: 'f4_04', text: '"Ang mga ibon ay lumilipad." Ito ay pangungusap na ___.', options: ['pasalaysay', 'patanong', 'pautos', 'padamdam'], correctAnswer: 'pasalaysay', subject: 'Filipino', topic: 'Uri ng Pangungusap' },
    { id: 'f4_05', text: 'Ano ang kasingkahulugan ng "matapang"?', options: ['Mahina', 'Malakas', 'Duwag', 'Masunurin'], correctAnswer: 'Malakas', subject: 'Filipino', topic: 'Kasingkahulugan' },
    // English
    { id: 'e4_01', text: 'Which is an adverb? "She sings ___."', options: ['sweet', 'sweetly', 'sweetness', 'sweeten'], correctAnswer: 'sweetly', subject: 'English', topic: 'Adverbs' },
    { id: 'e4_02', text: 'What is a prefix in "unhappy"?', options: ['un', 'hap', 'py', 'happy'], correctAnswer: 'un', subject: 'English', topic: 'Prefixes' },
    { id: 'e4_03', text: 'Choose the correct sentence:', options: ['Me and her went home.', 'She and I went home.', 'Her and me went home.', 'I and her went home.'], correctAnswer: 'She and I went home.', subject: 'English', topic: 'Grammar' },
    { id: 'e4_04', text: 'What is the main idea of a paragraph?', options: ['The first sentence', 'What the paragraph is about', 'The last sentence', 'The title'], correctAnswer: 'What the paragraph is about', subject: 'English', topic: 'Reading Comprehension' },
    { id: 'e4_05', text: 'Which word has the same vowel sound as "cake"?', options: ['cat', 'cap', 'rain', 'map'], correctAnswer: 'rain', subject: 'English', topic: 'Phonics' },
    { id: 'e4_06', text: '"They have ___ to the mall already."', options: ['go', 'went', 'gone', 'going'], correctAnswer: 'gone', subject: 'English', topic: 'Verb Tenses' },
  ],

  // ── GRADE 5 ──────────────────────────────────────────────────────────────
  GRADE_5: [
    // Math
    { id: 'm5_01', text: 'What is 12 × 12?', options: ['124', '134', '144', '154'], correctAnswer: '144', subject: 'Mathematics', topic: 'Multiplication' },
    { id: 'm5_02', text: 'What is 0.25 as a fraction?', options: ['1/2', '1/4', '3/4', '1/5'], correctAnswer: '1/4', subject: 'Mathematics', topic: 'Decimals' },
    { id: 'm5_03', text: 'What is 144 ÷ 12?', options: ['10', '11', '12', '13'], correctAnswer: '12', subject: 'Mathematics', topic: 'Division' },
    { id: 'm5_04', text: 'What is 25% of 200?', options: ['25', '40', '50', '75'], correctAnswer: '50', subject: 'Mathematics', topic: 'Percentages' },
    { id: 'm5_05', text: 'What is the greatest common factor of 12 and 18?', options: ['3', '4', '6', '9'], correctAnswer: '6', subject: 'Mathematics', topic: 'Factors' },
    { id: 'm5_06', text: 'What is 5²?', options: ['10', '15', '20', '25'], correctAnswer: '25', subject: 'Mathematics', topic: 'Exponents' },
    // Science
    { id: 's5_01', text: 'What is the function of the lungs?', options: ['Pump blood', 'Breathe air', 'Digest food', 'Think'], correctAnswer: 'Breathe air', subject: 'Science', topic: 'Human Body' },
    { id: 's5_02', text: 'What type of rock is formed from cooled lava?', options: ['Sedimentary', 'Igneous', 'Metamorphic', 'Fossil'], correctAnswer: 'Igneous', subject: 'Science', topic: 'Geology' },
    { id: 's5_03', text: 'What is the chemical symbol for water?', options: ['W', 'Wa', 'H₂O', 'O₂'], correctAnswer: 'H₂O', subject: 'Science', topic: 'Chemistry' },
    { id: 's5_04', text: 'What causes the tides in the ocean?', options: ['Wind', 'The Moon\'s gravity', 'The Sun', 'Earth\'s rotation'], correctAnswer: 'The Moon\'s gravity', subject: 'Science', topic: 'Earth Science' },
    { id: 's5_05', text: 'What is the smallest unit of life?', options: ['Atom', 'Cell', 'Tissue', 'Organ'], correctAnswer: 'Cell', subject: 'Science', topic: 'Biology' },
    // Filipino
    { id: 'f5_01', text: 'Ano ang simuno? "Ang mag-aaral ay nagbabasa ng libro."', options: ['nagbabasa', 'mag-aaral', 'libro', 'ng'], correctAnswer: 'mag-aaral', subject: 'Filipino', topic: 'Simuno at Panaguri' },
    { id: 'f5_02', text: 'Alin ang pangungusap na may tamang gamit ng "nang"?', options: ['Kumain nang marami.', 'Kumain ng marami.', 'Kain nang mabuti.', 'Kain ng mabuti.'], correctAnswer: 'Kumain nang marami.', subject: 'Filipino', topic: 'Gramatika' },
    { id: 'f5_03', text: 'Ano ang ibig sabihin ng idyomang "ilaw ng tahanan"?', options: ['Ilaw sa bahay', 'Ina', 'Ama', 'Anak'], correctAnswer: 'Ina', subject: 'Filipino', topic: 'Idyoma' },
    { id: 'f5_04', text: 'Sino ang pambansang bayani ng Pilipinas?', options: ['Andres Bonifacio', 'Jose Rizal', 'Manuel Quezon', 'Emilio Aguinaldo'], correctAnswer: 'Jose Rizal', subject: 'Filipino', topic: 'Kasaysayan' },
    { id: 'f5_05', text: 'Ano ang tawag sa talata na may simuno at panaguri?', options: ['Salita', 'Parirala', 'Pangungusap', 'Talata'], correctAnswer: 'Pangungusap', subject: 'Filipino', topic: 'Pangungusap' },
    // English
    { id: 'e5_01', text: 'Which sentence uses correct punctuation?', options: ['Where are you going?', 'Where are you going.', 'where are you going?', 'Where are you going'], correctAnswer: 'Where are you going?', subject: 'English', topic: 'Punctuation' },
    { id: 'e5_02', text: 'What is a simile?', options: ['Comparing using "like" or "as"', 'Exaggeration', 'Giving human traits', 'Sound words'], correctAnswer: 'Comparing using "like" or "as"', subject: 'English', topic: 'Figurative Language' },
    { id: 'e5_03', text: 'Which word is a pronoun?', options: ['Table', 'Quickly', 'They', 'Walk'], correctAnswer: 'They', subject: 'English', topic: 'Pronouns' },
    { id: 'e5_04', text: '"It is a very hot day." Change to exclamatory:', options: ['It is hot day?', 'What a hot day it is!', 'It is hot day.', 'Is it a hot day?'], correctAnswer: 'What a hot day it is!', subject: 'English', topic: 'Sentence Types' },
    { id: 'e5_05', text: 'What is the suffix in "happiness"?', options: ['hap', 'ness', 'ha', 'appi'], correctAnswer: 'ness', subject: 'English', topic: 'Suffixes' },
  ],

  // ── GRADE 6 ──────────────────────────────────────────────────────────────
  GRADE_6: [
    // Math
    { id: 'm6_01', text: 'What is 3/4 of 100?', options: ['25', '50', '75', '80'], correctAnswer: '75', subject: 'Mathematics', topic: 'Fractions' },
    { id: 'm6_02', text: 'What is 0.75 as a fraction?', options: ['1/2', '2/3', '3/4', '4/5'], correctAnswer: '3/4', subject: 'Mathematics', topic: 'Decimals' },
    { id: 'm6_03', text: 'Solve: 3x = 15', options: ['3', '4', '5', '6'], correctAnswer: '5', subject: 'Mathematics', topic: 'Algebra' },
    { id: 'm6_04', text: 'What is 2³?', options: ['4', '6', '8', '10'], correctAnswer: '8', subject: 'Mathematics', topic: 'Exponents' },
    { id: 'm6_05', text: 'What is the least common multiple of 4 and 6?', options: ['10', '12', '14', '24'], correctAnswer: '12', subject: 'Mathematics', topic: 'LCM' },
    { id: 'm6_06', text: 'What is the area of a triangle with base 8cm and height 5cm?', options: ['13 cm²', '20 cm²', '40 cm²', '25 cm²'], correctAnswer: '20 cm²', subject: 'Mathematics', topic: 'Area' },
    { id: 'm6_07', text: 'What is 0.6 + 0.34?', options: ['0.64', '0.94', '1.0', '0.84'], correctAnswer: '0.94', subject: 'Mathematics', topic: 'Decimals' },
    // Science
    { id: 's6_01', text: 'How many bones does an adult human have?', options: ['106', '206', '306', '150'], correctAnswer: '206', subject: 'Science', topic: 'Human Body' },
    { id: 's6_02', text: 'What is a fossil?', options: ['A living animal', 'Remains of ancient life', 'A type of rock', 'A mineral'], correctAnswer: 'Remains of ancient life', subject: 'Science', topic: 'Fossils' },
    { id: 's6_03', text: 'What is the function of the circulatory system?', options: ['Digest food', 'Transport blood', 'Breathe air', 'Move muscles'], correctAnswer: 'Transport blood', subject: 'Science', topic: 'Human Body' },
    { id: 's6_04', text: 'What is the chemical formula for carbon dioxide?', options: ['CO', 'CO₂', 'C₂O', 'C'], correctAnswer: 'CO₂', subject: 'Science', topic: 'Chemistry' },
    { id: 's6_05', text: 'Which planet has the most moons?', options: ['Earth', 'Mars', 'Jupiter', 'Saturn'], correctAnswer: 'Saturn', subject: 'Science', topic: 'Solar System' },
    // Filipino
    { id: 'f6_01', text: 'Ano ang panaguri? "Ang bata ay masipag mag-aral."', options: ['Ang bata', 'ay masipag mag-aral', 'masipag', 'mag-aral'], correctAnswer: 'ay masipag mag-aral', subject: 'Filipino', topic: 'Simuno at Panaguri' },
    { id: 'f6_02', text: 'Alin ang halimbawa ng karunungang-bayan?', options: ['Nobela', 'Bugtong', 'Talambuhay', 'Editoryal'], correctAnswer: 'Bugtong', subject: 'Filipino', topic: 'Panitikan' },
    { id: 'f6_03', text: 'Ano ang layunin ng tekstong naratibo?', options: ['Maglahad ng argumento', 'Magsalaysay ng pangyayari', 'Magbigay impormasyon', 'Manghikayat'], correctAnswer: 'Magsalaysay ng pangyayari', subject: 'Filipino', topic: 'Pagbasa' },
    { id: 'f6_04', text: '"Siya ay umalis kahapon." Anong uri ng pang-abay ang "kahapon"?', options: ['Panlunan', 'Pamanahon', 'Pamaraan', 'Pang-agam'], correctAnswer: 'Pamanahon', subject: 'Filipino', topic: 'Pang-abay' },
    // English
    { id: 'e6_01', text: 'What is a metaphor?', options: ['Comparison using like/as', 'Direct comparison', 'Exaggeration', 'Sound word'], correctAnswer: 'Direct comparison', subject: 'English', topic: 'Figurative Language' },
    { id: 'e6_02', text: 'If I ___ rich, I would travel the world.', options: ['am', 'was', 'were', 'be'], correctAnswer: 'were', subject: 'English', topic: 'Conditionals' },
    { id: 'e6_03', text: 'What is the author\'s purpose in a persuasive text?', options: ['To inform', 'To entertain', 'To convince', 'To describe'], correctAnswer: 'To convince', subject: 'English', topic: 'Author\'s Purpose' },
    { id: 'e6_04', text: 'Which is a compound sentence?', options: ['I went home.', 'I went home and ate dinner.', 'Going home.', 'Home.'], correctAnswer: 'I went home and ate dinner.', subject: 'English', topic: 'Sentence Structure' },
    { id: 'e6_05', text: 'What does "biography" mean?', options: ['A book about an animal', 'A story written by oneself', 'A story about someone\'s life', 'A fictional story'], correctAnswer: 'A story about someone\'s life', subject: 'English', topic: 'Genres' },
  ],

  // ── GRADE 7 (JHS) ────────────────────────────────────────────────────────
  GRADE_7: [
    // Math
    { id: 'm7_01', text: 'What is the absolute value of -8?', options: ['-8', '0', '8', '16'], correctAnswer: '8', subject: 'Mathematics', topic: 'Integers' },
    { id: 'm7_02', text: 'Solve: 3x − 7 = 14', options: ['5', '6', '7', '8'], correctAnswer: '7', subject: 'Mathematics', topic: 'Algebra' },
    { id: 'm7_03', text: 'What is the sum of -5 and 9?', options: ['-4', '4', '14', '-14'], correctAnswer: '4', subject: 'Mathematics', topic: 'Integers' },
    { id: 'm7_04', text: 'What is 2/3 × 3/4?', options: ['1/2', '3/7', '5/12', '6/7'], correctAnswer: '1/2', subject: 'Mathematics', topic: 'Fractions' },
    { id: 'm7_05', text: 'What is the square root of 81?', options: ['7', '8', '9', '10'], correctAnswer: '9', subject: 'Mathematics', topic: 'Square Roots' },
    { id: 'm7_06', text: 'Simplify: 2(3x + 4)', options: ['6x+4', '6x+8', '5x+6', '3x+8'], correctAnswer: '6x+8', subject: 'Mathematics', topic: 'Algebra' },
    // Science
    { id: 's7_01', text: 'What is the main source of energy on Earth?', options: ['Moon', 'Sun', 'Stars', 'Geothermal'], correctAnswer: 'Sun', subject: 'Science', topic: 'Energy' },
    { id: 's7_02', text: 'What are the products of photosynthesis?', options: ['Water and oxygen', 'Glucose and oxygen', 'Carbon dioxide and water', 'Glucose and water'], correctAnswer: 'Glucose and oxygen', subject: 'Science', topic: 'Biology' },
    { id: 's7_03', text: 'What is density?', options: ['Mass × volume', 'Mass ÷ volume', 'Volume ÷ mass', 'Mass + volume'], correctAnswer: 'Mass ÷ volume', subject: 'Science', topic: 'Physics' },
    { id: 's7_04', text: 'Which organelle is known as the powerhouse of the cell?', options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi body'], correctAnswer: 'Mitochondria', subject: 'Science', topic: 'Biology' },
    { id: 's7_05', text: 'What is pH of pure water?', options: ['5', '7', '9', '11'], correctAnswer: '7', subject: 'Science', topic: 'Chemistry' },
    // Filipino
    { id: 'f7_01', text: 'Sino ang may-akda ng "Florante at Laura"?', options: ['Jose Rizal', 'Francisco Balagtas', 'Andres Bonifacio', 'Lope K. Santos'], correctAnswer: 'Francisco Balagtas', subject: 'Filipino', topic: 'Panitikan' },
    { id: 'f7_02', text: 'Ano ang tawag sa salitang may dalawang pantig?', options: ['Pang-uri', 'Pandiwa', 'Dalawahing pantig', 'Tambalan'], correctAnswer: 'Dalawahing pantig', subject: 'Filipino', topic: 'Pantig' },
    { id: 'f7_03', text: 'Ano ang ibig sabihin ng "nagpupuyos"?', options: ['Natutulog', 'Nagagalit', 'Nag-aaral', 'Nagdarasal'], correctAnswer: 'Nagagalit', subject: 'Filipino', topic: 'Talasalitaan' },
    { id: 'f7_04', text: 'Alin ang halimbawa ng pangungusap na padamdam?', options: ['Anong gagawin mo?', 'Dunong-dunungan!', 'Pumunta ka rito.', 'Siya ay masaya.'], correctAnswer: 'Dunong-dunungan!', subject: 'Filipino', topic: 'Uri ng Pangungusap' },
    { id: 'f7_05', text: 'Ano ang korido?', options: ['Isang uri ng tula', 'Isang epiko', 'Isang awit na may 8 pantig', 'Isang dula'], correctAnswer: 'Isang awit na may 8 pantig', subject: 'Filipino', topic: 'Panitikan' },
    // English
    { id: 'e7_01', text: 'Identify the type: "Life is a journey."', options: ['Simile', 'Metaphor', 'Personification', 'Hyperbole'], correctAnswer: 'Metaphor', subject: 'English', topic: 'Figurative Language' },
    { id: 'e7_02', text: 'What is the correct form? "Neither the students nor the teacher ___ happy."', options: ['were', 'are', 'was', 'is'], correctAnswer: 'was', subject: 'English', topic: 'Subject-Verb Agreement' },
    { id: 'e7_03', text: 'What is an epic poem?', options: ['A short poem', 'A long narrative about a hero', 'A love story', 'A humorous poem'], correctAnswer: 'A long narrative about a hero', subject: 'English', topic: 'Literary Genres' },
    { id: 'e7_04', text: 'Which is correct? "She ___ to school every day."', options: ['walk', 'walks', 'walked', 'walking'], correctAnswer: 'walks', subject: 'English', topic: 'Verb Tenses' },
    { id: 'e7_05', text: 'What is a research report?', options: ['A fictional story', 'An informative paper with evidence', 'A personal diary', 'A poem'], correctAnswer: 'An informative paper with evidence', subject: 'English', topic: 'Writing' },
  ],

  // ── GRADE 8 (JHS) ────────────────────────────────────────────────────────
  GRADE_8: [
    // Math
    { id: 'm8_01', text: 'What is the slope of y = 2x + 3?', options: ['2', '3', '−2', '−3'], correctAnswer: '2', subject: 'Mathematics', topic: 'Linear Equations' },
    { id: 'm8_02', text: 'Solve: x² − 25 = 0', options: ['x=5', 'x=±5', 'x=25', 'x=±25'], correctAnswer: 'x=±5', subject: 'Mathematics', topic: 'Quadratic Equations' },
    { id: 'm8_03', text: 'What is the product of (x+3)(x−2)?', options: ['x²+5x−6', 'x²+x−6', 'x²−x−6', 'x²+5x+6'], correctAnswer: 'x²+x−6', subject: 'Mathematics', topic: 'Algebra' },
    { id: 'm8_04', text: 'What is the y-intercept of y = 3x − 5?', options: ['3', '−5', '5', '−3'], correctAnswer: '−5', subject: 'Mathematics', topic: 'Linear Equations' },
    { id: 'm8_05', text: 'What is the mean of: 6, 10, 8, 12, 4?', options: ['6', '8', '10', '7'], correctAnswer: '8', subject: 'Mathematics', topic: 'Statistics' },
    { id: 'm8_06', text: 'Simplify: (2²)³', options: ['2⁵', '2⁶', '2⁸', '2⁹'], correctAnswer: '2⁶', subject: 'Mathematics', topic: 'Exponents' },
    // Science
    { id: 's8_01', text: 'What is Newton\'s First Law of Motion?', options: ['F=ma', 'Objects at rest stay at rest', 'Action-reaction', 'Energy conservation'], correctAnswer: 'Objects at rest stay at rest', subject: 'Science', topic: 'Physics' },
    { id: 's8_02', text: 'What are the parts of the digestive system?', options: ['Heart and lungs', 'Stomach and intestines', 'Brain and spine', 'Muscles and bones'], correctAnswer: 'Stomach and intestines', subject: 'Science', topic: 'Human Body' },
    { id: 's8_03', text: 'What is the difference between weather and climate?', options: ['They are the same', 'Weather is short-term, climate is long-term', 'Climate is daily, weather is yearly', 'Weather is global, climate is local'], correctAnswer: 'Weather is short-term, climate is long-term', subject: 'Science', topic: 'Earth Science' },
    { id: 's8_04', text: 'What is a chemical change?', options: ['Melting ice', 'Burning wood', 'Breaking glass', 'Cutting paper'], correctAnswer: 'Burning wood', subject: 'Science', topic: 'Chemistry' },
    { id: 's8_05', text: 'What is the atomic number of oxygen?', options: ['6', '8', '10', '12'], correctAnswer: '8', subject: 'Science', topic: 'Chemistry' },
    // Filipino
    { id: 'f8_01', text: 'Ano ang bunga ng pagiging makabayan?', options: ['Pag-ego', 'Pagmamahal sa bayan', 'Pagiging sikat', 'Pagiging mayaman'], correctAnswer: 'Pagmamahal sa bayan', subject: 'Filipino', topic: 'Pagbasa' },
    { id: 'f8_02', text: 'Ano ang tekstong persuweysib?', options: ['Nagsasalaysay', 'Nanghihikayat', 'Naglalarawan', 'Nangangatwiran'], correctAnswer: 'Nanghihikayat', subject: 'Filipino', topic: 'Uri ng Teksto' },
    { id: 'f8_03', text: 'Alin ang tamang pagkakasunud-sunod ng pangyayari sa alamat?', options: ['Wakas, Simula, Gitna', 'Simula, Gitna, Wakas', 'Gitna, Simula, Wakas', 'Wakas, Gitna, Simula'], correctAnswer: 'Simula, Gitna, Wakas', subject: 'Filipino', topic: 'Alamat' },
    { id: 'f8_04', text: 'Ano ang ibig sabihin ng "nagpanggap"?', options: ['Tumulong', 'Nagkunwari', 'Umalis', 'Dumating'], correctAnswer: 'Nagkunwari', subject: 'Filipino', topic: 'Talasalitaan' },
    // English
    { id: 'e8_01', text: 'Which is a complex sentence?', options: ['I went home.', 'I went home and ate.', 'I went home because I was tired.', 'Home.'], correctAnswer: 'I went home because I was tired.', subject: 'English', topic: 'Sentence Structure' },
    { id: 'e8_02', text: 'What is a flashback in literature?', options: ['A fast scene', 'A scene from the past', 'A future scene', 'An action scene'], correctAnswer: 'A scene from the past', subject: 'English', topic: 'Literary Devices' },
    { id: 'e8_03', text: 'Identify the voice: "The letter was written by Maria."', options: ['Active', 'Passive', 'Past', 'Future'], correctAnswer: 'Passive', subject: 'English', topic: 'Voice' },
    { id: 'e8_04', text: 'What is the correct spelling?', options: ['accomodate', 'accommodate', 'acommodate', 'acomodate'], correctAnswer: 'accommodate', subject: 'English', topic: 'Spelling' },
    { id: 'e8_05', text: 'What is a bibliography?', options: ['A biography', 'List of sources used', 'A book about the Bible', 'A timeline'], correctAnswer: 'List of sources used', subject: 'English', topic: 'Research' },
  ],

  // ── GRADE 9 (JHS) ────────────────────────────────────────────────────────
  GRADE_9: [
    // Math
    { id: 'm9_01', text: 'What is the quadratic formula?', options: ['x = (-b ± √(b²-4ac))/2a', 'x = (b ± √(b²-4ac))/2a', 'x = (-b ± √(b²+4ac))/2a', 'x = (-b ± √(4ac-b²))/2a'], correctAnswer: 'x = (-b ± √(b²-4ac))/2a', subject: 'Mathematics', topic: 'Quadratic Equations' },
    { id: 'm9_02', text: 'Solve: 2x² = 50', options: ['x=5', 'x=±5', 'x=±√5', 'x=25'], correctAnswer: 'x=±5', subject: 'Mathematics', topic: 'Quadratic Equations' },
    { id: 'm9_03', text: 'What is √75 simplified?', options: ['5√3', '3√5', '5√2', '3√3'], correctAnswer: '5√3', subject: 'Mathematics', topic: 'Radicals' },
    { id: 'm9_04', text: 'What is the sum of interior angles of a triangle?', options: ['90°', '180°', '270°', '360°'], correctAnswer: '180°', subject: 'Mathematics', topic: 'Geometry' },
    { id: 'm9_05', text: 'If P = 2l + 2w, solve for w when P=20 and l=6', options: ['3', '4', '5', '6'], correctAnswer: '4', subject: 'Mathematics', topic: 'Formulas' },
    { id: 'm9_06', text: 'What is the probability of rolling a 3 on a fair die?', options: ['1/2', '1/3', '1/6', '1/4'], correctAnswer: '1/6', subject: 'Mathematics', topic: 'Probability' },
    // Science
    { id: 's9_01', text: 'What is the first law of thermodynamics?', options: ['Energy cannot be created or destroyed', 'Entropy increases', 'Heat flows hot to cold', 'Energy equals mass times speed'], correctAnswer: 'Energy cannot be created or destroyed', subject: 'Science', topic: 'Physics' },
    { id: 's9_02', text: 'What is the electron configuration of carbon?', options: ['1s²2s²', '1s²2s²2p²', '1s²2s²2p⁴', '1s²2p²'], correctAnswer: '1s²2s²2p²', subject: 'Science', topic: 'Chemistry' },
    { id: 's9_03', text: 'What is the function of the nervous system?', options: ['Digestion', 'Transport of signals', 'Circulation', 'Movement'], correctAnswer: 'Transport of signals', subject: 'Science', topic: 'Biology' },
    { id: 's9_04', text: 'What type of bond shares electrons?', options: ['Ionic', 'Covalent', 'Metallic', 'Hydrogen'], correctAnswer: 'Covalent', subject: 'Science', topic: 'Chemistry' },
    // Filipino
    { id: 'f9_01', text: 'Ano ang pangunahing paksa ng "Noli Me Tangere"?', options: ['Pag-ibig', 'Katiwalian sa lipunan', 'Pamilya', 'Kalikasan'], correctAnswer: 'Katiwalian sa lipunan', subject: 'Filipino', topic: 'Panitikan' },
    { id: 'f9_02', text: 'Sino ang pangunahing tauhan sa "Florante at Laura"?', options: ['Laura', 'Florante', 'Adolfo', 'Menandro'], correctAnswer: 'Florante', subject: 'Filipino', topic: 'Panitikan' },
    { id: 'f9_03', text: 'Alin ang uri ng tula na may 7 pantig bawat taludtod?', options: ['Soneto', 'Haiku', 'Tanaga', 'Oda'], correctAnswer: 'Tanaga', subject: 'Filipino', topic: 'Panitikan' },
    { id: 'f9_04', text: 'Ano ang ibig sabihin ng "mapagkumbaba"?', options: ['Mayabang', 'Mapagpanggap', 'Mababa ang loob', 'Masungit'], correctAnswer: 'Mababa ang loob', subject: 'Filipino', topic: 'Talasalitaan' },
    // English
    { id: 'e9_01', text: 'Identify: "The wind whispered through the trees."', options: ['Simile', 'Metaphor', 'Personification', 'Hyperbole'], correctAnswer: 'Personification', subject: 'English', topic: 'Figurative Language' },
    { id: 'e9_02', text: 'What is the theme of a story?', options: ['The main character', 'The central message', 'The setting', 'The plot'], correctAnswer: 'The central message', subject: 'English', topic: 'Literary Analysis' },
    { id: 'e9_03', text: '"I wish I ___ there."', options: ['am', 'was', 'were', 'be'], correctAnswer: 'were', subject: 'English', topic: 'Subjunctive' },
    { id: 'e9_04', text: 'What is an oxymoron?', options: ['Two opposite words together', 'Exaggeration', 'Comparing two things', 'Sound repetition'], correctAnswer: 'Two opposite words together', subject: 'English', topic: 'Figurative Language' },
    { id: 'e9_05', text: 'What is a thesis statement?', options: ['A question', 'The main argument of an essay', 'A conclusion', 'An introduction'], correctAnswer: 'The main argument of an essay', subject: 'English', topic: 'Writing' },
  ],

  // ── GRADE 10 (JHS) ───────────────────────────────────────────────────────
  GRADE_10: [
    // Math
    { id: 'm10_01', text: 'What is sin(30°)?', options: ['0', '0.5', '1', '√3/2'], correctAnswer: '0.5', subject: 'Mathematics', topic: 'Trigonometry' },
    { id: 'm10_02', text: 'What is the center of a circle?', options: ['The radius', 'The midpoint', 'The diameter', 'The circumference'], correctAnswer: 'The midpoint', subject: 'Mathematics', topic: 'Geometry' },
    { id: 'm10_03', text: 'Solve the system: x + y = 7, x − y = 3. What is x?', options: ['4', '5', '6', '7'], correctAnswer: '5', subject: 'Mathematics', topic: 'Systems of Equations' },
    { id: 'm10_04', text: 'What is the distance formula?', options: ['d = √((x₂−x₁)²+(y₂−y₁)²)', 'd = (x₂−x₁)+(y₂−y₁)', 'd = √(x²+y²)', 'd = |x₂−x₁|+|y₂−y₁|'], correctAnswer: 'd = √((x₂−x₁)²+(y₂−y₁)²)', subject: 'Mathematics', topic: 'Coordinate Geometry' },
    { id: 'm10_05', text: 'What is the median of: 3, 7, 5, 9, 2?', options: ['3', '5', '6', '7'], correctAnswer: '5', subject: 'Mathematics', topic: 'Statistics' },
    { id: 'm10_06', text: 'Factor: x² − 6x + 9', options: ['(x−3)²', '(x+3)²', '(x−3)(x+3)', '(x−9)(x−1)'], correctAnswer: '(x−3)²', subject: 'Mathematics', topic: 'Factoring' },
    // Science
    { id: 's10_01', text: 'What is the speed of light?', options: ['3×10⁸ m/s', '3×10⁶ m/s', '3×10⁷ m/s', '3×10⁹ m/s'], correctAnswer: '3×10⁸ m/s', subject: 'Science', topic: 'Physics' },
    { id: 's10_02', text: 'What is the theory of evolution by natural selection?', options: ['Lamarck\'s theory', 'Darwin\'s theory', 'Mendel\'s theory', 'Einstein\'s theory'], correctAnswer: 'Darwin\'s theory', subject: 'Science', topic: 'Biology' },
    { id: 's10_03', text: 'What is a gene?', options: ['A chromosome', 'A segment of DNA', 'A protein', 'A cell'], correctAnswer: 'A segment of DNA', subject: 'Science', topic: 'Biology' },
    { id: 's10_04', text: 'What is Ohm\'s Law?', options: ['V = IR', 'F = ma', 'E = mc²', 'PV = nRT'], correctAnswer: 'V = IR', subject: 'Science', topic: 'Physics' },
    // Filipino
    { id: 'f10_01', text: 'Sino ang sumulat ng "El Filibusterismo"?', options: ['Francisco Balagtas', 'Jose Rizal', 'Andres Bonifacio', 'Lope K. Santos'], correctAnswer: 'Jose Rizal', subject: 'Filipino', topic: 'Panitikan' },
    { id: 'f10_02', text: 'Ano ang paralelismo?', options: ['Paggamit ng parehong estruktura', 'Paghahambing ng dalawa', 'Pagsalungat ng ideya', 'Pag-ulit ng salita'], correctAnswer: 'Paggamit ng parehong estruktura', subject: 'Filipino', topic: 'Gramatika' },
    { id: 'f10_03', text: 'Ano ang tekstong naratibo?', options: ['Nagpapaliwanag', 'Nagsasalaysay', 'Nanghihikayat', 'Naglalarawan'], correctAnswer: 'Nagsasalaysay', subject: 'Filipino', topic: 'Uri ng Teksto' },
    { id: 'f10_04', text: 'Alin ang tamang anyo ng pandiwa? "Siya ay ___ ng pagkain."', options: ['nagluluto', 'luto', 'magluto', 'nakapagluto'], correctAnswer: 'nagluluto', subject: 'Filipino', topic: 'Pandiwa' },
    // English
    { id: 'e10_01', text: 'What is dramatic irony?', options: ['When the audience knows more than characters', 'When characters argue', 'A funny scene', 'A sad ending'], correctAnswer: 'When the audience knows more than characters', subject: 'English', topic: 'Literary Devices' },
    { id: 'e10_02', text: 'Identify the mood: "The dark forest was silent and eerie."', options: ['Happy', 'Scary', 'Romantic', 'Excited'], correctAnswer: 'Scary', subject: 'English', topic: 'Mood and Tone' },
    { id: 'e10_03', text: 'What is a primary source?', options: ['A history book', 'A firsthand account', 'An encyclopedia', 'A textbook'], correctAnswer: 'A firsthand account', subject: 'English', topic: 'Research' },
    { id: 'e10_04', text: 'Which is correct? "Everyone ___ their own opinion."', options: ['have', 'has', 'having', 'had'], correctAnswer: 'has', subject: 'English', topic: 'Subject-Verb Agreement' },
  ],

  // ── GRADE 11 (SHS) ───────────────────────────────────────────────────────
  GRADE_11: [
    // Math
    { id: 'm11_01', text: 'What is the limit of f(x) = x² as x approaches 2?', options: ['2', '4', '0', '∞'], correctAnswer: '4', subject: 'Mathematics', topic: 'Calculus' },
    { id: 'm11_02', text: 'What is the derivative of x³?', options: ['x²', '3x²', '3x', 'x³/3'], correctAnswer: '3x²', subject: 'Mathematics', topic: 'Calculus' },
    { id: 'm11_03', text: 'What is the probability of getting exactly 2 heads in 3 coin flips?', options: ['1/8', '3/8', '1/2', '1/4'], correctAnswer: '3/8', subject: 'Mathematics', topic: 'Probability' },
    { id: 'm11_04', text: 'What is the standard deviation of: 2, 4, 6?', options: ['√(8/3)', '√3', '2', '8/3'], correctAnswer: '√(8/3)', subject: 'Mathematics', topic: 'Statistics' },
    { id: 'm11_05', text: 'What is ∫ 2x dx?', options: ['x²+C', '2x²+C', 'x²/2+C', '2x+C'], correctAnswer: 'x²+C', subject: 'Mathematics', topic: 'Calculus' },
    // Science
    { id: 's11_01', text: 'What is entropy?', options: ['A measure of disorder', 'Energy content', 'Temperature', 'Pressure'], correctAnswer: 'A measure of disorder', subject: 'Science', topic: 'Physics' },
    { id: 's11_02', text: 'What is a redox reaction?', options: ['Acid-base reaction', 'Transfer of electrons', 'Release of gas', 'Formation of precipitate'], correctAnswer: 'Transfer of electrons', subject: 'Science', topic: 'Chemistry' },
    { id: 's11_03', text: 'What is the structure of DNA?', options: ['Single helix', 'Double helix', 'Triple helix', 'Circular'], correctAnswer: 'Double helix', subject: 'Science', topic: 'Biology' },
    { id: 's11_04', text: 'What is the Schrödinger equation used for?', options: ['Describing motion', 'Describing quantum particles', 'Describing heat flow', 'Describing electricity'], correctAnswer: 'Describing quantum particles', subject: 'Science', topic: 'Physics' },
    // Filipino
    { id: 'f11_01', text: 'Ano ang teoryang pampanitikan na nagbibigay-diin sa anyo ng akda?', options: ['Realismo', 'Pormalismo', 'Naturalismo', 'Eksistensyalismo'], correctAnswer: 'Pormalismo', subject: 'Filipino', topic: 'Panitikan' },
    { id: 'f11_02', text: 'Sino ang itinuturing na "Ama ng Wikang Pambansa"?', options: ['Jose Rizal', 'Manuel L. Quezon', 'Andres Bonifacio', 'Carlos P. Romulo'], correctAnswer: 'Manuel L. Quezon', subject: 'Filipino', topic: 'Kasaysayan' },
    { id: 'f11_03', text: 'Ano ang pananaliksik?', options: ['Pagsulat ng kuwento', 'Sistematikong pag-aaral', 'Pagpinta ng larawan', 'Pag-awit ng kanta'], correctAnswer: 'Sistematikong pag-aaral', subject: 'Filipino', topic: 'Pananaliksik' },
    // English
    { id: 'e11_01', text: 'What is a fallacy?', options: ['A correct argument', 'A flawed argument', 'A conclusion', 'A premise'], correctAnswer: 'A flawed argument', subject: 'English', topic: 'Logic' },
    { id: 'e11_02', text: 'What is stream of consciousness?', options: ['A river metaphor', 'Narrative that captures thoughts', 'A type of poem', 'A speech pattern'], correctAnswer: 'Narrative that captures thoughts', subject: 'English', topic: 'Literary Techniques' },
    { id: 'e11_03', text: 'What is a critique paper?', options: ['A summary', 'An evaluation of a work', 'A creative story', 'A biography'], correctAnswer: 'An evaluation of a work', subject: 'English', topic: 'Academic Writing' },
    { id: 'e11_04', text: 'What is the difference between denotation and connotation?', options: ['They are the same', 'Literal vs implied meaning', 'Denotation is harder', 'Connotation is shorter'], correctAnswer: 'Literal vs implied meaning', subject: 'English', topic: 'Semantics' },
  ],

  // ── GRADE 12 (SHS) ───────────────────────────────────────────────────────
  GRADE_12: [
    // Math
    { id: 'm12_01', text: 'What is the derivative of sin(x)?', options: ['cos(x)', '−cos(x)', '−sin(x)', 'tan(x)'], correctAnswer: 'cos(x)', subject: 'Mathematics', topic: 'Calculus' },
    { id: 'm12_02', text: 'What is ∫ sin(x) dx?', options: ['cos(x)+C', '−cos(x)+C', '−sin(x)+C', 'tan(x)+C'], correctAnswer: '−cos(x)+C', subject: 'Mathematics', topic: 'Calculus' },
    { id: 'm12_03', text: 'What is the expected value of a fair die?', options: ['3', '3.5', '4', '2.5'], correctAnswer: '3.5', subject: 'Mathematics', topic: 'Statistics' },
    { id: 'm12_04', text: 'What is the correlation coefficient range?', options: ['0 to 1', '−1 to 1', '−∞ to ∞', '0 to 100'], correctAnswer: '−1 to 1', subject: 'Mathematics', topic: 'Statistics' },
    { id: 'm12_05', text: 'Solve: log₂(8) = ?', options: ['2', '3', '4', '8'], correctAnswer: '3', subject: 'Mathematics', topic: 'Logarithms' },
    // Science
    { id: 's12_01', text: 'What is special relativity?', options: ['Newton\'s laws', 'Einstein\'s theory of space-time', 'Quantum theory', 'Atomic theory'], correctAnswer: 'Einstein\'s theory of space-time', subject: 'Science', topic: 'Physics' },
    { id: 's12_02', text: 'What is the Krebs cycle?', options: ['A photosynthesis stage', 'A cellular respiration stage', 'A muscle contraction', 'A digestion process'], correctAnswer: 'A cellular respiration stage', subject: 'Science', topic: 'Biology' },
    { id: 's12_03', text: 'What are isotopes?', options: ['Atoms with different electrons', 'Atoms with different neutrons', 'Atoms with different protons', 'Different elements'], correctAnswer: 'Atoms with different neutrons', subject: 'Science', topic: 'Chemistry' },
    // Filipino
    { id: 'f12_01', text: 'Ano ang sintesis?', options: ['Paghihiwalay ng ideya', 'Pagsasama ng iba\'t ibang impormasyon', 'Pagpuna ng teksto', 'Pagbabalangkas'], correctAnswer: 'Pagsasama ng iba\'t ibang impormasyon', subject: 'Filipino', topic: 'Pagbasa' },
    { id: 'f12_02', text: 'Ano ang abstrak ng pananaliksik?', options: ['Buong papel', 'Maikling buod', 'Konklusyon', 'Introduksyon'], correctAnswer: 'Maikling buod', subject: 'Filipino', topic: 'Pananaliksik' },
    { id: 'f12_03', text: 'Alin ang tamang paggamit ng mga bantas sa bibliyograpiya?', options: ['May punto sa dulo', 'May kuwit sa pagitan', 'May tuldok at kuwit', 'Walang bantas'], correctAnswer: 'May tuldok at kuwit', subject: 'Filipino', topic: 'Pagsulat' },
    // English
    { id: 'e12_01', text: 'What is deconstruction in literary criticism?', options: ['Building a story', 'Analyzing contradictions in texts', 'Writing a review', 'Summarizing a plot'], correctAnswer: 'Analyzing contradictions in texts', subject: 'English', topic: 'Literary Criticism' },
    { id: 'e12_02', text: 'What is a position paper?', options: ['A personal story', 'An argument on an issue', 'A research report', 'A creative essay'], correctAnswer: 'An argument on an issue', subject: 'English', topic: 'Academic Writing' },
    { id: 'e12_03', text: 'What is intertextuality?', options: ['Writing in text', 'Connection between texts', 'Internet texting', 'Reading between lines'], correctAnswer: 'Connection between texts', subject: 'English', topic: 'Literary Theory' },
    { id: 'e12_04', text: 'Identify: "She sells seashells by the seashore."', options: ['Metaphor', 'Alliteration', 'Simile', 'Personification'], correctAnswer: 'Alliteration', subject: 'English', topic: 'Sound Devices' },
  ],
};

// Helper to get all grade keys
export const GRADE_KEYS = Object.keys(QUESTIONS);

// Get grade label from key
export function getGradeLabel(gradeKey: string): string {
  const labels: Record<string, string> = {
    GRADE_1: 'Grade 1',
    GRADE_2: 'Grade 2',
    GRADE_3: 'Grade 3',
    GRADE_4: 'Grade 4',
    GRADE_5: 'Grade 5',
    GRADE_6: 'Grade 6',
    GRADE_7: 'Grade 7',
    GRADE_8: 'Grade 8',
    GRADE_9: 'Grade 9',
    GRADE_10: 'Grade 10',
    GRADE_11: 'Grade 11',
    GRADE_12: 'Grade 12',
  };
  return labels[gradeKey] ?? gradeKey;
}

// Get the school level for a grade
export function getSchoolLevel(gradeKey: string): string {
  const gradeNum = parseInt(gradeKey.replace('GRADE_', ''));
  if (gradeNum <= 6) return 'ELEMENTARY';
  if (gradeNum <= 10) return 'JUNIOR_HIGH';
  return 'SENIOR_HIGH';
}

// Grade groups for display
export const GRADE_GROUPS = [
  { label: 'Elementary (Grades 1-3)', grades: ['GRADE_1', 'GRADE_2', 'GRADE_3'] },
  { label: 'Elementary (Grades 4-6)', grades: ['GRADE_4', 'GRADE_5', 'GRADE_6'] },
  { label: 'Junior High School (Grades 7-10)', grades: ['GRADE_7', 'GRADE_8', 'GRADE_9', 'GRADE_10'] },
  { label: 'Senior High School (Grades 11-12)', grades: ['GRADE_11', 'GRADE_12'] },
];