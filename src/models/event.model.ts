import { ObjectId } from 'mongodb';

export type EventCategory =
  | 'Cleanup'
  | 'Plantation'
  | 'Donation'
  | 'Healthcare'
  | 'Education'
  | 'Relief'
  | 'Other';

export interface IEvent {
  _id?: ObjectId;
  title: string;
  description: string;
  eventType: EventCategory;
  thumbnailUrl: string;
  location: string;
  date: Date; // Stored as ISODate object in MongoDB
  organizerEmail: string;
  organizerName: string;
  attendeesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IJoinedEvent {
  _id?: ObjectId;
  eventId: ObjectId;
  userEmail: string;
  userName: string;
  joinedAt: Date;
}