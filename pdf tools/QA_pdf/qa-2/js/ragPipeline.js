/**
 * QA-2 RAG Pipeline — Pure Frontend Edition
 * No server needed. Calls Gemini directly from the browser.
 */

const GEMINI_API_KEY = "AIzaSyCy0jkTtlh8UbqDwddH6pPtvpoTgEbryOQ";

/**
 * Parse a PDF file and extract text using PDF.js
 */
async function parsePDF(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const typedArray = new Uint8Array(arrayBuffer);

        // Use the loading task with cMapUrl for better character support
        const loadingTask = pdfjsLib.getDocument({
            data: typedArray,
            cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
            cMapPacked: true,
        });

        const pdf = await loadingTask.promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map(item => item.str)
                .join(' ');
            fullText += pageText + '\n\n';
        }

        return { text: fullText.trim(), pages: pdf.numPages };
    } catch (err) {
        console.error('PDF Parse Error:', err);
        throw new Error('PDF parsing failed: ' + (err.message || String(err)));
    }
}

/**
 * Stream a response from Gemini API directly (no server needed).
 */
async function generateResponseStream(query, context, onChunk) {
    const systemPrompt = `You are an intelligent document analysis assistant. Based on the following document context, provide a clear and detailed answer to the user's question. Include citations where possible. If the answer is not found in the context, say so.

Document Context:
---
${context.substring(0, 30000)}
---

Question: ${query}`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${GEMINI_API_KEY}`;

    const payload = {
        contents: [{ role: "user", parts: [{ text: systemPrompt }] }]
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Gemini API error ${response.status}: ${errText.substring(0, 200)}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Extract all "text": "..." values from the buffered stream
            const matches = [...buffer.matchAll(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/g)];
            for (const match of matches) {
                let text = match[1]
                    .replace(/\\n/g, '\n')
                    .replace(/\\t/g, '\t')
                    .replace(/\\"/g, '"')
                    .replace(/\\\\/g, '\\');
                onChunk(text);
            }

            // Keep only the last partial chunk in buffer (after last complete match)
            const lastMatchEnd = matches.length > 0
                ? buffer.lastIndexOf(matches[matches.length - 1][0]) + matches[matches.length - 1][0].length
                : 0;
            buffer = buffer.substring(lastMatchEnd);
        }
    } catch (error) {
        console.error("Gemini Stream Error:", error);
        onChunk(`\n\n**Error:** ${error.message}`);
    }
}
