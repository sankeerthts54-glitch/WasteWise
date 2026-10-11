import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Server } from 'http';
import { AddressInfo } from 'net';
import { createApp } from '../app';
import { DOMAINS, DomainConfig } from 'wastewise-shared';

describe('Domains Routes', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const port = (server.address() as AddressInfo).port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('GET /api/domains returns all domain configurations', async () => {
    const res = await fetch(`${baseUrl}/api/domains`);
    expect(res.status).toBe(200);

    const body = (await res.json()) as { success: boolean; data: DomainConfig[] };
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBe(DOMAINS.length);

    const slugs = body.data.map((d) => d.slug);
    expect(slugs).toContain('waste-segregation');
    expect(slugs).toContain('ewaste-disposal');
    expect(slugs).toContain('recycling-upcycling');
    expect(slugs).toContain('solar-energy');
  });

  it('GET /api/domains/:slug returns the specific domain config', async () => {
    const res = await fetch(`${baseUrl}/api/domains/waste-segregation`);
    expect(res.status).toBe(200);

    const body = (await res.json()) as { success: boolean; data: DomainConfig };
    expect(body.success).toBe(true);
    expect(body.data.slug).toBe('waste-segregation');
    expect(body.data.name).toBe('Waste Segregation');
    expect(body.data.fields.length).toBeGreaterThan(0);
    expect(body.data.promptFocus).toBeDefined();
  });

  it('GET /api/domains/:slug returns 404 for unknown slug', async () => {
    const res = await fetch(`${baseUrl}/api/domains/non-existent-domain`);
    expect(res.status).toBe(404);

    const body = (await res.json()) as { success: boolean; error: { code: string; message: string } };
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toContain('non-existent-domain');
  });
});
