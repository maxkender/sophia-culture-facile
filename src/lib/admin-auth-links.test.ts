import { describe, expect, it } from 'vitest';
import { adminAuthLinks } from './admin-auth-links';

describe('admin email return links', () => {
  it('returns magic links to the public auth page on the new domain', () => {
    expect(adminAuthLinks('https://vik-studios-creators.com').signIn).toBe('https://vik-studios-creators.com/auth');
  });
  it('returns recovery links to the new domain password reset page', () => {
    expect(adminAuthLinks('https://vik-studios-creators.com').resetPassword).toBe('https://vik-studios-creators.com/reset-password');
  });
});