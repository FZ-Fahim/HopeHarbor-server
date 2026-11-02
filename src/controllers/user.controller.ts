import { Request, Response } from 'express';
import { z } from 'zod';
import { getDB } from '../config/db.js';

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50).trim().optional(),
  image: z.string().url('Please enter a valid image URL').trim().optional().or(z.literal('')),
});

/**
 * 1. GET /api/users/profile
 * Protected: Returns user info along with community impact stats.
 */
export async function getProfile(req: Request, res: Response): Promise<any> {
  try {
    const user = (req as any).user;
    if (!user?.email) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const db = getDB();

    // Fetch user details from Better Auth's 'user' collection
    const dbUser = await db.collection('user').findOne({ email: user.email });

    // Calculate community statistics
    const organizedCount = await db
      .collection('events')
      .countDocuments({ organizerEmail: user.email });

    const joinedCount = await db
      .collection('joined_events')
      .countDocuments({ userEmail: user.email });

    return res.status(200).json({
      success: true,
      data: {
        id: dbUser?._id || user.id,
        name: dbUser?.name || user.name,
        email: user.email,
        image: dbUser?.image || user.image || '',
        createdAt: dbUser?.createdAt || new Date(),
        stats: {
          organizedEvents: organizedCount,
          joinedEvents: joinedCount,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
    });
  }
}

/**
 * 2. PATCH /api/users/profile
 * Protected: Updates user name and profile picture URL.
 */
export async function updateProfile(req: Request, res: Response): Promise<any> {
  try {
    const user = (req as any).user;
    if (!user?.email) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const parseResult = updateProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.issues[0]?.message || 'Validation error',
      });
    }

    const { name, image } = parseResult.data;
    const updateFields: any = { updatedAt: new Date() };

    if (name) updateFields.name = name;
    if (image !== undefined) updateFields.image = image;

    const db = getDB();

    // Update in Better Auth's user collection
    await db.collection('user').updateOne(
      { email: user.email },
      { $set: updateFields }
    );

    // Keep organizer name synced across their created events
    if (name) {
      await db.collection('events').updateMany(
        { organizerEmail: user.email },
        { $set: { organizerName: name } }
      );

      await db.collection('joined_events').updateMany(
        { userEmail: user.email },
        { $set: { userName: name } }
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        name: name || user.name,
        image: image !== undefined ? image : user.image,
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile',
    });
  }
}