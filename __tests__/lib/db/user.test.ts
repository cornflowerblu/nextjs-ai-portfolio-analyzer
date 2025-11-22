/**
 * Unit tests for User database operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma Client - must be defined inline for hoisting
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      upsert: vi.fn(),
    },
  },
}));

import { upsertUser } from '@/lib/db/user';
import { prisma } from '@/lib/db/prisma';

const mockUpsert = prisma.user.upsert as ReturnType<typeof vi.fn>;

describe('User Database Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('upsertUser', () => {
    it('should create a new user when user does not exist', async () => {
      const mockUser = {
        id: 'firebase-uid-123',
        email: 'newuser@example.com',
        name: 'New User',
        photoURL: 'https://example.com/photo.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUpsert.mockResolvedValue(mockUser);

      const result = await upsertUser({
        id: 'firebase-uid-123',
        email: 'newuser@example.com',
        name: 'New User',
        photoURL: 'https://example.com/photo.jpg',
      });

      expect(result).toEqual(mockUser);
      expect(mockUpsert).toHaveBeenCalledWith({
        where: { id: 'firebase-uid-123' },
        update: {
          email: 'newuser@example.com',
          name: 'New User',
          photoURL: 'https://example.com/photo.jpg',
        },
        create: {
          id: 'firebase-uid-123',
          email: 'newuser@example.com',
          name: 'New User',
          photoURL: 'https://example.com/photo.jpg',
        },
      });
    });

    it('should update existing user when user already exists', async () => {
      const existingUser = {
        id: 'firebase-uid-456',
        email: 'olduser@example.com',
        name: 'Old Name',
        photoURL: 'https://example.com/old-photo.jpg',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
      };

      mockUpsert.mockResolvedValue({
        ...existingUser,
        email: 'updateduser@example.com',
        name: 'Updated Name',
        photoURL: 'https://example.com/new-photo.jpg',
        updatedAt: new Date(),
      });

      const result = await upsertUser({
        id: 'firebase-uid-456',
        email: 'updateduser@example.com',
        name: 'Updated Name',
        photoURL: 'https://example.com/new-photo.jpg',
      });

      expect(result.id).toBe('firebase-uid-456');
      expect(result.email).toBe('updateduser@example.com');
      expect(result.name).toBe('Updated Name');
      expect(result.photoURL).toBe('https://example.com/new-photo.jpg');
      expect(mockUpsert).toHaveBeenCalledTimes(1);
    });

    it('should handle null email', async () => {
      const mockUser = {
        id: 'firebase-uid-789',
        email: null,
        name: 'User Without Email',
        photoURL: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUpsert.mockResolvedValue(mockUser);

      const result = await upsertUser({
        id: 'firebase-uid-789',
        email: null,
        name: 'User Without Email',
        photoURL: null,
      });

      expect(result.email).toBeNull();
      expect(mockUpsert).toHaveBeenCalledWith({
        where: { id: 'firebase-uid-789' },
        update: {
          email: null,
          name: 'User Without Email',
          photoURL: null,
        },
        create: {
          id: 'firebase-uid-789',
          email: null,
          name: 'User Without Email',
          photoURL: null,
        },
      });
    });

    it('should handle undefined values gracefully', async () => {
      const mockUser = {
        id: 'firebase-uid-abc',
        email: 'user@example.com',
        name: null,
        photoURL: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUpsert.mockResolvedValue(mockUser);

      const result = await upsertUser({
        id: 'firebase-uid-abc',
        email: 'user@example.com',
      });

      expect(result.id).toBe('firebase-uid-abc');
      expect(result.email).toBe('user@example.com');
    });

    it('should throw error when database operation fails', async () => {
      mockUpsert.mockRejectedValue(new Error('Database connection error'));

      await expect(
        upsertUser({
          id: 'firebase-uid-error',
          email: 'error@example.com',
        })
      ).rejects.toThrow('Database connection error');
    });

    it('should handle missing id by throwing error', async () => {
      await expect(
        upsertUser({
          id: '',
          email: 'test@example.com',
        })
      ).rejects.toThrow();
    });
  });
});
