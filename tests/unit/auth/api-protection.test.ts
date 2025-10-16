/**
 * Unit tests for API protection utilities
 */

import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import {
  getUserFromRequest,
  AuthError,
  validateMethod,
  successResponse,
  errorResponse,
} from '@/lib/auth/api-protection';

describe('getUserFromRequest', () => {
  it('should extract user from headers', () => {
    const headers = new Headers();
    headers.set('x-user-id', '123');
    headers.set('x-user-email', 'user@example.com');

    const request = new NextRequest('https://example.com/api/test', {
      headers,
    });

    const user = getUserFromRequest(request);

    expect(user.id).toBe('123');
    expect(user.email).toBe('user@example.com');
  });

  it('should throw AuthError if user ID is missing', () => {
    const headers = new Headers();
    headers.set('x-user-email', 'user@example.com');

    const request = new NextRequest('https://example.com/api/test', {
      headers,
    });

    expect(() => getUserFromRequest(request)).toThrow(AuthError);
  });

  it('should throw AuthError if user email is missing', () => {
    const headers = new Headers();
    headers.set('x-user-id', '123');

    const request = new NextRequest('https://example.com/api/test', {
      headers,
    });

    expect(() => getUserFromRequest(request)).toThrow(AuthError);
  });
});

describe('validateMethod', () => {
  it('should return null for matching method', () => {
    const request = new NextRequest('https://example.com/api/test', {
      method: 'POST',
    });

    const result = validateMethod(request, 'POST');

    expect(result).toBeNull();
  });

  it('should return error response for non-matching method', () => {
    const request = new NextRequest('https://example.com/api/test', {
      method: 'GET',
    });

    const result = validateMethod(request, 'POST');

    expect(result).not.toBeNull();
    expect(result?.status).toBe(405);
  });
});

describe('successResponse', () => {
  it('should create success response with data', async () => {
    const data = { userId: '123', name: 'John' };
    const response = successResponse(data);

    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(data);
  });

  it('should accept custom status code', async () => {
    const data = { created: true };
    const response = successResponse(data, 201);

    expect(response.status).toBe(201);
  });
});

describe('errorResponse', () => {
  it('should create error response with message', async () => {
    const response = errorResponse('Something went wrong', 400, 'error_code');

    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toBe('Something went wrong');
    expect(json.code).toBe('error_code');
  });

  it('should default to 400 status', async () => {
    const response = errorResponse('Error');

    expect(response.status).toBe(400);
  });
});
