import type { AnalyzeResponse } from '../types';
import type { EmergencyCardResponse } from '../types';

/**
 * Truncates text cleanly without cutting off in the middle of a word.
 */
function cleanTruncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > 0
    ? truncated.slice(0, lastSpace) + '... (More details in MedLens report)'
    : truncated + '...';
}

/**
 * Formats the Emergency Card response into a clean, human-readable plain text string.
 */
export function formatEmergencyQRText(data: EmergencyCardResponse): string {
  const parts = [
    'MEDLENS EMERGENCY HEALTH CARD\n',
    'Patient Details',
    `Name: ${data.patient_name || 'Not in report'}`,
    `Blood Group: ${data.blood_type || 'Not in report'}`,
    '',
    'Medical Summary',
    'Primary Conditions:',
    data.conditions?.length
      ? data.conditions.map((c) => `- ${c}`).join('\n')
      : '- Not in report',
    '',
    `Allergies: ${data.allergies || 'Not in report'}`,
    `Current Medications: ${data.medications || 'Not in report'}`,
    '',
    'Urgency',
    `Level: ${data.urgency || 'Unknown'}`,
    '',
    'Emergency Notes',
    data.emergency_notes || 'This information was extracted from a medical report by MedLens. Confirm details with a doctor.',
  ];

  const payload = parts.join('\n').trim();
  // Safe limit around 1800 chars for good scan reliability
  return cleanTruncate(payload, 1800);
}

/**
 * Formats the Analysis Summary into a clean, human-readable plain text string.
 */
export function formatSummaryQRText(data: AnalyzeResponse): string {
  const parts = [
    'MEDLENS REPORT SUMMARY\n',
    `Patient: ${data.patient_name && data.patient_name !== 'Not available' ? data.patient_name : 'Unknown'}`,
    `Urgency: ${data.urgency?.level || 'Unknown'}`,
    '',
    'Summary',
    data.summary || 'No summary available.',
    '',
    'Safety Note',
    'AI-generated explanation. Confirm with a doctor.',
  ];

  const payload = parts.join('\n').trim();
  return cleanTruncate(payload, 1800);
}
