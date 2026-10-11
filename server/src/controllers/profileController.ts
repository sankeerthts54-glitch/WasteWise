import { Request, Response, NextFunction } from 'express';
import { UpdateProfileRequestSchema, UserProfile } from 'wastewise-shared';
import { AppError } from '../lib/errors';
import { supabaseAdmin } from '../lib/supabase';

function formatUserProfile(user: NonNullable<Request['user']>): UserProfile {
  const metadata = user.user_metadata || {};
  const displayName =
    (metadata.displayName as string | undefined) ||
    (metadata.display_name as string | undefined) ||
    (metadata.full_name as string | undefined) ||
    (user.email ? user.email.split('@')[0] : 'User');

  return {
    id: user.id,
    displayName,
    email: user.email || '',
    createdAt: user.created_at,
    preferences: (metadata.preferences as Record<string, unknown> | undefined) || {},
  };
}

export function getProfile(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(new AppError('UNAUTHENTICATED', 'User is not authenticated'));
  }

  const profile = formatUserProfile(req.user);
  res.json({
    success: true,
    data: profile,
  });
}

export async function updateProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    return next(new AppError('UNAUTHENTICATED', 'User is not authenticated'));
  }

  const parseResult = UpdateProfileRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    const details = parseResult.error.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
    return next(
      new AppError('VALIDATION_ERROR', 'Invalid profile update data', details)
    );
  }

  const { displayName, preferences } = parseResult.data;
  const currentMetadata = req.user.user_metadata || {};
  const newMetadata: Record<string, unknown> = { ...currentMetadata };

  if (displayName !== undefined) {
    newMetadata.displayName = displayName;
    newMetadata.display_name = displayName;
  }

  if (preferences !== undefined) {
    newMetadata.preferences = {
      ...((currentMetadata.preferences as Record<string, unknown>) || {}),
      ...preferences,
    };
  }

  try {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      req.user.id,
      { user_metadata: newMetadata }
    );

    if (error || !data?.user) {
      return next(
        new AppError('INTERNAL', error?.message || 'Failed to update user profile')
      );
    }

    const updatedProfile = formatUserProfile(data.user);
    res.json({
      success: true,
      data: updatedProfile,
    });
  } catch (err) {
    next(err);
  }
}
