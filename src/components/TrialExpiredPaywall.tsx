import React, { useState } from 'react';
import {
  Lock,
  Zap,
  Check,
  Copy,
  ShieldCheck,
  Key,
  QrCode,
  Download,
  RefreshCw,
} from 'lucide-react';

import { useApp } from '../context/AppContext';
import { adminGoogleSync } from '../services/adminGoogleScriptSync';
import { exportDatabaseBackup } from '../db/db';

export const TrialExpiredPaywall: React.FC = () => {
  const { user, activateVip, triggerConfetti } = useApp();

  const [plan, setPlan] = useState<'1year' | 'lifetime'>('lifetime');
  const [activeTab, setActiveTab] = useState<'qr' | 'key'>('qr');
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedMemo, setCopiedMemo] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);

  const bankConfig = adminGoogleSync.getBankConfig();
  const currentPrice = plan === '1year' ? bankConfig.price1Year : bankConfig.priceLifetime;
  const cleanEmailMemo = user?.email ? user.email.split('@')[0].toUpperCase() : 'GVCN';
  const transferMemo = `GVCN ${cleanEmailMemo}`.slice(0, 25);

  const qrUrl = `https://img.vietqr.io/image/${bankConfig.bankId}-${bankConfig.accountNo}-compact2.png?amount=${currentPrice}&addInfo=${encodeURIComponent(
    transferMemo
  )}&accountName=${encodeURIComponent(bankConfig.accountName)}`;

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
        alert('🎉 Chúc mừng! Thanh toán của bạn đã được xác nhận. Toàn bộ tính năng đã được mở khóa vĩnh viễn!');
        setIsCheckingPayment(false);
        return;
      }
    }

    setTimeout(() => {
      setIsCheckingPayment(false);
      alert('⏳ Hệ thống đang kiểm tra sao kê ngân hàng. Nếu Thầy/Cô vừa chuyển khoản, vui lòng đợi 5-10 giây để hệ thống tự động kích hoạt nhé!');
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

  const handleEmergencyExport = async () => {
    const json = await exportDatabaseBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SaoLuu_KhanCap_GVCN_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    alert('✅ Đã tải file sao lưu dữ liệu khẩn cấp về máy tính an toàn!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-amber-300 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-auto">
        
        {/* Header Paywall Banner */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 p-6 sm:p-8 text-white relative overflow-hidden">
          <div className="absolute top-2 right-4 text-white/15 text-8xl select-none">👑</div>
          <div className="relative z-10 space-y-2 max-w-lg">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/25 backdrop-blur-md text-[10px] font-black uppercase tracking-wider border border-white/20">
              <Lock className="w-3.5 h-3.5 text-yellow-300" /> Hết Hạn Dùng Thử 30 Ngày
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Nâng Cấp VIP Để Tiếp Tục Sử Dụng 👑
            </h1>
            <p className="text-xs sm:text-sm text-white/90 font-medium leading-relaxed">
              Thời gian trải nghiệm 1 tháng miễn phí đã kết thúc. Dữ liệu của bạn vẫn được lưu trữ an toàn 100%. Hãy nâng cấp VIP để tiếp tục quản lý lớp học.
            </p>
          </div>
        </div>

        {/* Plan Switcher */}
        <div className="p-6 pb-2 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* 1 Year Plan */}
            <div
              onClick={() => setPlan('1year')}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                plan === '1year'
                  ? 'border-amber-500 bg-amber-50/70 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800">Gói 1 Năm Học</span>
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
                <span className="text-xs font-black text-slate-800">Gói Trọn Đời 👑</span>
                {plan === 'lifetime' && <Check className="w-4 h-4 text-amber-600" />}
              </div>
              <div className="text-xl font-black text-amber-700 mt-2">
                {bankConfig.priceLifetime.toLocaleString('vi-VN')} đ
              </div>
              <div className="text-[10px] text-amber-600 font-bold">Dùng vĩnh viễn trọn đời</div>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
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
              <QrCode className="w-4 h-4" /> Quét Mã VietQR (Kích Hoạt Tự Động 3s)
            </button>
            <button
              onClick={() => setActiveTab('key')}
              className={`pb-2.5 px-4 flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'key'
                  ? 'border-amber-500 text-amber-700 font-black'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <Key className="w-4 h-4" /> Nhập Mã Bản Quyền
            </button>
          </div>
        </div>

        {/* TAB 1: VIETQR PAYMENT */}
        {activeTab === 'qr' && (
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-3xl bg-slate-50 border border-slate-200/80">
              
              {/* QR Image */}
              <div className="bg-white p-3 rounded-2xl border border-amber-200 shadow-sm shrink-0 text-center">
                <img
                  src={qrUrl}
                  alt="VietQR Napas 247"
                  className="w-44 h-44 sm:w-48 sm:h-48 object-contain mx-auto rounded-xl"
                />
                <span className="text-[10px] font-extrabold text-amber-600 flex items-center justify-center gap-1 mt-1.5">
                  <Zap className="w-3 h-3 fill-amber-400" /> Quét bằng bất kỳ App Ngân Hàng
                </span>
              </div>

              {/* Details */}
              <div className="flex-1 space-y-2.5 w-full text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Ngân hàng</span>
                  <div className="font-extrabold text-slate-800">{bankConfig.bankId} (Napas 247)</div>
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
                      {copiedAccount ? 'Đã chép' : 'Sao chép'}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Chủ tài khoản</span>
                  <div className="font-bold text-slate-800 uppercase">{bankConfig.accountName}</div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Nội dung chuyển khoản (Bắt buộc)</span>
                  <div className="flex items-center justify-between bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 font-mono font-black text-amber-900">
                    <span>{transferMemo}</span>
                    <button
                      onClick={() => handleCopy(transferMemo, 'memo')}
                      className="text-amber-700 hover:text-amber-800 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedMemo ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedMemo ? 'Đã chép' : 'Sao chép'}
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

            {/* Polling Notice & Actions */}
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-amber-900 font-semibold">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
                <span>Hệ thống tự động kích hoạt ngay sau khi chuyển khoản...</span>
              </div>

              <button
                disabled={isCheckingPayment}
                onClick={handleManualCheck}
                className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-xs cursor-pointer shrink-0 active:scale-98"
              >
                {isCheckingPayment ? 'Đang kiểm tra...' : 'Tôi Đã Chuyển Khoản'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: LICENSE KEY */}
        {activeTab === 'key' && (
          <div className="p-6 space-y-4">
            <form onSubmit={handleKeySubmit} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Nhập mã kích hoạt bản quyền VIP của bạn:
                </label>
                <input
                  type="text"
                  value={licenseKeyInput}
                  onChange={(e) => {
                    setLicenseKeyInput(e.target.value);
                    setKeyError(null);
                  }}
                  placeholder="Ví dụ: GVCN-VIP-2026-XXXX..."
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
                <ShieldCheck className="w-4 h-4" /> Kích Hoạt Mở Khóa Ngay
              </button>
            </form>
          </div>
        )}

        {/* Footer: Emergency Backup Export */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="font-medium">Cần xuất dữ liệu cũ ra máy tính?</span>
          <button
            onClick={handleEmergencyExport}
            className="font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer underline"
          >
            <Download className="w-3.5 h-3.5" /> Tải file sao lưu khẩn cấp
          </button>
        </div>

      </div>
    </div>
  );
};
