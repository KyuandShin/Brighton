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
        headline: 'Mathematics & Physics Specialist',
        subjects: ['Algebra', 'Calculus', 'Physics'],
        rating: 4.9,
        price: 25,
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aris',
        bio: 'Over 10 years of experience in teaching advanced mathematics and physics.',
        level: 'HIGH_SCHOOL'
    },
    {
        id: 't2',
        name: 'Prof. Maria Clara',
        headline: 'General Science & Biology Expert',
        subjects: ['Biology', 'Chemistry', 'Earth Science'],
        rating: 4.8,
        price: 20,
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
        bio: 'Making science fun and accessible for elementary students.',
        level: 'ELEMENTARY'
    },
    {
        id: 't3',
        name: 'Ms. Lea Salonga',
        headline: 'English & Literature Coach',
        subjects: ['Grammar', 'Literature', 'Writing'],
        rating: 5.0,
        price: 22,
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lea',
        bio: 'Helping students find their voice through the power of language.',
        level: 'BOTH'
    }
];
