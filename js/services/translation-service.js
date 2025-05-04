// Google 번역 API 연동
window.translationService = {
  async translate(text, targetLang) {
    const apiKey = window.APP_CONFIG.GOOGLE_TRANSLATE_API_KEY;
    if (!apiKey) return text;
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, target: targetLang })
    });
    const data = await res.json();
    return data.data?.translations?.[0]?.translatedText || text;
  }
};
