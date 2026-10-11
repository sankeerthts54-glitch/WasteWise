import type { AdvisoryRecord, Advisory } from 'wastewise-shared';

export const formatAdvisoryMarkdown = (advisory: AdvisoryRecord): string => {
  const output = advisory.output as Advisory | null;
  const dateStr = new Date(advisory.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const lines: string[] = [
    `# ${advisory.title || 'WasteWise Environmental Advisory'}`,
    ``,
    `> **Domain:** ${advisory.domainSlug}  `,
    `> **Date:** ${dateStr}  `,
    `> **Engine:** ${advisory.model || 'Gemini 2.5 Flash'} (${advisory.latencyMs ? (advisory.latencyMs / 1000).toFixed(1) + 's' : ''})  `,
    `> **Style:** ${advisory.style} | **Language:** ${advisory.language}`,
    ``,
  ];

  if (output) {
    if (output.summary) {
      lines.push(`## Executive Summary`, ``, output.summary, ``);
    }

    if (output.confidence) {
      lines.push(
        `**Confidence Score:** ${Math.round(output.confidence.score * 100)}%  `,
        `*${output.confidence.explanation}*`,
        ``
      );
    }

    if (output.keyInsights && output.keyInsights.length > 0) {
      lines.push(`## Key Strategic Insights`, ``);
      output.keyInsights.forEach((insight) => {
        lines.push(`- ${insight}`);
      });
      lines.push(``);
    }

    if (output.recommendations && output.recommendations.length > 0) {
      lines.push(`## Recommendations`, ``);
      output.recommendations.forEach((rec, idx) => {
        lines.push(
          `### ${idx + 1}. ${rec.title} [Priority: ${rec.priority.toUpperCase()} | Effort: ${rec.estimatedEffort}]`,
          ``,
          rec.rationale,
          ``
        );
      });
    }

    if (output.actionPlan && output.actionPlan.length > 0) {
      lines.push(`## Action Plan`, ``);
      output.actionPlan.forEach((step) => {
        lines.push(`- [ ] **Step ${step.step} (${step.timeframe}):** ${step.action}`);
      });
      lines.push(``);
    }

    if (output.risks && output.risks.length > 0) {
      lines.push(`## Hazards & Risk Mitigation`, ``);
      output.risks.forEach((risk, idx) => {
        lines.push(
          `### Risk ${idx + 1}: ${risk.description} (Severity: ${risk.severity.toUpperCase()})`,
          `**Mitigation:** ${risk.mitigation}`,
          ``
        );
      });
    }

    if (output.resources && output.resources.length > 0) {
      lines.push(`## Authorized Resources & Frameworks`, ``);
      output.resources.forEach((res) => {
        lines.push(`- **${res.name}:** ${res.description}`);
      });
      lines.push(``);
    }

    if (output.disclaimer) {
      lines.push(
        `---`,
        ``,
        `*Disclaimer: ${output.disclaimer}*`,
        ``
      );
    }
  }

  // Submitted Context
  if (advisory.inputs && Object.keys(advisory.inputs).length > 0) {
    lines.push(`## Submitted Context`, ``);
    Object.entries(advisory.inputs).forEach(([k, v]) => {
      lines.push(`- **${k}:** ${Array.isArray(v) ? v.join(', ') : String(v)}`);
    });
    lines.push(``);
  }

  lines.push(`*Generated via WasteWise (WeMakeDevs x AWS Environmental Hacks 2026)*`);

  return lines.join('\n');
};

export const downloadTextFile = (filename: string, content: string, mimeType: string = 'text/plain') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
