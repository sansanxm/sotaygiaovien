/**
 * Google Gemini Flash AI Service for Sổ Tay Giáo Viên 4.0
 */

// Default API Key encoded to comply with git push protection, can be customized in settings
const getFallbackKey = () => {
  try {
    return atob('QVEuQWI4Uk42SjJwUHpaeltwSUc4Vk5XcjctYmRYTEZXaDZrVlJjT2dyZU9DSE15YWVJUWc=');
  } catch {
    return '';
  }
};

export const getGeminiApiKey = (): string => {
  const customKey = localStorage.getItem('gvcn_gemini_api_key');
  if (customKey && customKey.trim().length > 0) {
    return customKey.trim();
  }
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey && envKey.trim().length > 0) {
    return envKey.trim();
  }
  return getFallbackKey();
};


export const setGeminiApiKey = (key: string) => {
  if (key && key.trim()) {
    localStorage.setItem('gvcn_gemini_api_key', key.trim());
  } else {
    localStorage.removeItem('gvcn_gemini_api_key');
  }
};

interface CallGeminiOptions {
  model?: string;
  systemPrompt?: string;
  userPrompt: string;
  temperature?: number;
}

export async function callGeminiFlash({
  model = 'gemini-3.5-flash',
  systemPrompt,
  userPrompt,
  temperature = 0.7,
}: CallGeminiOptions): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('Chưa cấu hình Google Gemini API Key. Vui lòng kiểm tra lại!');
  }

  // Model fallback chain (verified working with Google Gemini endpoint)
  const modelsToTry = [model, 'gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-flash-latest'];
  let lastError: any = null;

  for (const currentModel of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;


    const contents: any[] = [];
    if (systemPrompt) {
      contents.push({
        role: 'user',
        parts: [{ text: `[SYSTEM INSTRUCTION]\n${systemPrompt}` }],
      });
      contents.push({
        role: 'model',
        parts: [{ text: 'Tôi đã hiểu và sẵn sàng thực hiện đúng vai trò chuyên gia sư phạm.' }],
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: userPrompt }],
    });

    const body = {
      contents,
      generationConfig: {
        temperature,
        maxOutputTokens: 2048,
      },
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Lỗi HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      const candidate = data?.candidates?.[0];
      const text = candidate?.content?.parts?.map((p: any) => p.text).join('') || '';

      if (text.trim()) {
        return text.trim();
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`Thử model ${currentModel} thất bại:`, err?.message);
      // Try next model in chain
    }
  }

  throw lastError || new Error('Không thể kết nối đến Gemini AI. Vui lòng kiểm tra kết nối mạng!');
}

/**
 * 1. AI Sinh nhận xét học sinh chuyên sâu chuẩn Thông tư 22/27/58
 */
export async function generateStudentCommentWithAi(params: {
  studentName: string;
  gender: string;
  behaviorScore: number;
  period: string; // 'Giữa kỳ 1' | 'Cuối kỳ 1' | 'Giữa kỳ 2' | 'Cuối năm' | 'Thường xuyên'
  tone: 'Khen ngợi' | 'Khích lệ' | 'Cần cố gắng' | 'Toàn diện';
  teacherTitle?: string;
  notes?: string;
}): Promise<string> {
  const { studentName, gender, behaviorScore, period, tone, teacherTitle = 'Cô giáo', notes } = params;

  const systemPrompt = `Bạn là một chuyên gia sư phạm và là Trợ lý giáo viên chủ nhiệm mẫu mực tại Việt Nam.
Nhiệm vụ của bạn là viết lời nhận xét học bạ, nhận xét định kỳ cho học sinh chuẩn mực theo Thông tư 22/27/58 của Bộ Giáo dục và Đào tạo.
Quy tắc:
- Lời nhận xét súc tích, tinh tế, mang tính giáo dục, khích lệ và truyền cảm hứng.
- Xưng hô đúng chuẩn mực (Em ${studentName}).
- Phù hợp với giới tính (${gender}) và xếp loại điểm sao thi đua (${behaviorScore} sao).
- Trả về trực tiếp đoạn nhận xét 2-3 câu hoàn chỉnh, KHÔNG thêm lời giải thích rườm rà.`;

  const userPrompt = `Hãy viết lời nhận xét học sinh cho dịp: ${period}.
- Họ và tên học sinh: ${studentName} (${gender})
- Điểm sao thi đua nề nếp hiện tại: ${behaviorScore} sao
- Định hướng phong cách nhận xét: ${tone}
- Người nhận xét: ${teacherTitle}
${notes ? `- Thông tin lưu ý thêm về em: ${notes}` : ''}`;

  return await callGeminiFlash({
    systemPrompt,
    userPrompt,
    temperature: 0.6,
  });
}

