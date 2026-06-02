const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(
  "AQ.Ab8RN6KTd551C4rOUcCywEZGgbLUIkEhQXA0KBWpiVc3P-4rMg"
);

async function run() {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash"
  });

  const result = await model.generateContent(
    "Say hello"
  );

  console.log(result.response.text());
}

run();