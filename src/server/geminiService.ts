import { GoogleGenAI, Type } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;

let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface StructuredIncidentResult {
  chief_complaint: string;
  patient_reported_observations: string[];
  triage_urgency: 'RED' | 'YELLOW' | 'GREEN';
  triage_rationale: string;
  concise_responder_briefing: string;
  missing_critical_information: string[];
  hospital_resource_recommendation: string[];
  disclaimer: string;
}

export async function structureEmergencyIncident(rawInput: string): Promise<StructuredIncidentResult> {
  if (!aiClient) {
    throw new Error('Gemini API is not configured on the server.');
  }

  const prompt = `You are TRAUMANET's emergency intake reasoning engine.
Your sole job is to structure raw patient/bystander-reported emergency observations into an actionable, standardized responder briefing.

STRICT CLINICAL SAFETY RULES:
1. You are NOT a doctor. You must NOT diagnose diseases or clinical pathology.
2. Do NOT invent injuries, vitals, or findings not stated or directly observed by the reporter.
3. Every output MUST contain the exact disclaimer: "AI-ASSISTED SUMMARY — NOT A MEDICAL DIAGNOSIS".
4. Determine triage urgency based on standard emergency triage principles (RED = immediate life threat/severe trauma/unconscious/respiratory failure, YELLOW = urgent/severe pain/fractures/controlled bleeding, GREEN = non-urgent/minor).
5. Extract what the patient/bystander explicitly reported, and identify any critical missing information that responders or ER doctors must verify immediately upon arrival.

Raw Emergency Input:
"${rawInput}"`;

  const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest'];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      const response = await aiClient.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              chief_complaint: {
                type: Type.STRING,
                description: 'Concise summary of the primary reported trauma or medical complaint.',
              },
              patient_reported_observations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'List of factual observations reported by the patient or bystander.',
              },
              triage_urgency: {
                type: Type.STRING,
                description: 'Triage urgency level: RED, YELLOW, or GREEN.',
              },
              triage_rationale: {
                type: Type.STRING,
                description: 'Brief reason for this urgency assignment based on reported symptoms.',
              },
              concise_responder_briefing: {
                type: Type.STRING,
                description: '30-second situational awareness briefing for trauma team and paramedics.',
              },
              missing_critical_information: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'High-priority questions or vitals that must be collected immediately.',
              },
              hospital_resource_recommendation: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Likely hospital capabilities required (e.g. CT scanner, Orthopedic Surgery, Blood Bank).',
              },
              disclaimer: {
                type: Type.STRING,
                description: 'Must be "AI-ASSISTED SUMMARY — NOT A MEDICAL DIAGNOSIS"',
              },
            },
            required: [
              'chief_complaint',
              'patient_reported_observations',
              'triage_urgency',
              'triage_rationale',
              'concise_responder_briefing',
              'missing_critical_information',
              'hospital_resource_recommendation',
              'disclaimer',
            ],
          },
        },
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text) as StructuredIncidentResult;
        parsed.disclaimer = 'AI-ASSISTED SUMMARY — NOT A MEDICAL DIAGNOSIS';
        return parsed;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${modelName} transient issue:`, err?.message || err);
      // Wait 500ms before next attempt
      await new Promise((r) => setTimeout(r, 600));
    }
  }

  throw lastError || new Error('Emergency AI structuring service is currently unavailable.');
}

export async function transcribeEmergencyAudio(audioBase64: string, mimeType = 'audio/webm'): Promise<string> {
  if (!aiClient) {
    throw new Error('Gemini API is not configured on the server.');
  }

  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: audioBase64,
            },
          },
          {
            text: 'Transcribe this emergency voice recording verbatim. Do not add commentary or interpretations.',
          },
        ],
      },
    });

    const transcript = response.text?.trim();
    if (!transcript) {
      throw new Error('Empty transcription');
    }
    return transcript;
  } catch (err) {
    console.error('Audio transcription error:', err);
    throw new Error('Speech-to-text service unavailable.');
  }
}
