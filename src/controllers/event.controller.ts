import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';
import { IEvent } from '../models/event.model.js';

/**
 * 1. GET /api/events/recent
 * Returns 6 nearest upcoming events using MongoDB's .limit() operator.
 * Strictly filters out past events.
 */
export async function getRecentEvents(req: Request, res: Response) {
  try {
    const db = getDB();
    const now = new Date();

    const recentEvents = await db
      .collection<IEvent>('events')
      .find({ date: { $gte: now } })
      .sort({ date: 1 }) // Nearest upcoming first
      .limit(6)          // Strict assignment requirement: .limit(6)
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
 * Returns all upcoming events with optional search (title/location) & category filtering.
 * Strictly excludes past events.
 */
export async function getUpcomingEvents(req: Request, res: Response) {
  try {
    const db = getDB();
    const now = new Date();
    const { search, category } = req.query;

    const query: any = {
      date: { $gte: now }, // Ensure no past events appear
    };

    // Filter by category if selected
    if (category && category !== 'All') {
      query.eventType = category;
    }

    // Search by title or location (case-insensitive)
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
 * Public endpoint: returns details of a single event.
 */
export async function getEventById(req: Request, res: Response) {
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