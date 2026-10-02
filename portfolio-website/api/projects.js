export default async function handler(req, res) {
  try {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/Projects?select=*`,
      {
        headers: {
          apikey: process.env.SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_PUBLISHABLE_KEY}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data
      });
    }

    return res.status(200).json({
      projects: data
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
}
