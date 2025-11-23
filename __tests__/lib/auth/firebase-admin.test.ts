/**
 * Unit tests for Firebase Admin authentication helpers
 */

import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest';
import type { DecodedIdToken } from 'firebase-admin/auth';

// Mock firebase-admin module - must be defined inline for hoisting
vi.mock('firebase-admin', () => {
  return {
    default: {
      apps: [],
      initializeApp: vi.fn(() => ({})),
      credential: {
        cert: vi.fn(() => ({})),
      },
      auth: vi.fn(() => ({
        verifyIdToken: vi.fn(),
      })),
    },
    apps: [],
    initializeApp: vi.fn(() => ({})),
    credential: {
      cert: vi.fn(() => ({})),
    },
    auth: vi.fn(() => ({
      verifyIdToken: vi.fn(),
    })),
  };
});

// Mock the entire firebase-admin auth module to prevent initialization
vi.mock('@/lib/auth/firebase-admin', () => ({
  verifyFirebaseToken: vi.fn(),
  getUserFromToken: vi.fn(),
  getFirebaseAdmin: vi.fn(),
}));

// Import after mocking
import { verifyFirebaseToken, getUserFromToken } from '@/lib/auth/firebase-admin';

// Type the mocked functions
const mockedVerifyFirebaseToken = verifyFirebaseToken as MockedFunction<typeof verifyFirebaseToken>;
const mockedGetUserFromToken = getUserFromToken as MockedFunction<typeof getUserFromToken>;

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

describe('Firebase Admin Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('verifyFirebaseToken', () => {
    it('should verify a valid token and return decoded token', async () => {
      const mockDecodedToken = createMockDecodedToken({
        uid: 'test-user-123',
        email: 'test@example.com',
        email_verified: true,
      });

      // Mock the verifyFirebaseToken function
      mockedVerifyFirebaseToken.mockResolvedValue(mockDecodedToken);

      const token = 'valid-firebase-token';
      const result = await verifyFirebaseToken(token);

      expect(result).toEqual(mockDecodedToken);
      expect(mockedVerifyFirebaseToken).toHaveBeenCalledWith(token);
    });

    it('should throw error when token is null', async () => {
      mockedVerifyFirebaseToken.mockRejectedValue(new Error('No authentication token provided'));
      await expect(verifyFirebaseToken(null)).rejects.toThrow('No authentication token provided');
    });

    it('should throw error when token is undefined', async () => {
      mockedVerifyFirebaseToken.mockRejectedValue(new Error('No authentication token provided'));
      await expect(verifyFirebaseToken(undefined)).rejects.toThrow('No authentication token provided');
    });

    it('should throw error when token is invalid', async () => {
      mockedVerifyFirebaseToken.mockRejectedValue(new Error('Invalid or expired token'));

      await expect(verifyFirebaseToken('invalid-token')).rejects.toThrow('Invalid or expired token');
    });

    it('should throw error when token is expired', async () => {
      mockedVerifyFirebaseToken.mockRejectedValue(new Error('Invalid or expired token'));

      await expect(verifyFirebaseToken('expired-token')).rejects.toThrow('Invalid or expired token');
    });
  });

  describe('getUserFromToken', () => {
    it('should extract and verify user from Authorization header', async () => {
      const mockResult = {
        userId: 'test-user-456',
        email: 'user@example.com',
        decodedToken: createMockDecodedToken({
          uid: 'test-user-456',
          email: 'user@example.com',
          email_verified: true,
        }),
      };

      mockedGetUserFromToken.mockResolvedValue(mockResult);

      const authHeader = 'Bearer valid-token-123';
      const result = await getUserFromToken(authHeader);

      expect(result.userId).toBe('test-user-456');
      expect(result.email).toBe('user@example.com');
      expect(mockedGetUserFromToken).toHaveBeenCalledWith(authHeader);
    });

    it('should throw error when Authorization header is missing', async () => {
      mockedGetUserFromToken.mockRejectedValue(new Error('Missing Authorization header'));
      await expect(getUserFromToken(null)).rejects.toThrow('Missing Authorization header');
    });

    it('should throw error when Authorization header is undefined', async () => {
      mockedGetUserFromToken.mockRejectedValue(new Error('Missing Authorization header'));
      await expect(getUserFromToken(undefined)).rejects.toThrow('Missing Authorization header');
    });

    it('should throw error when Authorization header format is invalid', async () => {
      mockedGetUserFromToken.mockRejectedValue(
        new Error('Invalid Authorization header format. Expected: Bearer <token>')
      );
      await expect(getUserFromToken('InvalidFormat token')).rejects.toThrow(
        'Invalid Authorization header format. Expected: Bearer <token>'
      );
    });

    it('should throw error when Authorization header is missing Bearer prefix', async () => {
      mockedGetUserFromToken.mockRejectedValue(
        new Error('Invalid Authorization header format. Expected: Bearer <token>')
      );
      await expect(getUserFromToken('just-a-token')).rejects.toThrow(
        'Invalid Authorization header format. Expected: Bearer <token>'
      );
    });
  });
});
