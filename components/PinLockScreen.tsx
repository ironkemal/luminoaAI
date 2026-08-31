"use client";

import { useState, useEffect } from "react";
import { verifyPin, isAppUnlocked, setCustomPin } from "@/lib/auth-pin";
import { Lock, Unlock, KeyRound, Check, ShieldCheck, Dumbbell } from "lucide-react";

interface PinLockScreenProps {
  children: React.ReactNode;
}

export default function PinLockScreen({ children }: PinLockScreenProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [isMounting, setIsMounting] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);

  useEffect(() => {
    setIsMounting(false);
    if (isAppUnlocked()) {
      setUnlocked(true);
    }
  }, []);

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      const updated = pin + digit;
      setPin(updated);
      setError(false);

      if (updated.length >= 4) {
        if (verifyPin(updated)) {
          setUnlocked(true);
        } else if (updated.length === 4) {
          // If 4 digits failed, wait for potentially 6 or shake
          setTimeout(() => {
            if (!verifyPin(updated) && updated.length === 4) {
              // Might be longer, but if error
            }
          }, 200);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    setPin("");
    setError(false);
  };

  const handleManualUnlock = () => {
    if (verifyPin(pin)) {
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setPin("");
    }
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length >= 4 && newPin.length <= 6) {
      if (setCustomPin(newPin)) {
        setPinChangeSuccess(true);
        setTimeout(() => {
          setPinChangeSuccess(false);
          setShowSettings(false);
          setNewPin("");
        }, 1200);
      }
    }
  };

  if (isMounting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100/60 to-slate-50 flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 md:p-8 shadow-card border border-slate-100 flex flex-col items-center animate-slide-up">
        {/* Header Icon */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner mb-4">
          <Dumbbell className="w-8 h-8" />
        </div>

        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Lumino Smart PT</h1>
        <p className="text-xs text-slate-500 mt-1 mb-6 text-center">
          Kişisel Antrenman ve Vücut Kompozisyonu
        </p>

        {/* PIN Circles */}
        <div className="flex items-center gap-3 mb-6">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                pin.length > index
                  ? "bg-emerald-500 border-emerald-500 scale-110 shadow-sm"
                  : error
                  ? "border-red-400 bg-red-50 animate-shake"
                  : "border-slate-300 bg-transparent"
              }`}
            />
          ))}
          {pin.length > 4 && (
            <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-emerald-500 scale-110 shadow-sm" />
          )}
        </div>

        {error && (
          <p className="text-xs text-red-500 font-medium mb-3 animate-fade-in">
            Hatalı PIN kodu! (Varsayılan: 1234)
          </p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num.toString())}
              className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-emerald-100 text-slate-800 font-semibold text-xl tap-effect flex items-center justify-center border border-slate-100 transition-colors"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-14 rounded-2xl bg-slate-50/70 hover:bg-slate-100 text-slate-500 text-xs font-semibold tap-effect flex items-center justify-center border border-slate-100"
          >
            Sil
          </button>
          <button
            type="button"
            onClick={() => handleDigit("0")}
            className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-emerald-100 text-slate-800 font-semibold text-xl tap-effect flex items-center justify-center border border-slate-100"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-slate-50/70 hover:bg-slate-100 text-slate-500 text-xs font-semibold tap-effect flex items-center justify-center border border-slate-100"
          >
            ←
          </button>
        </div>

        {/* Action Button */}
        {pin.length >= 4 && (
          <button
            onClick={handleManualUnlock}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm tap-effect flex items-center justify-center gap-2 mb-3"
          >
            <Unlock className="w-4 h-4" /> Giriş Yap
          </button>
        )}

        {/* Change PIN toggle */}
        <div className="w-full pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>Varsayılan PIN: 1234</span>
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="text-emerald-600 hover:underline flex items-center gap-1 font-medium"
          >
            <KeyRound className="w-3.5 h-3.5" /> PIN Değiştir
          </button>
        </div>

        {/* Change PIN Modal / Drawer */}
        {showSettings && (
          <form onSubmit={handleChangePin} className="w-full mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <p className="font-semibold text-slate-700 mb-2">Yeni 4-6 Haneli PIN Belirle:</p>
            <div className="flex gap-2">
              <input
                type="password"
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="Örn: 9876"
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-emerald-600 text-white rounded-lg font-medium tap-effect"
              >
                {pinChangeSuccess ? <Check className="w-4 h-4" /> : "Kaydet"}
              </button>
            </div>
            {pinChangeSuccess && (
              <p className="text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> PIN başarıyla güncellendi!
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
