const { buildPrompt } = require('../src/services/replicateService');

describe('buildPrompt', () => {
  test('builds prompt with full car info and parts', () => {
    const prompt = buildPrompt({
      carMake: 'BMW',
      carModel: '320i',
      carYear: '2015',
      parts: ['BBS Rims', 'Carbon Fiber Spoiler'],
      description: 'matte black wrap',
    });
    expect(prompt).toContain('2015');
    expect(prompt).toContain('BMW');
    expect(prompt).toContain('320i');
    expect(prompt).toContain('BBS Rims');
    expect(prompt).toContain('Carbon Fiber Spoiler');
    expect(prompt).toContain('matte black wrap');
  });

  test('builds prompt with car info only', () => {
    const prompt = buildPrompt({
      carMake: 'Honda',
      carModel: 'Civic',
      carYear: '2020',
    });
    expect(prompt).toBe('2020 Honda Civic');
  });

  test('falls back to "sports car" when no info given', () => {
    const prompt = buildPrompt({});
    expect(prompt).toBe('sports car');
  });

  test('handles part objects with title field', () => {
    const prompt = buildPrompt({
      carMake: 'Toyota',
      parts: [{title: 'LED Headlights'}, {title: 'Exhaust Tips'}],
    });
    expect(prompt).toContain('LED Headlights');
    expect(prompt).toContain('Exhaust Tips');
  });
});
