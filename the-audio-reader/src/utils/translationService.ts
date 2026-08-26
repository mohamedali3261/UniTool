/**
 * Client-side Translation Service using secure, public endpoints.
 * Automatically detects source language and translates to the target language.
 */
export async function translateText(text: string, toLanguage: 'ar' | 'en'): Promise<string> {
  if (!text || !text.trim()) return '';

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${toLanguage}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    let translatedText = '';
    if (data && data[0]) {
      data[0].forEach((sentence: any) => {
        if (sentence[0]) {
          translatedText += sentence[0];
        }
      });
    }
    
    return translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    throw new Error('Failed to translate page text.');
  }
}
