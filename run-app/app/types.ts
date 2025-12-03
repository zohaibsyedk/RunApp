import { Timestamp } from 'firebase/firestore';
  
export interface FirestoreTimestamp {
    _nanoseconds: number;
    _seconds: number;
}

export interface Event {
    id: string;
    name: string;
    organizationId: string;
    organizationPhotoURL: string;
    organizationName: string;
    createdBy: string;
    startDate: FirestoreTimestamp;
    visibility: 'Public' | 'Private' | 'Friends';
    distance?: number;
    description?: string;
    location?: {
        address: string;
        geopoint: {
        latitude: number;
        longitude: number;
        };
    };
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Organization {
    id: string;
    name: string;
    memberCount: number;
    createdAt: Timestamp;
    createdBy: string;
    description: string;
    organizationPhotoURL: string;
    updatedAt: Timestamp;
    visibility: 'Public' | 'Private' | 'Friends';
}

export interface Session {
    id: string;
    elapsedDistanceMeters: number;
    elapsedTimeSeconds: number;
    eventId: string;
    startTime: Timestamp;
    event: Event;
}