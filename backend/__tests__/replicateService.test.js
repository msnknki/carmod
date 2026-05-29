const {
  buildPrompt,
  PRESERVE_REFERENCE,
  isColorOnlyEdit,
} = require('../src/services/replicateService');

describe('buildPrompt', () => {
  test('builds text-to-image prompt with full car info and parts', () => {
    const prompt = buildPrompt({
      carMake: 'BMW',
      carModel: '320i',
      carYear: '2015',
      parts: ['BBS Rims', 'Carbon Fiber Spoiler'],
      description: 'matte black wrap',
    });
    expect(prompt).toContain('2015');
    expect(prompt).toContain('BMW');
    expect(prompt).toContain('BBS Rims');
    expect(prompt).toContain('matte black wrap');
    expect(prompt).not.toContain('Edit this exact car photo');
  });

  test('detects color-only edits', () => {
    expect(isColorOnlyEdit('Change paint color to black')).toBe(true);
    expect(isColorOnlyEdit('add carbon spoiler')).toBe(false);
  });

  test('builds color-only preservation prompt for reference photo', () => {
    const prompt = buildPrompt({
      description: 'Change paint color to black',
      hasReferenceImage: true,
    });
    expect(prompt).toContain('Change ONLY the car body paint color');
    expect(prompt).toContain('Change paint color to black');
    expect(prompt).toContain(PRESERVE_REFERENCE);
  });

  test('builds refinement prompt for follow-up edits', () => {
    const prompt = buildPrompt({
      description: 'make wheels gold',
      hasReferenceImage: true,
      isRefinement: true,
    });
    expect(prompt).toContain('Edit this exact car photo');
    expect(prompt).toContain('make wheels gold');
  });

  test('builds prompt with car info only (text mode)', () => {
    const prompt = buildPrompt({
      carMake: 'Honda',
      carModel: 'Civic',
      carYear: '2020',
    });
    expect(prompt).toBe('2020 Honda Civic, photorealistic automotive photography');
  });

  test('falls back to sports car when no info given', () => {
    const prompt = buildPrompt({});
    expect(prompt).toBe('sports car, photorealistic automotive photography');
  });
});
