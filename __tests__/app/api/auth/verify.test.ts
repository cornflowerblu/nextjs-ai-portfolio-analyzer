/**
 * Integration tests for Firebase token verification and user upsert
 */

import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { NextRequest } from 'next/server';

// Mock Firebase Admin
vi.mock('@/lib/auth/firebase-admin', () => ({
  verifyFirebaseToken: vi.fn(),
  getUserFromToken: vi.fn(),
}));

// Mock User database operations
vi.mock('@/lib/db/user', () => ({
  upsertUser: vi.fn(),
}));

// Mock access control to allow all test users
vi.mock('@/lib/firebase/access-control', () => ({
  isUserAllowed: vi.fn(() => true),
}));

import { POST } from '@/app/api/auth/verify/route';
import { verifyFirebaseToken } from '@/lib/auth/firebase-admin';
import { upsertUser } from '@/lib/db/user';

// Type the mocked functions
const mockedVerifyFirebaseToken = verifyFirebaseToken as MockedFunction<typeof verifyFirebaseToken>;
const mockedUpsertUser = upsertUser as MockedFunction<typeof upsertUser>;

// Helper to create mock DecodedIdToken
function createMockDecodedToken(overrides: Partial<DecodedIdToken> = {}): DecodedIdToken {
  return {
    uid: 'test-uid',
    aud: 'test-audience',
    auth_time: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    iss: 'https://securetoken.google.com/test-project',
    sub: 'test-subject',
    firebase: {
      identities: {},
      sign_in_provider: 'google.com',
    },
    ...overrides,
  } as DecodedIdToken;
}

describe('POST /api/auth/verify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Successful Authentication', () => {
    it('should verify token and upsert user on successful authentication', async () => {
      const mockDecodedToken = createMockDecodedToken({
        uid: 'firebase-uid-123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/photo.jpg',
      });

      const mockUser = {
        id: 'firebase-uid-123',
        email: 'test@example.com',
        name: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedVerifyFirebaseToken.mockResolvedValue(mockDecodedToken);
      mockedUpsertUser.mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token-123',
        },
        body: JSON.stringify({ idToken: 'valid-token-123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.valid).toBe(true);
      expect(data.uid).toBe('firebase-uid-123');
      expect(data.email).toBe('test@example.com');
      expect(mockedVerifyFirebaseToken).toHaveBeenCalledWith('valid-token-123');
      expect(mockedUpsertUser).toHaveBeenCalledWith({
        id: 'firebase-uid-123',
        email: 'test@example.com',
        name: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
      });
    });

    it('should handle user without name or photoURL', async () => {
      const mockDecodedToken = createMockDecodedToken({
        uid: 'firebase-uid-456',
        email: 'minimal@example.com',
      });

      const mockUser = {
        id: 'firebase-uid-456',
        email: 'minimal@example.com',
        name: null,
        photoURL: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedVerifyFirebaseToken.mockResolvedValue(mockDecodedToken);
      mockedUpsertUser.mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: 'valid-token-456' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.valid).toBe(true);
      expect(data.uid).toBe('firebase-uid-456');
      expect(mockedUpsertUser).toHaveBeenCalledWith({
        id: 'firebase-uid-456',
        email: 'minimal@example.com',
        name: undefined,
        photoURL: undefined,
      });
    });
  });

  describe('Error Handling', () => {
    it('should return 400 when no token provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('No ID token provided');
    });

    it('should return 401 when token is invalid', async () => {
      mockedVerifyFirebaseToken.mockRejectedValue(new Error('Invalid token'));

      const request = new NextRequest('http://localhost:3000/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: 'invalid-token' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.valid).toBe(false);
      expect(data.error).toBe('Invalid or expired token');
    });

    it('should return 401 when token is expired', async () => {
      mockedVerifyFirebaseToken.mockRejectedValue(new Error('Token expired'));

      const request = new NextRequest('http://localhost:3000/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: 'expired-token' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.valid).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      const mockDecodedToken = createMockDecodedToken({
        uid: 'firebase-uid-789',
        email: 'db-error@example.com',
      });

      mockedVerifyFirebaseToken.mockResolvedValue(mockDecodedToken);
      mockedUpsertUser.mockRejectedValue(new Error('Database connection error'));

      const request = new NextRequest('http://localhost:3000/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: 'valid-token-789' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Failed to upsert user');
    });
  });

  describe('User Profile Fields', () => {
    it('should map Firebase picture to photoURL', async () => {
      const mockDecodedToken = createMockDecodedToken({
        uid: 'firebase-uid-photo',
        email: 'photo@example.com',
        picture: 'https://example.com/user-photo.jpg',
      });

      mockedVerifyFirebaseToken.mockResolvedValue(mockDecodedToken);
      mockedUpsertUser.mockResolvedValue({
        id: 'firebase-uid-photo',
        email: 'photo@example.com',
        name: null,
        photoURL: 'https://example.com/user-photo.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new NextRequest('http://localhost:3000/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: 'token-with-photo' }),
      });

      const response = await POST(request);
      await response.json();

      expect(mockedUpsertUser).toHaveBeenCalledWith(
        expect.objectContaining({
          photoURL: 'https://example.com/user-photo.jpg',
        })
      );
    });
  });
});
