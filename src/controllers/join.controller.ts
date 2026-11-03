import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';
import { IEvent, IJoinedEvent } from '../models/event.model.js';

/**
 * 1. POST /api/events/:id/join
 * Protected: Joins an upcoming event.
 * Prevents duplicate joins & increments attendee counter.
 */
export async function joinEvent(req: Request, res: Response): Promise<any> {
  try {
    const { id } = req.params;
    if (typeof id !== 'string' || !ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    }

    const user = (req as any).user;
    if (!user?.email) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const db = getDB();
    const event = await db.collection<IEvent>('events').findOne({ _id: new ObjectId(id) });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.organizerEmail?.toLowerCase() === user.email?.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot join an initiative you are organizing',
      });
    }

    // Check if event is in the past
    if (new Date(event.date).getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot join past events',
      });
    }

    // Check for duplicate join
    const existingJoin = await db.collection<IJoinedEvent>('joined_events').findOne({
      eventId: new ObjectId(id),
      userEmail: user.email,
    });

    if (existingJoin) {
      return res.status(409).json({
        success: false,
        message: 'You have already joined this event',
      });
    }

    // Save Join Record
    const joinRecord: IJoinedEvent = {
      eventId: new ObjectId(id),
      userEmail: user.email,
      userName: user.name || 'Community Volunteer',
      joinedAt: new Date(),
    };

    await db.collection<IJoinedEvent>('joined_events').insertOne(joinRecord as any);

    // Increment attendees counter on the event
    await db.collection<IEvent>('events').updateOne(
      { _id: new ObjectId(id) },
      { $inc: { attendeesCount: 1 } }
    );

    return res.status(200).json({
      success: true,
      message: 'Successfully joined the event!',
      data: joinRecord,
    });
  } catch (error: any) {
    // Handle MongoDB duplicate key constraint if hit concurrently
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You have already joined this event',
      });
    }

    console.error('Error joining event:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to join event',
    });
  }
}

/**
 * DELETE /api/events/:id/join
 * Protected: Removes the current user's join record and decrements attendees.
 */
export async function leaveEvent(req: Request, res: Response): Promise<any> {
  try {
    const { id } = req.params;
    if (typeof id !== 'string' || !ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    }

    const user = (req as any).user;
    if (!user?.email) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const db = getDB();
    const result = await db.collection<IJoinedEvent>('joined_events').deleteOne({
      eventId: new ObjectId(id),
      userEmail: user.email,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'You have not joined this event' });
    }

    await db.collection<IEvent>('events').updateOne(
      { _id: new ObjectId(id), attendeesCount: { $gt: 0 } },
      { $inc: { attendeesCount: -1 } }
    );

    return res.status(200).json({ success: true, message: 'Successfully left the event' });
  } catch (error) {
    console.error('Error leaving event:', error);
    return res.status(500).json({ success: false, message: 'Failed to leave event' });
  }
}

/**
 * 2. GET /api/events/joined/me
 * Protected: Returns all events joined by current user, sorted by event date.
 */
export async function getMyJoinedEvents(req: Request, res: Response): Promise<any> {
  try {
    const user = (req as any).user;
    if (!user?.email) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const db = getDB();

    // Use MongoDB aggregation to join event details and sort by event date
    const joinedEvents = await db
      .collection('joined_events')
      .aggregate([
        { $match: { userEmail: user.email } },
        {
          $lookup: {
            from: 'events',
            localField: 'eventId',
            foreignField: '_id',
            as: 'eventDetails',
          },
        },
        { $unwind: '$eventDetails' },
        // Sort by the actual event date in ascending order (soonest first)
        { $sort: { 'eventDetails.date': 1 } },
        {
          $project: {
            _id: 1,
            joinedAt: 1,
            userEmail: 1,
            event: '$eventDetails',
          },
        },
      ])
      .toArray();

    return res.status(200).json({
      success: true,
      count: joinedEvents.length,
      data: joinedEvents,
    });
  } catch (error) {
    console.error('Error fetching joined events:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch joined events',
    });
  }
}

/**
 * 3. GET /api/events/:id/join-status
 * Protected: Checks if current user has already joined this specific event.
 */
export async function getJoinStatus(req: Request, res: Response): Promise<any> {
  try {
    const { id } = req.params;
    if (typeof id !== 'string' || !ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID' });
    }

    const user = (req as any).user;
    if (!user?.email) {
      return res.status(200).json({ success: true, hasJoined: false });
    }

    const db = getDB();
    const joinRecord = await db.collection<IJoinedEvent>('joined_events').findOne({
      eventId: new ObjectId(id),
      userEmail: user.email,
    });

    return res.status(200).json({
      success: true,
      hasJoined: Boolean(joinRecord),
    });
  } catch (error) {
    console.error('Error checking join status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify join status',
    });
  }
}

/**
 * GET /api/events/:id/volunteers
 * Public: Returns volunteer join records for an event, newest first.
 */
export async function getEventVolunteers(req: Request, res: Response): Promise<any> {
  try {
    const { id } = req.params;
    if (typeof id !== 'string' || !ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    }

    const db = getDB();
    const volunteers = await db
      .collection('joined_events')
      .find({ eventId: new ObjectId(id) })
      .sort({ joinedAt: -1 })
      .toArray();

    return res.status(200).json({
      success: true,
      count: volunteers.length,
      data: volunteers,
    });
  } catch (error) {
    console.error('Error fetching event volunteers:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch event volunteers',
    });
  }
}
