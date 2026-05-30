export const env = {
  plateRecognizerApiToken: process.env.PLATE_RECOGNIZER_API_TOKEN ?? '',
  plateRecognizerEnabled: process.env.PLATE_RECOGNIZER_API_TOKEN
    ? process.env.PLATE_RECOGNIZER_API_TOKEN !== 'YOUR_API_TOKEN_HERE'
    : false,
} as const;