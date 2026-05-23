export interface Source {
  title: string;
  page?: number;
  relevance?: number;
  excerpt?: string;
}

export interface Flashcard {
  id: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  answer: string;
  hint: string;
  example: string;
  source: string;
  importance: 'High' | 'Medium' | 'Low';
}

export interface Deck {
  id: string;
  title: string;
  cards: number;
  mastered: number;
  active?: boolean;
  color: string;
}

export const mockDecks: Deck[] = [
  {
    id: '1',
    title: 'Physics — Wave Mechanics',
    cards: 5,
    mastered: 3,
    active: true,
    color: 'bg-brand-light text-brand-dark',
  },
  {
    id: '2',
    title: 'Organic Chemistry',
    cards: 3,
    mastered: 1,
    color: 'bg-mint-light text-mint-dark',
  },
  {
    id: '3',
    title: 'Calculus Formulas',
    cards: 3,
    mastered: 0,
    color: 'bg-cream-light text-cream-dark',
  },
  {
    id: '4',
    title: 'Biology Definitions',
    cards: 3,
    mastered: 2,
    color: 'bg-blush-light text-blush-dark',
  },
];

export const mockFlashcards: Flashcard[] = [
  {
    id: '1',
    topic: 'Interference',
    difficulty: 'easy',
    question: 'What is constructive interference?',
    answer: 'Constructive interference occurs when two waves meet in phase (crests align with crests and troughs with troughs), combining to create a wave with a larger resultant amplitude.',
    hint: 'Think about what happens when two wave peaks combine positively.',
    example: 'Two synchronized loudspeaker sound waves overlapping to produce a louder volume in a room.',
    source: 'Physics_Chapter3.pdf',
    importance: 'High',
  },
  {
    id: '2',
    topic: 'Diffraction',
    difficulty: 'medium',
    question: 'Why does diffraction occur?',
    answer: 'Diffraction occurs because waves spread out when they bend around the edge of an obstacle or pass through a narrow opening comparable in size to their wavelength.',
    hint: 'It happens when waves encounter edges or small apertures.',
    example: 'Water waves spreading out in a semicircular pattern after passing through a harbor gap.',
    source: 'Lecture_Notes.docx',
    importance: 'Medium',
  },
  {
    id: '3',
    topic: 'Wave Equation',
    difficulty: 'hard',
    question: 'What is the mathematical equation of a traveling wave?',
    answer: 'A traveling wave is represented by y(x,t) = A sin(kx - ωt + φ), where A is the wave amplitude, k is the wave number (2π/λ), ω is the angular frequency (2πf), and φ is the phase constant.',
    hint: 'Include phase angle and independent variables for position and time.',
    example: 'A transverse wave traveling down a taut string under tension.',
    source: 'Physics_Chapter3.pdf',
    importance: 'High',
  },
  {
    id: '4',
    topic: 'Frequency',
    difficulty: 'easy',
    question: 'What is frequency in wave mechanics?',
    answer: 'Frequency is the number of complete wave cycles or oscillations that pass a fixed point per unit of time, typically measured in Hertz (Hz) where 1 Hz = 1 cycle per second.',
    hint: 'It is the mathematical reciprocal of the wave period (T).',
    example: 'A sound wave at 440 Hz (standard concert A note) oscillating back and forth 440 times per second.',
    source: 'Lecture_Notes.docx',
    importance: 'Low',
  },
  {
    id: '5',
    topic: 'Applications',
    difficulty: 'medium',
    question: 'How do active noise-cancelling headphones work?',
    answer: 'They use active noise control by utilizing a microphone to capture ambient sounds, and then generate an "anti-noise" wave that is 180° out of phase (opposite amplitude) to cancel the noise via destructive interference.',
    hint: 'Think of phase inversion and destructive wave combination.',
    example: 'A headphone microphone capturing plane cabin hum and generating an inverted acoustic wave to neutralize it.',
    source: 'Applications_Manual.pdf',
    importance: 'High',
  },
];

