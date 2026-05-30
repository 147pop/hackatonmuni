import { NextRequest, NextResponse } from 'next/server';

const PLATE_RECOGNIZER_URL = 'https://api.platerecognizer.com/v1/plate-reader/';

export async function POST(req: NextRequest) {
  const apiToken = process.env.PLATE_RECOGNIZER_API_TOKEN;

  if (!apiToken || apiToken === 'YOUR_API_TOKEN_HERE') {
    return NextResponse.json(
      { error: 'PLATE_RECOGNIZER_API_TOKEN not configured', source: 'none' },
      { status: 503 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get('upload') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No image provided', source: 'none' },
        { status: 400 }
      );
    }

    const apiFormData = new FormData();
    apiFormData.append('upload', file);
    apiFormData.append('regions', 'ar');
    apiFormData.append('config', JSON.stringify({
      region: 'strict',
      mode: 'fast',
    }));

    const response = await fetch(PLATE_RECOGNIZER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiToken}`,
      },
      body: apiFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Plate Recognizer API error: ${response.status} ${errorText}`);
      return NextResponse.json(
        { error: `Plate Recognizer API error: ${response.status}`, source: 'plate-recognizer' },
        { status: 502 }
      );
    }

    const data = await response.json();

    const results: Array<{
      plate: string;
      score: number;
      region: { code: string; score: number };
      dscore: number;
      box: { xmin: number; ymin: number; xmax: number; ymax: number };
      candidates: Array<{ plate: string; score: number }>;
    }> = data.results ?? [];

    if (results.length === 0) {
      return NextResponse.json({
        plate: null,
        confidence: 0,
        source: 'plate-recognizer',
        candidates: [],
      });
    }

    const best = results[0];
    const topCandidates = best.candidates?.slice(0, 3) ?? [];

    return NextResponse.json({
      plate: best.plate?.toUpperCase().replace(/[^A-Z0-9]/g, '') ?? null,
      confidence: best.score ?? 0,
      region: best.region?.code ?? null,
      regionScore: best.region?.score ?? 0,
      dscore: best.dscore ?? 0,
      source: 'plate-recognizer',
      candidates: topCandidates.map((c: { plate: string; score: number }) => ({
        plate: c.plate.toUpperCase().replace(/[^A-Z0-9]/g, ''),
        score: c.score,
      })),
    });
  } catch (error) {
    console.error('Plate Recognizer proxy error:', error);
    return NextResponse.json(
      { error: 'Network error calling Plate Recognizer', source: 'plate-recognizer' },
      { status: 503 }
    );
  }
}