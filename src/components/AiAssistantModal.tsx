import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Copy,
  Check,
  Send,
  Loader2,
  Calendar,
  MessageCircle,
  HelpCircle,
  Bot,
  Crown,
  KeyRound,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  generateHomeroomLessonPlan,
  generateZaloParentMessage,
  generateQuizQuestionsForClass,
  callGeminiFlash,
  getGeminiApiKey,
  setGeminiApiKey,
} from '../services/gemini';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type AiTab = 'lesson-plan' | 'zalo' | 'quiz' | 'chat';

export const AiAssistantModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { currentClass, teacherTitle, teacherName, isVip, setShowVipModal, triggerConfetti } = useApp();

  const [activeTab, setActiveTab] = useState<AiTab>('lesson-plan');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [resultText, setResultText] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(() => getGeminiApiKey());
  const [authError, setAuthError] = useState<string | null>(null);

  // Tab 1: Lesson Plan Form
  const [lessonTopic, setLessonTopic] = useState('An toàn giao thông và xây dựng tình bạn đẹp');
  const [lessonWeek, setLessonWeek] = useState('Tuần 12');

  // Tab 2: Zalo Message Form
  const [zaloPurpose, setZaloPurpose] = useState<
    'Thông báo chung' | 'Nhắc nhở quỹ/học phí' | 'Mời họp CMHS' | 'Trao đổi riêng về học sinh sa sút' | 'Khen ngợi học sinh tiến bộ'
  >('Thông báo chung');
  const [zaloStudentName, setZaloStudentName] = useState('');
  const [zaloDetails, setZaloDetails] = useState('Thông báo lịch thi giữa học kỳ 1 và nhắc nhở các con ôn tập tốt.');

  // Tab 3: Quiz Form
  const [quizTopic, setQuizTopic] = useState('Câu đố vui mẹo học đường và kiến thức khoa học đời sống');
  const [quizCount, setQuizCount] = useState(5);

  // Tab 4: Free Chat Form
  const [chatPrompt, setChatPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: `Xin chào ${teacherTitle} ${teacherName || ''}! Em là Trợ lý Sư phạm AI Gemini. Thầy/Cô cần hỗ trợ soạn giáo án, viết báo cáo hay tư vấn tình huống sư phạm nào hôm nay ạ? ✨`,
    },
  ]);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    triggerConfetti();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    setGeminiApiKey(tempApiKey.trim());
    setShowKeyModal(false);
    setAuthError(null);
    triggerConfetti();
    alert('Đã lưu cấu hình Google Gemini API Key thành công! Thầy/Cô có thể sử dụng AI ngay bây giờ.');
  };

  const handleAiError = (err: any) => {
    const msg = err?.message || String(err);
    if (msg.includes('authentication') || msg.includes('401') || msg.includes('403') || msg.includes('OAuth') || msg.includes('API key')) {
      setAuthError('Khóa API hiện tại chưa hợp lệ hoặc bị Google chặn CORS. Vui lòng lấy API Key Gemini (bắt đầu bằng AIzaSy...) miễn phí tại Google AI Studio và dán vào bên dưới!');
      setShowKeyModal(true);
    } else {
      alert(`Lỗi AI: ${msg}`);
    }
  };

  const handleGenerateLessonPlan = async () => {
    if (!lessonTopic.trim()) return;
    setLoading(true);
    setResultText('');
    setAuthError(null);
    try {
      const res = await generateHomeroomLessonPlan({
        topic: lessonTopic,
        className: currentClass?.name || 'Lớp học',
        weekNumber: lessonWeek,
        teacherTitle,
      });
      setResultText(res);
      triggerConfetti();
    } catch (err: any) {
      handleAiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateZalo = async () => {
    if (!zaloDetails.trim()) return;
    setLoading(true);
    setResultText('');
    setAuthError(null);
    try {
      const res = await generateZaloParentMessage({
        purpose: zaloPurpose,
        className: currentClass?.name || 'Lớp học',
        studentName: zaloStudentName.trim() || undefined,
        keyDetails: zaloDetails,
        teacherName: `${teacherTitle} ${teacherName || ''}`.trim(),
      });
      setResultText(res);
      triggerConfetti();
    } catch (err: any) {
      handleAiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!quizTopic.trim()) return;
    setLoading(true);
    setResultText('');
    setAuthError(null);
    try {
      const res = await generateQuizQuestionsForClass({
        topic: quizTopic,
        count: quizCount,
      });
      setResultText(res);
      triggerConfetti();
    } catch (err: any) {
      handleAiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatPrompt.trim() || loading) return;

    const userMsg = chatPrompt.trim();
    setChatPrompt('');
    setChatHistory((prev) => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    setAuthError(null);

    try {
      const aiReply = await callGeminiFlash({
        systemPrompt: `Bạn là Trợ lý Giáo viên Sư phạm chuyên nghiệp tại Việt Nam. Người dùng là ${teacherTitle} ${teacherName || ''}, chủ nhiệm lớp ${currentClass?.name || 'chủ nhiệm'}. Hãy trả lời tận tâm, chính xác, lịch sự, hỗ trợ tối đa cho giáo viên.`,
        userPrompt: userMsg,
      });
      setChatHistory((prev) => [...prev, { role: 'assistant', text: aiReply }]);
    } catch (err: any) {
      handleAiError(err);
      setChatHistory((prev) => [
        ...prev,
        { role: 'assistant', text: `⚠️ Không thể phản hồi: ${err.message}. Vui lòng kiểm tra API Key trong mục Cài đặt Key!` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full h-[90vh] max-h-[800px] border theme-card-border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 relative">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b theme-card-border flex items-center justify-between theme-soft-bg shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl theme-btn-primary text-white shadow-md">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black theme-text">Trợ lý Sư phạm AI Gemini Flash</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[10px] border border-amber-300 flex items-center gap-1 shadow-2xs">
                  <Crown className="w-3 h-3 text-amber-600" /> VIP AI
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Soạn giáo án, kịch bản sinh hoạt lớp, tin nhắn Zalo và giải đáp sư phạm tức thì
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setTempApiKey(getGeminiApiKey());
                setShowKeyModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border theme-card-border font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              title="Cài đặt Google Gemini API Key"
            >
              <KeyRound className="w-3.5 h-3.5 theme-text" />
              <span className="hidden sm:inline">Cài Key AI</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* VIP Lock Banner if user is not VIP */}
        {!isVip ? (
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-amber-50 border-2 border-amber-300 flex items-center justify-center text-4xl shadow-md animate-bounce">
              👑
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-800">Tính năng dành riêng cho Thành viên VIP</h4>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mt-1">
                Trợ lý Sư phạm AI Gemini Flash giúp Thầy/Cô tiết kiệm hàng giờ soạn bài, viết nhận xét và tương tác với phụ huynh mỗi tuần.
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                setShowVipModal(true);
              }}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm shadow-xl flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Crown className="w-4 h-4" /> Nâng cấp VIP Mở Khóa AI Ngay
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            
            {/* Left Nav Tabs */}
            <div className="w-full md:w-56 border-b md:border-b-0 md:border-r theme-card-border p-2 sm:p-3 bg-slate-50/70 shrink-0 flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible">
              {[
                { id: 'lesson-plan', label: 'Sinh hoạt lớp (45p)', icon: Calendar },
                { id: 'zalo', label: 'Soạn tin nhắn Zalo', icon: MessageCircle },
                { id: 'quiz', label: 'Đố vui & Minigame', icon: HelpCircle },
                { id: 'chat', label: 'Chat hỏi đáp Sư phạm', icon: Bot },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as AiTab);
                      setResultText('');
                    }}
                    className={`px-3 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2.5 transition-all cursor-pointer whitespace-nowrap ${
                      active
                        ? 'theme-btn-primary text-white shadow-xs'
                        : 'text-slate-600 hover:theme-soft-bg hover:theme-text'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Main Content Area */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto flex flex-col justify-between">
              
              {/* Tab 1: Sinh hoạt lớp */}
              {activeTab === 'lesson-plan' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-600 mb-1">Chủ điểm sinh hoạt *</label>
                        <input
                          type="text"
                          value={lessonTopic}
                          onChange={(e) => setLessonTopic(e.target.value)}
                          placeholder="Ví dụ: Tri ân thầy cô 20/11, Kỹ năng tự học..."
                          className="w-full px-3.5 py-2.5 rounded-xl border theme-card-border focus:outline-none text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Thời gian / Tuần</label>
                        <input
                          type="text"
                          value={lessonWeek}
                          onChange={(e) => setLessonWeek(e.target.value)}
                          placeholder="Tuần 12"
                          className="w-full px-3.5 py-2.5 rounded-xl border theme-card-border focus:outline-none text-xs font-semibold"
                        />
                      </div>
                    </div>

                    <button
                      disabled={loading}
                      onClick={handleGenerateLessonPlan}
                      className="px-5 py-2.5 rounded-2xl theme-btn-primary font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      <span>{loading ? 'AI đang soạn giáo án...' : 'Soạn Kịch Bản 45 Phút Ngay ✨'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Soạn tin nhắn Zalo */}
              {activeTab === 'zalo' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Mục đích thông báo</label>
                        <select
                          value={zaloPurpose}
                          onChange={(e) => setZaloPurpose(e.target.value as any)}
                          className="w-full px-3.5 py-2.5 rounded-xl border theme-card-border text-xs font-bold focus:outline-none"
                        >
                          <option value="Thông báo chung">Thông báo chung</option>
                          <option value="Nhắc nhở quỹ/học phí">Nhắc nhở quỹ / học phí tế nhị</option>
                          <option value="Mời họp CMHS">Mời họp phụ huynh</option>
                          <option value="Trao đổi riêng về học sinh sa sút">Trao đổi riêng (Con vi phạm/sa sút)</option>
                          <option value="Khen ngợi học sinh tiến bộ">Khen ngợi con có tiến bộ</option>
                        </select>
                      </div>

                      {(zaloPurpose === 'Trao đổi riêng về học sinh sa sút' || zaloPurpose === 'Khen ngợi học sinh tiến bộ') && (
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Tên học sinh</label>
                          <input
                            type="text"
                            value={zaloStudentName}
                            onChange={(e) => setZaloStudentName(e.target.value)}
                            placeholder="Ví dụ: Nguyễn Văn An"
                            className="w-full px-3.5 py-2.5 rounded-xl border theme-card-border text-xs font-semibold focus:outline-none"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Chi tiết nội dung cần thông báo *</label>
                      <textarea
                        rows={3}
                        value={zaloDetails}
                        onChange={(e) => setZaloDetails(e.target.value)}
                        placeholder="Nhập thông tin thời gian, yêu cầu, số tiền hoặc tình hình cụ thể..."
                        className="w-full px-3.5 py-2.5 rounded-xl border theme-card-border text-xs font-semibold focus:outline-none resize-none"
                      />
                    </div>

                    <button
                      disabled={loading}
                      onClick={handleGenerateZalo}
                      className="px-5 py-2.5 rounded-2xl theme-btn-primary font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      <span>{loading ? 'AI đang viết tin nhắn...' : 'Soạn Tin Nhắn Zalo Chuẩn ✨'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 3: Đố vui */}
              {activeTab === 'quiz' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-600 mb-1">Chủ đề câu đố / trò chơi *</label>
                        <input
                          type="text"
                          value={quizTopic}
                          onChange={(e) => setQuizTopic(e.target.value)}
                          placeholder="Ví dụ: Đố vui Tết cổ truyền, Đố mẹo logic..."
                          className="w-full px-3.5 py-2.5 rounded-xl border theme-card-border focus:outline-none text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Số lượng câu</label>
                        <select
                          value={quizCount}
                          onChange={(e) => setQuizCount(Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 rounded-xl border theme-card-border focus:outline-none text-xs font-bold"
                        >
                          <option value={3}>3 câu</option>
                          <option value={5}>5 câu</option>
                          <option value={10}>10 câu</option>
                        </select>
                      </div>
                    </div>

                    <button
                      disabled={loading}
                      onClick={handleGenerateQuiz}
                      className="px-5 py-2.5 rounded-2xl theme-btn-primary font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      <span>{loading ? 'AI đang tạo câu hỏi...' : 'Tạo Bộ Câu Hỏi Ngay ✨'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 4: Chat tự do */}
              {activeTab === 'chat' ? (
                <div className="flex-1 flex flex-col justify-between h-[420px]">
                  <div className="space-y-3 overflow-y-auto pr-1 flex-1 mb-3">
                    {chatHistory.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex gap-2.5 text-xs sm:text-sm ${
                          msg.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {msg.role === 'assistant' && (
                          <div className="w-7 h-7 rounded-full theme-btn-primary text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <Bot className="w-4 h-4" />
                          </div>
                        )}
                        <div
                          className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed ${
                            msg.role === 'user'
                              ? 'theme-btn-primary text-white shadow-xs'
                              : 'bg-slate-100 text-slate-800 border border-slate-200 shadow-2xs whitespace-pre-wrap'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-bold p-2">
                        <Loader2 className="w-4 h-4 animate-spin text-pink-500" /> AI Gemini đang suy nghĩ câu trả lời...
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSendChat} className="flex gap-2">
                    <input
                      type="text"
                      value={chatPrompt}
                      onChange={(e) => setChatPrompt(e.target.value)}
                      placeholder="Hỏi Gemini về quy chế, tình huống sư phạm, mẫu biểu..."
                      className="flex-1 px-4 py-2.5 rounded-2xl border theme-card-border text-xs font-semibold focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={loading || !chatPrompt.trim()}
                      className="px-4 py-2.5 rounded-2xl theme-btn-primary text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50 active:scale-95"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              ) : (
                /* Generated Result Box for Tabs 1, 2, 3 */
                resultText && (
                  <div className="mt-4 p-4 rounded-2xl bg-white border theme-card-border shadow-xs space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between border-b theme-card-border pb-2">
                      <span className="text-xs font-black theme-text flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" /> Kết quả tạo bởi Gemini Flash:
                      </span>
                      <button
                        onClick={() => handleCopy(resultText)}
                        className="px-3 py-1 rounded-xl text-xs font-bold theme-btn-primary flex items-center gap-1 cursor-pointer active:scale-95"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Đã sao chép!' : 'Sao chép nội dung'}</span>
                      </button>
                    </div>
                    <div className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto pr-1">
                      {resultText}
                    </div>
                  </div>
                )
              )}

            </div>
          </div>
        )}

        {/* API Key Setup Sub-Modal */}
        {showKeyModal && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full border theme-card-border shadow-2xl animate-in zoom-in-95 space-y-4">
              <div className="flex items-center justify-between border-b theme-card-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-800">Cài đặt Google Gemini API Key</h4>
                </div>
                <button
                  onClick={() => setShowKeyModal(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {authError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-semibold flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleSaveKey} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Google Gemini API Key (Bắt đầu bằng <code className="text-amber-600 bg-amber-50 px-1 py-0.5 rounded">AIzaSy...</code>)
                  </label>
                  <input
                    type="password"
                    required
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder="Dán mã API Key AIzaSy... vào đây"
                    className="w-full px-3.5 py-2.5 rounded-xl border theme-card-border font-mono font-bold text-slate-800 focus:outline-none"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1.5">
                  <p className="font-bold text-slate-700">💡 Hướng dẫn lấy Key Gemini hoàn toàn miễn phí:</p>
                  <p>1. Nhấp vào <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-600 font-bold underline inline-flex items-center gap-0.5">Google AI Studio <ExternalLink className="w-3 h-3" /></a></p>
                  <p>2. Đăng nhập tài khoản Google và bấm nút <strong>"Create API key"</strong>.</p>
                  <p>3. Copy mã khóa (bắt đầu bằng <code>AIzaSy...</code>) và dán vào ô trên.</p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowKeyModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white theme-btn-primary rounded-xl shadow-md cursor-pointer"
                  >
                    Lưu Khóa API
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
