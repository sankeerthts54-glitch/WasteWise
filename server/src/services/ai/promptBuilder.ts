import { DOMAINS, getDomainBySlug, DomainConfig } from 'wastewise-shared';
import { AppError } from '../../lib/errors';

export interface PromptInput {
  domainSlug: string;
  inputs: Record<string, unknown>;
  style?: 'concise' | 'detailed';
  language?: string;
}

export interface BuiltPrompt {
  systemInstruction: string;
  userPrompt: string;
}

const BASE_SYSTEM_INSTRUCTION = `You are WasteWise, an expert AI sustainability and resource management advisor specializing in India's urban and semi-urban environmental context.
Your goal is to deliver pragmatic, highly actionable, and contextually grounded guidance across waste segregation, e-waste compliance, recycling/upcycling, and rooftop solar/energy optimization.

Strict Guidelines:
1. Ground advice in Indian local realities (e.g. municipal rules like SWM Rules 2016, E-Waste Management Rules 2022, PM Surya Ghar Muft Bijli Yojana, DISCOM net metering, dry/wet/sanitary waste streams, authorized recyclers/PROs, scrap dealers/kabadiwalas).
2. Never give vague, generic, or hand-wavy suggestions. Give concrete metrics, specific timelines, realistic cost or savings estimates in Indian Rupees (₹), and practical steps.
3. Keep the output strictly focused on the user's specific inputs and constraints.
4. Output must strictly conform to the requested JSON schema without any markdown formatting wrappers or conversational fluff.`;

/**
 * Builds system instruction and domain-specific structured user prompt.
 */
export function buildAdvisoryPrompt(input: PromptInput): BuiltPrompt {
  const domain: DomainConfig | undefined = getDomainBySlug(input.domainSlug);
  if (!domain) {
    throw new AppError('VALIDATION_ERROR', `Invalid domain: '${input.domainSlug}'. Available domains: ${DOMAINS.map(d => d.slug).join(', ')}`);
  }

  const style = input.style || 'concise';
  const language = input.language || 'en';

  // Domain-specific prompt focus
  const domainContext = `Domain: ${domain.name} (${domain.slug})
Domain Category: ${domain.category}
Domain Core Focus: ${domain.promptFocus}`;

  // Format user inputs cleanly
  const formattedInputs = Object.entries(input.inputs)
    .map(([key, value]) => {
      const fieldDef = domain.fields.find(f => f.name === key);
      const label = fieldDef?.label || key;
      const displayVal = Array.isArray(value)
        ? value.join(', ')
        : typeof value === 'object' && value !== null
        ? JSON.stringify(value)
        : String(value ?? 'Not specified');
      return `- ${label} (${key}): ${displayVal}`;
    })
    .join('\n');

  const styleInstruction = style === 'detailed'
    ? 'Detail Level: Detailed. Provide thorough rationales, in-depth risk mitigations, and comprehensive multi-step action plans.'
    : 'Detail Level: Concise. Keep rationales punchy, direct, and immediately executable without sacrificing essential details.';

  const languageInstruction = language !== 'en'
    ? `Language: Respond in language code '${language}'. If technical or statutory terms are better known in English or Hinglish, keep them clear and intelligible for Indian users.`
    : 'Language: English (tailored with familiar Indian terminology where relevant, e.g., DISCOM, kabadiwala, dry/wet waste, RWA).';

  const userPrompt = `${domainContext}

${styleInstruction}
${languageInstruction}

User Provided Parameters:
${formattedInputs || '- None provided'}

Provide a comprehensive, validated advisory covering:
- Title: Clear, relevant, and engaging summary title (max 120 chars).
- Summary: Executive summary of the recommendations (min 20 chars).
- Key Insights: 2 to 8 distinct, high-impact observations or local regulatory notes.
- Recommendations: 2 to 8 prioritized recommendations with rationale, priority (high/medium/low), and estimatedEffort (low/medium/high).
- Risks: Practical risks, challenges, or regulatory traps with severity and practical mitigation steps.
- Action Plan: Sequential steps (1, 2, 3...) with concise action description and realistic timeframe (e.g., 'Days 1-3', 'Week 2', 'Month 1').
- Resources: Helpful local programs, portals, DISCOM links, PROs, or municipal bodies.
- Disclaimer: Important statutory or safety advisory disclaimer.
- Confidence: Score between 0.0 and 1.0 reflecting how complete the user inputs were, accompanied by a brief explanation.`;

  return {
    systemInstruction: BASE_SYSTEM_INSTRUCTION,
    userPrompt,
  };
}
