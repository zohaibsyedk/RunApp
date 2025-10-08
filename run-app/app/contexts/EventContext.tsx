import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { getAuth } from 'firebase/auth';
import { Event } from '../types';

interface EventContextType {
    events: Event[];
    loading: boolean;
    error: string;
    fetchEvents: () => Promise<void>;
}

const EventContext = createContext<EventContextType | null>(null);

const API_URL = "https://run-app-backend-179019793982.us-central1.run.app";

interface EventProviderProps {
    children: ReactNode;
}

export const EventProvider = ({ children }: EventProviderProps) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("You must be logged in.");
      }
      const token = await user.getIdToken();

      const response = await fetch(`${API_URL}/api/events`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to fetch events');
      }

      if (responseData && Array.isArray(responseData.events)) {
        setEvents(responseData.events);
      } else {
        throw new Error("Unexpected API response format");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        fetchEvents();
      } else {
        setEvents([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const value = { events, loading, error, fetchEvents };

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
};

export const useEvents = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
};
