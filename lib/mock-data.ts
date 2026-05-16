export interface Tutor {
    id: string;
    name: string;
    headline: string;
    subjects: string[];
    rating: number;
    price: number;
    image: string;
    bio: string;
    level: 'ELEMENTARY' | 'HIGH_SCHOOL' | 'BOTH';
}

export const MOCK_TUTORS: Tutor[] = [
    {
        id: 't1',
        name: 'Dr. Aris Smith',
        headline: 'Mathematics & Science Specialist',
        subjects: ['Mathematics', 'Science'],
        rating: 4.9,
        price: 25,
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aris',
        bio: 'Over 10 years of experience in teaching mathematics and science.',
        level: 'HIGH_SCHOOL'
    },
    {
        id: 't2',
        name: 'Prof. Maria Clara',
        headline: 'Science & English Expert',
        subjects: ['Science', 'English'],
        rating: 4.8,
        price: 20,
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
        bio: 'Making science and language learning fun for all students.',
        level: 'ELEMENTARY'
    },
    {
        id: 't3',
        name: 'Ms. Lea Salonga',
        headline: 'English & Filipino Coach',
        subjects: ['English', 'Filipino'],
        rating: 5.0,
        price: 22,
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lea',
        bio: 'Helping students find their voice through the power of language.',
        level: 'BOTH'
    }
];
