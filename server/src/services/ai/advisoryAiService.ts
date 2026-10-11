import { Advisory, CreateAdvisoryRequest } from 'wastewise-shared';
import { buildAdvisoryPrompt } from './promptBuilder';
import { geminiClient, GeminiClient } from './geminiClient';
import { logger } from '../../lib/logger';

export class AdvisoryAiService {
  constructor(private client: GeminiClient = geminiClient) {}

  /**
   * Generates a fully structured advisory plan using Gemini.
   */
  public async generateAdvisory(request: CreateAdvisoryRequest): Promise<Advisory> {
    logger.info({ domainSlug: request.domainSlug, style: request.style }, 'Generating AI advisory plan');

    const prompt = buildAdvisoryPrompt({
      domainSlug: request.domainSlug,
      inputs: request.inputs,
      style: request.style,
      language: request.language,
    });

    const advisory = await this.client.generateStructuredAdvisory(prompt);

    logger.info(
      {
        domainSlug: request.domainSlug,
        title: advisory.title,
        confidence: advisory.confidence.score,
      },
      'AI advisory plan generated successfully'
    );

    return advisory;
  }
}

export const advisoryAiService = new AdvisoryAiService();
