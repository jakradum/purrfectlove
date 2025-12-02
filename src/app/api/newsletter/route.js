const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = 'app6vMMHm7mdE7dZA';
const AIRTABLE_TABLE_NAME = 'Table 1';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body;

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return Response.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Send to Airtable
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          records: [
            {
              fields: {
                Email: email,
                Date: new Date().toISOString().split('T')[0],
              },
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Airtable error:', errorData);
      return Response.json(
        { error: 'Failed to subscribe. Please try again.' },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: 'Successfully subscribed!',
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return Response.json(
      { error: 'Failed to subscribe. Please try again.' },
      { status: 500 }
    );
  }
}
