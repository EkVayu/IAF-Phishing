// api/proxy.js

export default async function handler(req, res) {
  const { pathname, search } = new URL(req.url, `https://${req.headers.host}`);
  const targetUrl = `http://35.154.97.4:8002${pathname}${search || ""}`; // The target HTTP API URL

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        host: "35.154.97.4", // Optional: set specific headers if needed
      },
      body:
        req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error proxying request", details: error.message });
  }
}
