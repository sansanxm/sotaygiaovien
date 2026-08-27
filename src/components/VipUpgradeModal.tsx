import React, { useState, useEffect } from 'react';
import {
  Check,
  X,
  Copy,
  Sparkles,
  Zap,
  ShieldCheck,
  RefreshCw,
  Key,
  QrCode,
  HeartHandshake,
} from 'lucide-react';

import { useApp } from '../context/AppContext';
import { adminGoogleSync } from '../services/adminGoogleScriptSync';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const VipUpgradeModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user, isVip, activateVip, triggerConfetti } = useApp();

  const [plan, setPlan] = useState<'1year' | 'lifetime'>('lifetime');
  const [activeTab, setActiveTab] = useState<'qr' | 'key'>('qr');
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedMemo, setCopiedMemo] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);

  const bankConfig = adminGoogleSync.getBankConfig();
  const currentPrice = plan === '1year' ? bankConfig.price1Year : bankConfig.priceLifetime;
  const userIdentifier = user?.email || 'GVCN_USER';
  const cleanEmailMemo = user?.email ? user.email.split('@')[0].toUpperCase() : 'GVCN';
  const transferMemo = `GVCN ${cleanEmailMemo}`.slice(0, 25);

  // VietQR Dynamic Image URL (Standard Napas 247)
  const qrUrl = `https://img.vietqr.io/image/${bankConfig.bankId}-${bankConfig.accountNo}-compact2.png?amount=${currentPrice}&addInfo=${encodeURIComponent(
    transferMemo
  )}&accountName=${encodeURIComponent(bankConfig.accountName)}`;

  // Auto-polling for 3-second instant activation
  useEffect(() => {
    if (!isOpen || isVip) return;

    const interval = setInterval(async () => {
      if (user) {
        const res = await adminGoogleSync.checkVipStatusLive(user);
        if (res.isVip) {
          activateVip(res.vipExpiresAt || 'lifetime');
          triggerConfetti();
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, user, isVip, activateVip, triggerConfetti]);

  if (!isOpen) return null;

  const handleCopy = (text: string, type: 'account' | 'memo') => {
    navigator.clipboard.writeText(text);
    if (type === 'account') {
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    } else {
      setCopiedMemo(true);
      setTimeout(() => setCopiedMemo(false), 2000);
    }
  };

  const handleManualCheck = async () => {
    setIsCheckingPayment(true);
    if (user) {
      const res = await adminGoogleSync.checkVipStatusLive(user);
      if (res.isVip) {
        activateVip(res.vipExpiresAt || 'lifetime');
        triggerConfetti();
        alert('🎉 Chúc mừng! Thanh toán của bạn đã được xác nhận. Tài khoản đã nâng cấp VIP thành công!');
        setIsCheckingPayment(false);
        return;
      }
    }

    setTimeout(() => {
      setIsCheckingPayment(false);
      alert('⏳ Hệ thống đang kiểm tra sao kê ngân hàng. Nếu Thầy/Cô vừa chuyển khoản, vui lòng đợi 5-10 giây để hệ thống tự động duyệt nhé!');
    }, 1200);
  };

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKeyInput.trim()) return;

    const res = adminGoogleSync.activateWithLicenseKey(licenseKeyInput, user?.email);
    if (res.success) {
      activateVip('lifetime');
      triggerConfetti();
      setKeyError(null);
    } else {
      setKeyError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-amber-200 w-full max-w-2xl max-h-[92vh] overflow-y-auto overflow-x-hidden relative animate-in zoom-in-95 duration-250">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* VIP Already Activated Screen */}
        {isVip ? (
          <div className="p-8 sm:p-12 text-center space-y-5">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 flex items-center justify-center text-4xl shadow-xl shadow-amber-300/60 animate-bounce">
              👑
            </div>
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                Tài khoản bản quyền
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-800">
                Bạn đang là thành viên VIP hoàng gia!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold max-w-md mx-auto leading-relaxed">
                Toàn bộ tính năng cao cấp, đồng bộ đám mây đa thiết bị và cắt ảnh khuôn mặt AI đã được mở khóa vĩnh viễn cho Thầy/Cô.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 max-w-md mx-auto grid grid-cols-2 gap-3 text-left">
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Tài khoản</div>
                <div className="text-xs font-black text-slate-800 truncate">{userIdentifier}</div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Thời hạn</div>
                <div className="text-xs font-black text-amber-700">Vĩnh viễn (trọn đời) ♾️</div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-black text-xs shadow-lg shadow-amber-300/50 cursor-pointer active:scale-98"
            >
              Tiếp tục sử dụng ứng dụng
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Header Banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 p-6 text-white rounded-t-3xl shadow-md">
              <div className="absolute top-2 right-4 text-white/15 text-7xl select-none">👑</div>
              <div className="relative z-10 space-y-1.5 max-w-lg">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/20 backdrop-blur-md text-[10px] font-extrabold uppercase tracking-wider border border-white/20">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-200" /> Tự động kích hoạt trong 3 giây
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Nâng cấp Sổ tay Giáo viên VIP 👑
                </h2>
                <p className="text-xs sm:text-sm text-white/90 font-medium leading-relaxed">
                  Mở khóa 100% sức mạnh quản lý lớp học, sao lưu đám mây không giới hạn và xuất báo cáo Zalo chuyên nghiệp.
                </p>
              </div>
            </div>

            {/* Plan Switcher */}
            <div className="px-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {/* 1 Year Plan */}
                <div
                  onClick={() => setPlan('1year')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${
                    plan === '1year'
                      ? 'border-amber-500 bg-amber-50/70 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800">Gói 1 năm học</span>
                    {plan === '1year' && <Check className="w-4 h-4 text-amber-600" />}
                  </div>
                  <div className="text-xl font-black text-amber-700 mt-2">
                    {bankConfig.price1Year.toLocaleString('vi-VN')} đ
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold">Chỉ ~8.000 đ / tháng</div>
                </div>

                {/* Lifetime Plan */}
                <div
                  onClick={() => setPlan('lifetime')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${
                    plan === 'lifetime'
                      ? 'border-amber-500 bg-amber-50/70 shadow-md ring-2 ring-amber-400/30'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-rose-500 to-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-bl-xl uppercase tracking-wider">
                    Tiết kiệm 70%
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800">Gói trọn đời 👑</span>
                    {plan === 'lifetime' && <Check className="w-4 h-4 text-amber-600" />}
                  </div>
                  <div className="text-xl font-black text-amber-700 mt-2">
                    {bankConfig.priceLifetime.toLocaleString('vi-VN')} đ
                  </div>
                  <div className="text-[10px] text-amber-600 font-bold">Dùng vĩnh viễn trọn đời</div>
                </div>
              </div>
            </div>

            {/* Tabs: VietQR or License Key */}
            <div className="px-6">
              <div className="flex border-b border-slate-200 text-xs font-bold">
                <button
                  onClick={() => setActiveTab('qr')}
                  className={`pb-2.5 px-4 flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                    activeTab === 'qr'
                      ? 'border-amber-500 text-amber-700 font-black'
                      : 'border-transparent text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <QrCode className="w-4 h-4" /> Quét mã VietQR (tự động 3s)
                </button>
                <button
                  onClick={() => setActiveTab('key')}
                  className={`pb-2.5 px-4 flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                    activeTab === 'key'
                      ? 'border-amber-500 text-amber-700 font-black'
                      : 'border-transparent text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <Key className="w-4 h-4" /> Nhập mã bản quyền
                </button>
              </div>
            </div>

            {/* TAB 1: VIETQR PAYMENT */}
            {activeTab === 'qr' && (
              <div className="px-6 pb-6 space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-3xl bg-slate-50 border border-slate-200/80">
                  
                  {/* QR Image Box */}
                  <div className="bg-white p-3 rounded-2xl border border-amber-200 shadow-sm shrink-0 text-center">
                    <img
                      src={qrUrl}
                      alt="VietQR Napas 247"
                      className="w-48 h-48 sm:w-52 sm:h-52 object-contain mx-auto rounded-xl"
                    />
                    <span className="text-[10px] font-extrabold text-amber-600 flex items-center justify-center gap-1 mt-1.5">
                      <Zap className="w-3 h-3 fill-amber-400" /> Quét bằng bất kỳ ứng dụng ngân hàng
                    </span>
                  </div>

                  {/* Transfer Details */}
                  <div className="flex-1 space-y-2.5 w-full text-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Ngân hàng</span>
                      <div className="font-extrabold text-slate-800 text-sm">{bankConfig.bankId} (Napas 247)</div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Số tài khoản</span>
                      <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-slate-200 font-mono font-bold text-slate-800">
                        <span>{bankConfig.accountNo}</span>
                        <button
                          onClick={() => handleCopy(bankConfig.accountNo, 'account')}
                          className="text-amber-600 hover:text-amber-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          {copiedAccount ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedAccount ? 'Đã sao chép' : 'Sao chép'}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Chủ tài khoản</span>
                      <div className="font-bold text-slate-800 uppercase">{bankConfig.accountName}</div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Nội dung chuyển khoản (bắt buộc)</span>
                      <div className="flex items-center justify-between bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 font-mono font-black text-amber-900">
                        <span>{transferMemo}</span>
                        <button
                          onClick={() => handleCopy(transferMemo, 'memo')}
                          className="text-amber-700 hover:text-amber-800 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          {copiedMemo ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedMemo ? 'Đã sao chép' : 'Sao chép'}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Số tiền</span>
                      <div className="text-base font-black text-amber-700">
                        {currentPrice.toLocaleString('vi-VN')} VNĐ
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Bar & Action */}
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-amber-900 font-semibold">
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
                    <span>Hệ thống đang tự động lắng nghe giao dịch chuyển khoản...</span>
                  </div>

                  <button
                    disabled={isCheckingPayment}
                    onClick={handleManualCheck}
                    className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-xs cursor-pointer shrink-0 active:scale-98"
                  >
                    {isCheckingPayment ? 'Đang kiểm tra...' : 'Tôi đã chuyển khoản'}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: LICENSE KEY */}
            {activeTab === 'key' && (
              <div className="px-6 pb-6 space-y-4">
                <form onSubmit={handleKeySubmit} className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Nhập mã kích hoạt VIP (Nếu Thầy/Cô được cấp mã riêng):
                    </label>
                    <input
                      type="text"
                      value={licenseKeyInput}
                      onChange={(e) => {
                        setLicenseKeyInput(e.target.value);
                        setKeyError(null);
                      }}
                      placeholder="Ví dụ: GVCN-VIP-2026-XXXX-YYYY"
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-400 bg-slate-50 uppercase"
                    />
                  </div>

                  {keyError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                      {keyError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-black text-xs shadow-md shadow-amber-300/40 cursor-pointer active:scale-98 flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" /> Kích hoạt bản quyền ngay
                  </button>
                </form>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 space-y-1">
                  <div className="font-bold text-slate-700 flex items-center gap-1.5">
                    <HeartHandshake className="w-4 h-4 text-amber-500" /> Hỗ trợ kích hoạt trực tiếp:
                  </div>
                  <p className="leading-relaxed">
                    Nếu Thầy/Cô cần hỗ trợ kích hoạt bản quyền nhanh cho trường học hoặc tổ bộ môn, vui lòng liên hệ Admin qua Zalo / Số điện thoại hỗ trợ.
                  </p>
                </div>
              </div>
            )}


          </div>
        )}

      </div>
    </div>
  );
};
