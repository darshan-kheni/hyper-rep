const TAVILY_API = "https://api.tavily.com/search";

export type SearchResult = {
  title: string;
  url: string;
  content: string;
};

export async function webSearch(
  query: string,
  maxResults = 5
): Promise<{ results: SearchResult[]; answer?: string }> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error("TAVILY_API_KEY not configured");
  }

  const response = await fetch(TAVILY_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      max_results: maxResults,
      include_answer: "advanced",
      search_depth: "advanced",
      topic: "general",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Tavily search failed: ${response.status} — ${text}`);
  }

  const data = await response.json();

  return {
    answer: data.answer || undefined,
    results: (data.results || []).map(
      (r: { title: string; url: string; content: string }) => ({
        title: r.title,
        url: r.url,
        content: r.content,
      })
    ),
  };
}