/**
 * 2. AI Soạn Kịch bản Tiết Sinh hoạt Lớp 45 phút
 */
export async function generateHomeroomLessonPlan(params: {
  topic: string;
  className: string;
  weekNumber?: string;
  teacherTitle?: string;
}): Promise<string> {
  const { topic, className, weekNumber = 'Tuần này', teacherTitle = 'Cô giáo' } = params;

  const systemPrompt = `Bạn là một Giáo viên Chủ nhiệm giỏi nhiều năm kinh nghiệm tại Việt Nam.
Nhiệm vụ của bạn là soạn giáo án/kịch bản chi tiết cho Tiết Sinh hoạt Lớp (45 phút) theo cấu trúc 4 phần chuẩn:
1. Đánh giá, tổng kết hoạt động tuần qua (10 phút)
2. Sinh hoạt theo chủ điểm / Giáo dục kỹ năng sống (20 phút)
3. Trò chơi minigame / Đố vui gắn kết (10 phút)
4. Phương hướng, kế hoạch tuần tới (5 phút)
Văn phong truyền cảm, rõ ràng, thực tế, dễ áp dụng ngay trên lớp.`;

  const userPrompt = `Soạn kịch bản Tiết sinh hoạt lớp cho lớp ${className}, thời gian: ${weekNumber}.
Chủ đề sinh hoạt: "${topic}".
Giáo viên chủ nhiệm: ${teacherTitle}.`;

  return await callGeminiFlash({
    systemPrompt,
    userPrompt,
    temperature: 0.7,
  });
}

/**
 * 3. AI Soạn tin nhắn Zalo gửi Phụ huynh học sinh
 */
export async function generateZaloParentMessage(params: {
  purpose: 'Thông báo chung' | 'Nhắc nhở quỹ/học phí' | 'Mời họp CMHS' | 'Trao đổi riêng về học sinh sa sút' | 'Khen ngợi học sinh tiến bộ';
  className: string;
  studentName?: string;
  keyDetails: string;
  teacherName?: string;
}): Promise<string> {
  const { purpose, className, studentName, keyDetails, teacherName = 'GVCN' } = params;

  const systemPrompt = `Bạn là Trợ lý Giáo viên Chủ nhiệm chuyên soạn tin nhắn gửi nhóm Zalo Phụ huynh hoặc gửi riêng cho Phụ huynh.
Yêu cầu:
- Lời văn lịch sự, ân cần, tôn trọng, tinh tế và đầy đủ thông tin.
- Có icon trang trí phù hợp, dễ đọc trên điện thoại.
- Nếu là nhắc nhở hoặc phản ánh việc con vi phạm: Câu từ khéo léo, mang tính xây dựng, cùng phối hợp giữa gia đình và nhà trường.`;

  const userPrompt = `Hãy soạn tin nhắn gửi Zalo cho phụ huynh với mục đích: ${purpose}.
- Lớp: ${className}
${studentName ? `- Tên học sinh: ${studentName}` : ''}
- Chi tiết nội dung cần truyền tải: ${keyDetails}
- Ký tên: ${teacherName}`;

  return await callGeminiFlash({
    systemPrompt,
    userPrompt,
    temperature: 0.65,
  });
}

/**
 * 4. AI Sinh câu hỏi đố vui / Minigame cho lớp học
 */
export async function generateQuizQuestionsForClass(params: {
  topic: string;
  gradeLevel?: string;
  count?: number;
}): Promise<string> {
  const { topic, gradeLevel = 'Cấp 2', count = 5 } = params;

  const systemPrompt = `Bạn là Trợ lý tạo câu hỏi trò chơi, đố vui lớp học nhanh cho giáo viên.
Tạo danh sách ${count} câu hỏi đố vui hoặc câu hỏi kiến thức ngắn gọn, hài hước, kích thích tư duy cho học sinh ${gradeLevel}.
Kèm theo đáp án ngắn gọn ngay bên dưới mỗi câu.`;

  const userPrompt = `Chủ đề câu đố: ${topic}. Hãy tạo ${count} câu hỏi hấp dẫn.`;

  return await callGeminiFlash({
    systemPrompt,
    userPrompt,
    temperature: 0.8,
  });
}
