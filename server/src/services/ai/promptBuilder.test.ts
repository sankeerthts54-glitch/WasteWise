import { describe, it, expect } from 'vitest';
import { buildAdvisoryPrompt } from './promptBuilder';
import { AppError } from '../../lib/errors';

describe('buildAdvisoryPrompt', () => {
  it('throws AppError(VALIDATION_ERROR) for unknown domain', () => {
    expect(() =>
      buildAdvisoryPrompt({
        domainSlug: 'non-existent-domain',
        inputs: {},
      })
    ).toThrowError(AppError);

    try {
      buildAdvisoryPrompt({ domainSlug: 'unknown', inputs: {} });
    } catch (err) {
      expect((err as AppError).code).toBe('VALIDATION_ERROR');
    }
  });

  it('builds prompts for waste-segregation domain with concise style', () => {
    const result = buildAdvisoryPrompt({
      domainSlug: 'waste-segregation',
      inputs: {
        location: 'Bengaluru',
        settingType: 'apartment_complex',
        dailyWasteKg: 10,
        wasteTypes: ['food_scraps', 'plastic'],
        currentPractice: 'some_segregation',
        composting: 'yes',
      },
      style: 'concise',
    });

    expect(result.systemInstruction).toContain('WasteWise');
    expect(result.systemInstruction).toContain('India');
    expect(result.userPrompt).toContain('Domain: Waste Segregation (waste-segregation)');
    expect(result.userPrompt).toContain('City / Town (location): Bengaluru');
    expect(result.userPrompt).toContain('Detail Level: Concise');
    expect(result.userPrompt).toContain('food_scraps, plastic');
  });

  it('builds prompts for solar-energy domain with detailed style and non-english language', () => {
    const result = buildAdvisoryPrompt({
      domainSlug: 'solar-energy',
      inputs: {
        location: 'Rajasthan',
        rooftopAreaSqFt: 500,
        monthlyBillRs: 4500,
        propertyType: 'independent_house',
      },
      style: 'detailed',
      language: 'hi',
    });

    expect(result.userPrompt).toContain('Domain: Rooftop Solar & Energy');
    expect(result.userPrompt).toContain('PM Surya Ghar Muft Bijli Yojana');
    expect(result.userPrompt).toContain('Detail Level: Detailed');
    expect(result.userPrompt).toContain("Language: Respond in language code 'hi'");
  });

  it('builds prompts for ewaste-disposal and recycling-upcycling domains correctly', () => {
    const ewasteResult = buildAdvisoryPrompt({
      domainSlug: 'ewaste-disposal',
      inputs: {
        location: 'Pune',
        deviceTypes: ['smartphones', 'laptops'],
        quantity: '1_to_5',
      },
    });
    expect(ewasteResult.userPrompt).toContain('E-Waste Management Rules 2022');
    expect(ewasteResult.userPrompt).toContain('smartphones, laptops');

    const recyclingResult = buildAdvisoryPrompt({
      domainSlug: 'recycling-upcycling',
      inputs: {
        location: 'Ahmedabad',
        materials: ['paper_cardboard', 'metal_scrap'],
        goal: 'earn_money',
      },
    });
    expect(recyclingResult.userPrompt).toContain('kabadiwala');
    expect(recyclingResult.userPrompt).toContain('paper_cardboard, metal_scrap');
  });
});
