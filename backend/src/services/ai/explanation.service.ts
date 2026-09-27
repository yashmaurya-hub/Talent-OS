export interface CandidateExplanationInput {
  candidateName: string;
  taskTitle: string;
  suitabilityScore: number;
  rank: number;
  evidenceItems: {
    factorName: string;
    factorScore: number;
    rawEvidenceSummary: string;
  }[];
  missingDataNotes: string[];
  strengths: string[];
  growthAreas: string[];
}

/**
 * AI Explanation Layer:
 * Grounded strictly in factual records. Zero hallucinated skills or achievements.
 * Uses Gemini API when GEMINI_API_KEY is configured, with zero-downtime deterministic fallback.
 */
export async function generateCandidateExplanation(
  input: CandidateExplanationInput
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim() !== '') {
    try {
      const prompt = `You are the explainability engine of TalentOS (Human Potential Intelligence Platform).
Explain why ${input.candidateName} was ranked #${input.rank} for "${input.taskTitle}" with a suitability score of ${input.suitabilityScore}%.

CRITICAL RULE:
You MUST base your explanation ONLY on the following verified facts.
Do NOT invent or extrapolate any unlisted achievements, skills, or traits.

VERIFIED EVIDENCE:
${input.evidenceItems.map((e) => `- ${e.factorName}: ${e.rawEvidenceSummary} (${e.factorScore}%)`).join('\n')}

MISSING DATA NOTICES:
${input.missingDataNotes.length > 0 ? input.missingDataNotes.join('\n') : 'None'}

Produce a concise, professional 2-3 sentence explanation suitable for an executive/head of organization. Explicitly mention missing data if any was noted.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2, // Low temperature for high factual precision
              maxOutputTokens: 250,
            },
          }),
        }
      );

      if (response.ok) {
        const json = await response.json();
        const generated = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generated && generated.trim()) {
          return generated.trim();
        }
      }
    } catch (err) {
      console.warn('Gemini API call failed, reverting to deterministic synthesis engine:', err);
    }
  }

  // Deterministic grounded synthesis fallback
  return buildDeterministicExplanation(input);
}

function buildDeterministicExplanation(input: CandidateExplanationInput): string {
  const topEvidence = input.evidenceItems
    .filter((e) => !e.factorName.includes('(Missing)'))
    .sort((a, b) => b.factorScore - a.factorScore);

  const sentences: string[] = [];

  if (topEvidence.length > 0) {
    const lead = topEvidence[0];
    sentences.push(
      `${input.candidateName} was recommended with a ${input.suitabilityScore}% suitability score because of verified mastery in ${lead.factorName} (${lead.rawEvidenceSummary}).`
    );
  } else {
    sentences.push(
      `${input.candidateName} was evaluated with an alignment score of ${input.suitabilityScore}% across available records.`
    );
  }

  if (topEvidence.length > 1) {
    const secondary = topEvidence[1];
    sentences.push(
      `This is strongly reinforced by ${secondary.factorName} where records confirm: "${secondary.rawEvidenceSummary}".`
    );
  }

  if (input.missingDataNotes.length > 0) {
    sentences.push(
      `Data note: ${input.missingDataNotes[0]} This was evaluated with a confidence discount rather than assumption.`
    );
  }

  return sentences.join(' ');
}
