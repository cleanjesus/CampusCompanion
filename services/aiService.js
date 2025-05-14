const { InferenceClient } = require("@huggingface/inference");

class AIService {
  constructor(apiKey) {
    this.client = new InferenceClient(apiKey);
    this.provider = "novita";
    this.model = "deepseek-ai/DeepSeek-V3-0324";
  }

  async getResponse(systemPrompt, userMessage) {
    try {
      const response = await this.client.chatCompletion({
        provider: this.provider,
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      });
      return response.choices[0].message.content;
    } catch (error) {
      console.error("AI Service error:", error);
      throw error;
    }
  }
}

module.exports = AIService;
