import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';
import { IEvent } from '../models/event.model.js';
import { createEventSchema, updateEventSchema } from '../validations/event.validation.js';

/**
 * 1. GET /api/events/recent
 * Returns 6 nearest upcoming events using MongoDB's .limit() operator.
 */
export async function getRecentEvents(req: Request, res: Response): Promise<any> {
  try {
    const db = getDB();
    const now = new Date();

    const recentEvents = await db
      .collection<IEvent>('events')
      .find({ date: { $gte: now } })
      .sort({ date: 1 })
      .limit(6)
      .toArray();

    return res.status(200).json({
      success: true,
      count: recentEvents.length,
      data: recentEvents,
    });
  } catch (error) {
    console.error('Error fetching recent events:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch recent upcoming events',
    });
  }
}

/**
 * 2. GET /api/events/upcoming
 * Returns all upcoming events with search & category filtering.
 */
export async function getUpcomingEvents(req: Request, res: Response): Promise<any> {
  try {
    const db = getDB();
    const now = new Date();
    const { search, category } = req.query;

    const query: any = {
      date: { $gte: now },
    };

    if (category && category !== 'All') {
      query.eventType = category;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      query.$or = [{ title: searchRegex }, { location: searchRegex }];
    }

    const events = await db
      .collection<IEvent>('events')
      .find(query)
      .sort({ date: 1 })
      .toArray();

    return res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming events',
    });
  }
}

/**
 * 3. GET /api/events/:id
 * Public: single event details.
 */
export async function getEventById(req: Request, res: Response): Promise<any> {
  try {
    const { id } = req.params;

    if (typeof id !== 'string' || !ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format',
      });
    }

    const db = getDB();
    const event = await db
      .collection<IEvent>('events')
      .findOne({ _id: new ObjectId(id) });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('Error fetching event details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch event details',
    });
  }
}

/**
 * 4. POST /api/events
 * Protected: Creates a new event stamped with the creator's email.
 */
export async function createEvent(req: Request, res: Response): Promise<any> {
  try {
    const user = (req as any).user;
    if (!user?.email) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const parseResult = createEventSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.issues[0]?.message || 'Validation error',
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    const { title, description, eventType, thumbnailUrl, location, date } = parseResult.data;

    const newEvent: IEvent = {
      title,
      description,
      eventType,
      thumbnailUrl,
      location,
      date,
      organizerEmail: user.email,
      organizerName: user.name || 'Community Member',
      attendeesCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const db = getDB();
    const result = await db.collection<IEvent>('events').insertOne(newEvent as any);

    return res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: { ...newEvent, _id: result.insertedId },
    });
  } catch (error) {
    console.error('Error creating event:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create event',
    });
  }
}

/**
 * 5. GET /api/events/user/my-events
 * Protected: Fetches all events created by the logged-in user.
 */
export async function getMyEvents(req: Request, res: Response): Promise<any> {
  try {
    const user = (req as any).user;
    if (!user?.email) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const db = getDB();
    const myEvents = await db
      .collection<IEvent>('events')
      .find({ organizerEmail: user.email })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({
      success: true,
      count: myEvents.length,
      data: myEvents,
    });
  } catch (error) {
    console.error('Error fetching my events:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch your events',
    });
  }
}

/**
 * 6. PUT /api/events/:id
 * Protected: Updates an event. Enforces strict creator ownership.
 */
export async function updateEvent(req: Request, res: Response): Promise<any> {
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

    if (event.organizerEmail !== user.email) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only update events created by yourself',
      });
    }

    const parseResult = updateEventSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.issues[0]?.message || 'Validation error',
      });
    }

    const updateData: any = {
      ...parseResult.data,
      updatedAt: new Date(),
    };

    await db.collection<IEvent>('events').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    const updatedEvent = await db
      .collection<IEvent>('events')
      .findOne({ _id: new ObjectId(id) });

    return res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: updatedEvent,
    });
  } catch (error) {
    console.error('Error updating event:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update event',
    });
  }
}

/**
 * 7. DELETE /api/events/:id
 * Protected: Deletes an event. Enforces strict creator ownership.
 */
export async function deleteEvent(req: Request, res: Response): Promise<any> {
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

    if (event.organizerEmail !== user.email) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only delete events created by yourself',
      });
    }

    await db.collection<IEvent>('events').deleteOne({ _id: new ObjectId(id) });

    return res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete event',
    });
  }
}