import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, KeyRound, UserCheck, AlertCircle, X } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login, users } = useApp();

  const [identifiant, setIdentifiant] = useState('');
  const [password, setPassword] = useState('sag2026');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = login(identifiant, password);
    if (ok) {
      setErrorMsg(null);
      onClose();
    } else {
      setErrorMsg('Identifiants incorrects ou compte inactif. Utilisez un matricule valide.');
    }
  };

  const handleQuickLogin = (u: any) => {
    setIdentifiant(u.email);
    setPassword('sag2026');
    const ok = login(u.email, 'sag2026');
    if (ok) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white font-bold shadow-xs">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">
              Connexion Sécurisée au Système IRS
            </h2>
            <p className="text-xs text-slate-500">
              Hôpital de Koron · SAG Siguiri (Guinée)
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Matricule SAG ou Email Professionnel
            </label>
            <input
              type="text"
              required
              placeholder="Ex: SAG-MED-001 ou admin@sag-koron.gn"
              value={identifiant}
              onChange={(e) => setIdentifiant(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-emerald-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-emerald-600 focus:outline-hidden"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            Se Connecter à la Session
          </button>
        </form>

        {/* Quick Demo Login selector */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Rôles Clés SAG Siguiri (Accès Rapide)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {users.slice(0, 4).map(u => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleQuickLogin(u)}
                className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/50 transition-colors"
              >
                <div className="text-xs font-bold text-slate-800 truncate">{u.nom}</div>
                <div className="text-[10px] text-emerald-700 font-semibold uppercase">{u.role} · {u.matricule}</div>
              </button>
            ))}
          </div>
          
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Admin : <b>Dr. Faremba Doumbouya</b></span>
            <span>·</span>
            <span>Superviseur : <b>Dr. Col. Magassouba</b></span>
          </div>
        </div>

      </div>
    </div>
  );
};
