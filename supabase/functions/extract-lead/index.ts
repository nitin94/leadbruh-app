import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EXTRACTION_PROMPT = `You are a lead extraction assistant. Extract structured contact information from this text (which may be a voice transcription or typed note from a trade show).

Text to analyze:
"""
{TEXT}
"""

Return ONLY a valid JSON object with these fields (use null for any field not mentioned):
{
  "name": "Person's full name",
  "company": "Company/organization name",
  "title": "Job title if mentioned",
  "email": "Email if mentioned",
  "phone": "Phone if mentioned",
  "notes": "Any other relevant details (interests, follow-up items, context)",
  "confidence": 0.0 to 1.0 (your confidence in the extraction)
}

Important:
- Extract only what is explicitly stated or strongly implied
- For names, try to get the full name if possible
- "notes" should capture buying intent, interests, action items, or context
- If text is very sparse (just a name), set confidence lower
- Return ONLY the JSON object, no other text`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured')
    }

    const { text } = await req.json()

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'No text provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const prompt = EXTRACTION_PROMPT.replace('{TEXT}', text)

    // Call OpenAI GPT-4o-mini API (faster and cheaper for text)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.1,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI API error:', error)
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const result = await response.json()
    const content = result.choices[0]?.message?.content

    if (!content) {
      throw new Error('No response from OpenAI')
    }

    // Parse JSON from response
    let extracted
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        extracted = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (e) {
      console.error('Failed to parse OpenAI response:', content)
      // Return basic structure with the text as notes
      extracted = {
        name: null,
        company: null,
        title: null,
        email: null,
        phone: null,
        notes: text,
        confidence: 0.3
      }
    }

    return new Response(
      JSON.stringify(extracted),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Lead extraction error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
