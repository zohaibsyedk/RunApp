export interface FirestoreTimestamp {
    _seconds: number;
    _nanoseconds: number;
}
  
export interface Event {
    id: string;
    name: string;
    organizationId: string;
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
    createdAt: FirestoreTimestamp;
    updatedAt: FirestoreTimestamp;
}