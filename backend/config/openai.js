import OpenAI from "openai";
import { env } from "./env.js";

/**
 * Singleton instance of the official OpenAI API client
 * Initialized lazily to ensure environment variables are loaded and avoid instantiating
 * on cold-start when optional.
 */
let openAiClientInstance = null;

/**
 * Check whether OpenAI integration is configured without leaking the secret key
 * @returns {boolean}
 */
export const isOpenAiConfigured = () => {
    const key = process.env.OPENAI_API_KEY !== undefined ? process.env.OPENAI_API_KEY : env.OPENAI_API_KEY;
    return Boolean(key && key.trim().length > 0);
};

/**
 * Get configured OpenAI model identifier with safe fallback
 * @returns {string}
 */
export const getOpenAiModel = () => {
    return process.env.OPENAI_MODEL?.trim() || env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
};

/**
 * Get or initialize the official OpenAI client singleton
 * @param {object} [overrideOptions] - Optional configuration overrides (e.g. for testing)
 * @returns {OpenAI} Initialized OpenAI client
 * @throws {Error} If OPENAI_API_KEY is not configured
 */
export const getOpenAiClient = (overrideOptions = null) => {
    const targetApiKey = overrideOptions?.apiKey !== undefined
        ? overrideOptions.apiKey
        : (process.env.OPENAI_API_KEY !== undefined ? process.env.OPENAI_API_KEY : env.OPENAI_API_KEY);

    if (!targetApiKey || targetApiKey.trim().length === 0) {
        const err = new Error(
            "OpenAI API key is not configured. Please set OPENAI_API_KEY in the server environment."
        );
        err.statusCode = 503;
        err.code = "OPENAI_NOT_CONFIGURED";
        throw err;
    }

    if (overrideOptions && Object.keys(overrideOptions).length > 0) {
        return new OpenAI({
            apiKey: targetApiKey.trim(),
            timeout: overrideOptions.timeout || 30000,
            maxRetries: overrideOptions.maxRetries ?? 2,
            ...overrideOptions
        });
    }

    if (!openAiClientInstance) {
        openAiClientInstance = new OpenAI({
            apiKey: targetApiKey.trim(),
            timeout: 30000, // 30-second request timeout limit
            maxRetries: 2 // Bounded retries for transient connection errors
        });
    }

    return openAiClientInstance;
};

/**
 * Reset singleton instance (useful in test teardown/isolation)
 */
export const resetOpenAiClient = () => {
    openAiClientInstance = null;
};

/**
 * Set singleton instance for testing/mocking
 */
export const setOpenAiClientInstance = (mockClient) => {
    openAiClientInstance = mockClient;
};

// Backward-compatible default export proxy
const defaultClientProxy = new Proxy({}, {
    get(target, prop) {
        const client = getOpenAiClient();
        const value = client[prop];
        return typeof value === "function" ? value.bind(client) : value;
    }
});

export default defaultClientProxy;
