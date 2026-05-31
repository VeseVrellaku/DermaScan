import { AI_DOCTOR_API_BASE_URL } from '../config/env.js';

export async function getLiveKitToken(name = 'DermaScan User') {
  const response = await fetch(
    `${AI_DOCTOR_API_BASE_URL}/getToken?name=${encodeURIComponent(name)}`,
  );

  if (!response.ok) {
    throw new Error('Failed to retrieve LiveKit token');
  }

  return response.json();
}
