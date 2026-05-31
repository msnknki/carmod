const {GoogleGenerativeAI} = require('@google/generative-ai');
const {GoogleAuth} = require('google-auth-library');
const axios = require('axios');

const API_KEY_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
const VERTEX_MODEL = process.env.GEMINI_VERTEX_MODEL || 'gemini-2.0-flash';

function parseServiceAccountJson() {
  const inline = process.env.GCP_SERVICE_ACCOUNT_JSON?.trim();
  if (inline) {
    return JSON.parse(inline);
  }
  const filePath = process.env.GCP_SERVICE_ACCOUNT_PATH?.trim();
  if (filePath) {

    return require(filePath);
  }
  return null;
}

function getAuthMode() {
  if (process.env.GEMINI_AUTH_MODE === 'api_key') {
    return 'api_key';
  }
  if (process.env.GEMINI_AUTH_MODE === 'vertex') {
    return 'vertex';
  }
  if (parseServiceAccountJson()) {
    return 'vertex';
  }
  return 'api_key';
}

function getVertexConfig() {
  const credentials = parseServiceAccountJson();
  if (!credentials) {
    throw new Error(
      'Vertex mode requires GCP_SERVICE_ACCOUNT_JSON (full service account JSON on Render) or GCP_SERVICE_ACCOUNT_PATH for local dev.',
    );
  }
  const project =
    process.env.GCP_PROJECT_ID?.trim() || credentials.project_id;
  const location = process.env.GCP_LOCATION?.trim() || 'us-central1';
  if (!project) {
    throw new Error('GCP_PROJECT_ID is missing and service account JSON has no project_id.');
  }
  return {credentials, project, location};
}

function getGenAI() {
  const key = process.env.GEMINI_API_KEY;
  if (!key?.trim()) {
    throw new Error(
      'GEMINI_API_KEY is not set. Use an AI Studio key, or switch to Vertex: set GCP_SERVICE_ACCOUNT_JSON on Render.',
    );
  }
  return new GoogleGenerativeAI(key);
}

function classifyGeminiError(err) {
  const msg = err?.message || String(err);
  const status = err?.status || err?.response?.status;

  if (
    /credits are depleted|prepayment credits|billing|quota exceeded|RESOURCE_EXHAUSTED/i.test(
      msg,
    )
  ) {
    return new Error(
      'Gemini API credits are exhausted. For GCP trial credits, use Vertex mode: add a service account JSON as GCP_SERVICE_ACCOUNT_JSON on Render (see backend/gcp.vertex.env.template).',
    );
  }
  if (/SERVICE_DISABLED|Vertex AI API|aiplatform/i.test(msg)) {
    return new Error(
      'Enable the Vertex AI API on your GCP project and grant the service account the Vertex AI User role.',
    );
  }
  if (status === 401 || status === 403 || /API key not valid|API_KEY_INVALID|PERMISSION_DENIED/i.test(msg)) {
    return new Error(
      'Google AI authentication failed. Check GEMINI_API_KEY or your service account roles on GCP.',
    );
  }
  if (status === 429 || msg.includes('429') || status === 503 || msg.includes('503')) {
    return new Error('AI service is busy — please wait a moment and try again.');
  }
  return err instanceof Error ? err : new Error(msg || 'AI request failed');
}

async function withRetry(fn, retries = 3) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      const classified = classifyGeminiError(err);
      const msg = err?.message || '';
      const retryable =
        classified.message.includes('busy') &&
        (msg.includes('429') || msg.includes('503') || err?.status === 429 || err?.status === 503);
      if (retryable && i < retries) {
        await new Promise(r => setTimeout(r, (i + 1) * 2000));
        continue;
      }
      throw classified;
    }
  }
}

async function getVertexAccessToken(credentials) {
  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  if (!tokenResponse.token) {
    throw new Error('Failed to obtain Vertex AI access token from service account.');
  }
  return tokenResponse.token;
}

async function vertexGenerateContent({contents, generationConfig, model}) {
  const {credentials, project, location} = getVertexConfig();
  const token = await getVertexAccessToken(credentials);
  const modelId = model || VERTEX_MODEL;
  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${modelId}:generateContent`;

  const response = await axios.post(
    url,
    {
      contents,
      ...(generationConfig ? {generationConfig} : {}),
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 90000,
    },
  );

  const parts = response.data?.candidates?.[0]?.content?.parts || [];
  return parts.map(p => p.text || '').join('').trim();
}

async function generateTextApiKey(prompt, options = {}) {
  const model = getGenAI().getGenerativeModel({
    model: options.model || API_KEY_MODEL,
    ...(options.generationConfig ? {generationConfig: options.generationConfig} : {}),
  });
  return model.generateContent(prompt).then(r => r.response.text());
}

async function generateTextVertex(prompt, options = {}) {
  return vertexGenerateContent({
    model: options.model || VERTEX_MODEL,
    generationConfig: options.generationConfig,
    contents: [{role: 'user', parts: [{text: prompt}]}],
  });
}

async function generateText(prompt, options = {}) {
  if (getAuthMode() === 'vertex') {
    return withRetry(() => generateTextVertex(prompt, options));
  }
  return withRetry(() => generateTextApiKey(prompt, options));
}

async function generateChat({
  systemText,
  message,
  history = [],
  imageDataUrl = null,
  generationConfig,
  model,
}) {
  const run = async () => {
    if (getAuthMode() === 'vertex') {
      const contents = [];
      if (systemText) {
        contents.push({role: 'user', parts: [{text: systemText}]});
        contents.push({role: 'model', parts: [{text: 'Understood.'}]});
      }
      for (const msg of history) {
        contents.push({
          role: msg.role === 'ai' ? 'model' : 'user',
          parts: [{text: msg.content}],
        });
      }
      const userParts = [];
      if (imageDataUrl) {
        const match = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          userParts.push({inlineData: {mimeType: match[1], data: match[2]}});
        }
      }
      userParts.push({text: message});
      contents.push({role: 'user', parts: userParts});
      return vertexGenerateContent({
        model: model || VERTEX_MODEL,
        generationConfig,
        contents,
      });
    }

    const genModel = getGenAI().getGenerativeModel({
      model: model || API_KEY_MODEL,
      ...(generationConfig ? {generationConfig} : {}),
    });
    const chat = genModel.startChat({
      history: [
        ...(systemText
          ? [
              {role: 'user', parts: [{text: systemText}]},
              {role: 'model', parts: [{text: 'Understood.'}]},
            ]
          : []),
        ...history.map(msg => ({
          role: msg.role === 'ai' ? 'model' : 'user',
          parts: [{text: msg.content}],
        })),
      ],
    });
    let msgParts;
    if (imageDataUrl) {
      const match = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        msgParts = [
          {inlineData: {mimeType: match[1], data: match[2]}},
          {text: message},
        ];
      }
    }
    const result = await chat.sendMessage(msgParts ?? message);
    return result.response.text();
  };

  return withRetry(run);
}

module.exports = {
  API_KEY_MODEL,
  VERTEX_MODEL,
  getAuthMode,
  getGenAI,
  withRetry,
  generateText,
  generateChat,
  classifyGeminiError,
};
