import { parseCorsOrigins } from './parse-cors-origins';

describe('parseCorsOrigins', () => {
    it('returns empty array for undefined', () => {
        expect(parseCorsOrigins(undefined)).toEqual([]);
    });

    it('trims and splits comma-separated origins', () => {
        expect(
            parseCorsOrigins('https://a.example.com, https://b.example.com ')
        ).toEqual(['https://a.example.com', 'https://b.example.com']);
    });

    it('drops empty segments', () => {
        expect(parseCorsOrigins('https://x.com,,,')).toEqual(['https://x.com']);
    });
});
