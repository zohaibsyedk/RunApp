import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { getAuth } from 'firebase/auth';
import { Organization } from '../types';
import { useAuth } from './AuthContext';
import { Timestamp } from 'firebase/firestore'; 

interface OrganizationContextType {
    organizations: Organization[];
    loading: boolean;
    error: string;
    fetchOrganizations: (filter: string) => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | null>(null);

const API_URL = "https://run-app-backend-179019793982.us-central1.run.app";

interface OrganizationProviderProps {
    children: ReactNode;
}

export const OrganizationProvider = ({ children }: OrganizationProviderProps) => {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();

    const fetchOrganizations = async (filter: string = 'all') => {
        if (!user) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError('');
        try {
            const token = await user.getIdToken();

            const response = await fetch(`${API_URL}/api/organizations?filter=${filter}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const responseData = await response.json();
            if (!response.ok) {
                throw new Error(responseData.error || 'Failed to fetch organizations');
            }

            if (responseData && Array.isArray(responseData.organizations)) {
                const personalOption: Organization = { 
                    id: user.uid, 
                    name: "My Personal Events", 
                    memberCount: 1, 
                    createdAt: Timestamp.now(),
                    description: 'Personal Organization for Personal Events',
                    organizationPhotoURL: user.photoURL?.toString() || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
                    visibility: 'Private',
                    updatedAt: Timestamp.now()
                };
                console.log(responseData);
                setOrganizations([personalOption, ...responseData.organizations]);
            } else {
                throw new Error("Unexpected API response format for organizations");
            }
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unknown error occured while fetching organizations.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchOrganizations('mine');
        } else {
            setOrganizations([]);
            setLoading(false);
        }
    }, [user]);

    const value = { organizations, loading, error, fetchOrganizations};

    return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
};

export const useOrganizations = () => {
    const context = useContext(OrganizationContext);
    if (!context) {
        throw new Error('useOrganizations must be used within an OrganizationProvider');
    }
    return context;
};