export const chemistryFlashcards: Flashcard[] = [
  {
    id: 'chem-1',
    topic: 'Carbon Bonding',
    difficulty: 'easy',
    question: 'Why is carbon capable of forming a vast array of compounds?',
    answer: 'Carbon has four valence electrons, allowing it to form stable covalent bonds (single, double, or triple) with other carbon atoms and elements like hydrogen, oxygen, and nitrogen.',
    hint: 'Think of valence shell electrons and bonding capacity.',
    example: 'Carbon forming stable tetrahedral chains in alkanes like methane and ethane.',
    source: 'Chem_Lec1_Chiral.pdf',
    importance: 'High',
  },
  {
    id: 'chem-2',
    topic: 'Functional Groups',
    difficulty: 'medium',
    question: 'What is the functional group of an alcohol?',
    answer: 'An alcohol functional group consists of a hydroxyl group (-OH) covalently bonded to a saturated carbon atom.',
    hint: 'It contains an oxygen and a hydrogen atom.',
    example: 'Ethanol (C2H5OH), which is used as a solvent and disinfectant.',
    source: 'Organic_Basics.docx',
    importance: 'Medium',
  },
  {
    id: 'chem-3',
    topic: 'Isomerism',
    difficulty: 'hard',
    question: 'What are enantiomers?',
    answer: 'Enantiomers are a pair of chiral molecules that are non-superimposable mirror images of each other, sharing identical physical properties except for optical activity.',
    hint: 'Think about left and right hands.',
    example: 'L-alanine and D-alanine (amino acids with identical formulas but different optical activities).',
    source: 'Organic_Basics.docx',
    importance: 'High',
  },
];

export const calculusFlashcards: Flashcard[] = [
  {
    id: 'calc-1',
    topic: 'Limits',
    difficulty: 'easy',
    question: 'What is the definition of a limit?',
    answer: 'The limit of a function f(x) as x approaches a value c is the value L that f(x) gets closer to as x gets infinitely close to c from both sides.',
    hint: 'It describes behavior near a point, not necessarily at the point itself.',
    example: 'The limit of (x^2 - 1)/(x - 1) as x approaches 1 is 2.',
    source: 'Calculus_Syllabus.pdf',
    importance: 'Medium',
  },
  {
    id: 'calc-2',
    topic: 'Derivatives',
    difficulty: 'medium',
    question: 'State the Chain Rule for differentiation.',
    answer: 'The chain rule is used to differentiate composite functions. If y = f(g(x)), then dy/dx = f\'(g(x)) * g\'(x).',
    hint: 'Differentiate the outer function first, then multiply by the derivative of the inner function.',
    example: 'Differentiating sin(x^2) yields cos(x^2) * 2x.',
    source: 'Calculus_Formula_Sheet.pdf',
    importance: 'High',
  },
  {
    id: 'calc-3',
    topic: 'Integrals',
    difficulty: 'hard',
    question: 'What is the Fundamental Theorem of Calculus?',
    answer: 'It connects differentiation and integration. Part 1 states that the derivative of an integral is the original function. Part 2 states that the definite integral of f(x) from a to b is F(b) - F(a), where F is the antiderivative.',
    hint: 'It shows that differentiation and integration are inverse operations.',
    example: 'Integrating x from 0 to 2 equals [x^2/2] evaluated from 0 to 2, which is 2.',
    source: 'Calculus_Formula_Sheet.pdf',
    importance: 'High',
  },
];

export const biologyFlashcards: Flashcard[] = [
  {
    id: 'bio-1',
    topic: 'Cell Structure',
    difficulty: 'easy',
    question: 'What is the function of the mitochondria?',
    answer: 'Mitochondria are the powerhouses of the cell, responsible for aerobic cellular respiration which generates adenosine triphosphate (ATP) as a chemical energy source.',
    hint: 'Think of ATP production and energy.',
    example: 'Muscle cells contain a high density of mitochondria to supply energy for constant contractions.',
    source: 'Bio_Lecture1.docx',
    importance: 'High',
  },
  {
    id: 'bio-2',
    topic: 'Cell Division',
    difficulty: 'medium',
    question: 'What happens during Metaphase in mitosis?',
    answer: 'During metaphase, the cell\'s chromosomes align along the equatorial plane (metaphase plate) of the cell, and spindle fibers attach to the kinetochore of each chromosome.',
    hint: 'M stands for Middle.',
    example: 'Spindle fibers pulling sister chromatids to line up perfectly down the middle of the cell before splitting.',
    source: 'Bio_Lecture1.docx',
    importance: 'Medium',
  },
  {
    id: 'bio-3',
    topic: 'Genetics',
    difficulty: 'hard',
    question: 'What is transcription in DNA expression?',
    answer: 'Transcription is the process by which the DNA sequence of a gene is copied into a complementary messenger RNA (mRNA) strand by the enzyme RNA polymerase.',
    hint: 'It occurs in the nucleus before translation.',
    example: 'RNA polymerase binding to DNA promoter and synthesizing an mRNA strand that matches the template strand.',
    source: 'Genetics_Review.pdf',
    importance: 'High',
  },
];

export function getFlashcardsForDeck(deckId: string): Flashcard[] {
  switch (deckId) {
    case '1':
      return mockFlashcards;
    case '2':
      return chemistryFlashcards;
    case '3':
      return calculusFlashcards;
    case '4':
      return biologyFlashcards;
    default:
      return [];
  }
}
