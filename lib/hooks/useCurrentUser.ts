'use client';

import { useState, useEffect } from 'react';

export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  role: 'STUDENT' | 'TUTOR' | 'ADMIN' | 'PARENT';
  isVerified: boolean;
  image: string | null;
  createdAt?: string;
  studentProfile: {
    id: string;
    schoolLevel: 'ELEMENTARY' | 'HIGH_SCHOOL';
    age: number | null;
    schoolName: string | null;
    parentEmail: string | null;
  } | null;
  tutorProfile: {
    id: string;
    headline: string | null;
    bio: string | null;
    pricingPerHour: number;
    verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  } | null;
}

interface UseCurrentUserResult {
  user: CurrentUser | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCurrentUser(): UseCurrentUserResult {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/me', { cache: 'no-store', credentials: 'include' })
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          if (data?.error === 'TUTOR_PENDING') {
            setError('TUTOR_PENDING');
          } else if (res.status === 401) {
            // User is not logged in, just set user to null
            setUser(null);
            setError(null);
          } else {
            setError(data?.error ?? 'Failed to load user');
          }
        } else {
          setUser(data);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [tick]);

  const refetch = () => {
    setLoading(true);
    setError(null);
    setTick((t) => t + 1);
  };

  return { user, loading, error, refetch };
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '??';
  return name.split(' ').slice(0, 2).map((n) => n[0]?.toUpperCase() ?? '').join('');
}

export function getFirstName(name: string | null | undefined): string {
  if (!name) return 'there';
  return name.split(' ')[0];
}
