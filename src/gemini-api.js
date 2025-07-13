// Gemini API helper với key mới
const GEMINI_API_KEY = 'AIzaSyDbSjSRboXDkxTSJHqogo1Hvmxl2cU9aVA';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

export const callGeminiAPI = async (prompt, imageBase64 = null) => {
  try {
    const requestBody = {
      contents: [{
        parts: []
      }]
    };

    // Thêm text prompt
    if (prompt) {
      requestBody.contents[0].parts.push({
        text: prompt
      });
    }

    // Thêm hình ảnh nếu có
    if (imageBase64) {
      requestBody.contents[0].parts.push({
        inline_data: {
          mime_type: "image/jpeg",
          data: imageBase64
        }
      });
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Không nhận được phản hồi hợp lệ từ Gemini API');
    }
  } catch (error) {
    console.error('Lỗi khi gọi Gemini API:', error);
    throw error;
  }
};

export const translateText = async (text, fromLang, toLang) => {
  const prompt = `Dịch văn bản sau từ ${fromLang} sang ${toLang}. Chỉ trả về kết quả dịch, không giải thích thêm:

"${text}"`;
  
  return await callGeminiAPI(prompt);
};

export const optimizeSchedule = async (schedule) => {
  const prompt = `Giúp tôi tối ưu hóa thời gian biểu sau và cho tôi gợi ý cải thiện:

${schedule}

Hãy phân tích và đưa ra những gợi ý cụ thể để tối ưu hóa thời gian học tập hiệu quả hơn.`;
  
  return await callGeminiAPI(prompt);
};

export const analyzeImageWithText = async (prompt, imageBase64) => {
  return await callGeminiAPI(prompt, imageBase64);
};

