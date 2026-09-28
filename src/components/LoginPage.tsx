import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Shield, KeyRound, UserCheck, AlertCircle,
  HelpCircle, Lock, Building2,
  Info, ArrowRight, CheckCircle2,
  FileCheck, ShieldAlert, Eye, EyeOff, User,
  Stethoscope, Users, Globe, Video as VideoIcon,
} from 'lucide-react';

interface LoginPageProps {
  onSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { login, users, setActiveTab } = useApp();

  const [identifiant, setIdentifiant] = useState('');
  const [password, setPassword] = useState('sag2026');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeHelpModal, setActiveHelpModal] = useState<'help' | 'privacy' | 'support' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLoadingUserId, setSelectedLoadingUserId] = useState<number | null>(null);

  // 🎬 États pour la vidéo
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      const ok = login(identifiant, password);
      setIsSubmitting(false);
      if (ok) {
        setErrorMsg(null);
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg('Identifiants incorrects ou compte inactif. Utilisez un matricule valide (ex: SAG-ADM-001).');
      }
    }, 280);
  };

  const handleSelectQuickUser = (user: typeof users[0]) => {
    setSelectedLoadingUserId(user.id);
    setIdentifiant(user.matricule);
    setPassword('sag2026');
    setTimeout(() => {
      const ok = login(user.matricule, 'sag2026');
      setSelectedLoadingUserId(null);
      if (ok && onSuccess) onSuccess();
    }, 250);
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-start py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-cyan-400 via-green-500 to-green-700">

      {/* ============================================
          CARTE PRINCIPALE
         ============================================ */}
      <div className="w-full max-w-7xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative">

        {/* En-tête : Logo à gauche, sélecteur de langue à droite */}
         <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8 py-5">
  <div className="flex items-center gap-2.5">
    {/* Logo image SAG (remplace l'icône Shield) */}
    <div className="w-10 h-10 rounded-xl overflow-hidden bg-white flex items-center justify-center shadow-md border border-slate-200">
      <img
        src="/assets/images/sag.jpg"
        alt="Logo SAG"
        className="w-full h-full object-contain"
      />
    </div>
    <div>
      <div className="text-sm text-slate-900 leading-none">MALARIA NOTEBOOK 2026</div>
      <div className="text-[10px] text-slate-100 mt-0.5">Hôpital de Koron · Siguiri</div>
    </div>
</div>

        </div>

        {/* ============================================
            COLONNE GAUCHE LARGE (7/12) : Formulaire
           ============================================ */}
        <div className="lg:col-span-7 p-8 sm:p-10 pt-24 relative z-10 flex flex-col justify-between">
          <div>
            {/* Encart formulaire bleu */}
            <div className="rounded-2xl bg-gradient-to-br from-green-600 via-green-700 to-green-800 p-6 sm:p-8 shadow-2xl">
              <h1 className="text-2xl sm:text-3xl font-bold text-white text-center mb-1">
                Connexion
              </h1>
              <p className="text-[11px] text-green-100 text-center mb-6">
                Accédez à votre espace opérationnel IRS
              </p>

              {errorMsg && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-300/40 rounded-lg text-[11px] text-white flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-red-200 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Identifiant */}
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Matricule SAG ou Email"
                    value={identifiant}
                    onChange={(e) => setIdentifiant(e.target.value)}
                    className="w-full px-4 py-3 pr-10 text-xs font-medium rounded-xl bg-white border-0 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-cyan-300 focus:outline-hidden shadow-inner"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Mot de passe */}
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Code d'accès"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-10 text-xs font-medium rounded-xl bg-white border-0 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-cyan-300 focus:outline-hidden shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Rappel + oubli */}
                <div className="flex items-center justify-between text-[11px] text-green-100">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-green-300 text-green-600 focus:ring-green-400"
                    />
                    <span>Se souvenir</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveHelpModal('help')}
                    className="hover:text-white hover:underline cursor-pointer"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>

                {/* Bouton connexion */}
                <button
                  type="submit"
                  disabled={isSubmitting || selectedLoadingUserId !== null}
                  className="w-full py-3 px-4 bg-white hover:bg-cyan-50 disabled:opacity-70 text-green-700 text-sm font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin shrink-0" />
                      <span>Connexion...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Se Connecter</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-green-100 text-center pt-2">
                  Vous n'avez pas accès ?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveHelpModal('support')}
                    className="text-white font-semibold underline cursor-pointer"
                  >
                    Contactez l'administrateur
                  </button>
                </p>
              </form>
            </div>

            {/* Sélection rapide 4 rôles */}
            <div className="mt-5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 mb-2.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Connexion rapide
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {users.slice(0, 4).map(u => {
                  const isLoadingThis = selectedLoadingUserId === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      disabled={selectedLoadingUserId !== null || isSubmitting}
                      onClick={() => handleSelectQuickUser(u)}
                      className={`p-2 bg-white hover:bg-green-50 border rounded-lg text-left transition-all cursor-pointer ${
                        isLoadingThis ? 'border-green-500 ring-2 ring-green-500/20' : 'border-slate-100 hover:border-green-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          u.role === 'admin' ? 'bg-purple-100 text-ember-700' :
                          u.role === 'superviseur' ? 'bg-green-100 text-green-700' :
                          u.role === 'agent' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-slate-200 text-slate-700'
                        }`}>
                          {u.role === 'admin' ? 'Admin' :
                           u.role === 'superviseur' ? 'Superv.' :
                           u.role === 'agent' ? 'Agent' : 'Observ.'}
                        </span>
                        {isLoadingThis && (
                          <div className="w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>
                      <div className="text-[10px] font-bold text-slate-800 mt-1 truncate">
                        {u.nom.split(' ').slice(-1)[0]}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Pied gauche */}
          <div className="mt-6 flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
            <button type="button" onClick={() => setActiveHelpModal('help')} className="flex items-center gap-1 hover:text-green-700 cursor-pointer">
              <HelpCircle className="w-3 h-3" /> Aide
            </button>
            <span className="text-slate-300">·</span>
            <button type="button" onClick={() => setActiveHelpModal('privacy')} className="flex items-center gap-1 hover:text-green-700 cursor-pointer">
              <FileCheck className="w-3 h-3" /> Confidentialité
            </button>
            <span className="text-slate-300">·</span>
            <button type="button" onClick={() => setActiveHelpModal('support')} className="flex items-center gap-1 hover:text-green-700 cursor-pointer">
              <ShieldAlert className="w-3 h-3" /> Assistance
            </button>
          </div>
        </div>

        {/* ============================================
            COLONNE DROITE (5/12) : VIDÉO + LOGO
           ============================================ */}
        <div className="lg:col-span-5 relative bg-gradient-to-br from-slate-50 via-green-50 to-cyan-100 overflow-hidden hidden lg:block min-h-[680px]">

          {/* Formes géométriques */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[460px] bg-gradient-to-br from-amber-900 to-black-500 rounded-[80px] rotate-6 shadow-2xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[440px] bg-gradient-to-br from-green-500 to-green-700 rounded-[80px] -rotate-6" />

          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-green-500/20 blur-2xl" />

          {/* 🎬 VIDÉO ROBUSTE */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
            <div className="w-64 h-64 rounded-full overflow-hidden border-8 border-white shadow-2xl bg-gradient-to-br from-green-100 to-cyan-100 flex items-center justify-center relative">

              {/* Fallback icône si la vidéo ne charge pas */}
              {!videoReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-green-600">
                  <VideoIcon className="w-16 h-16 opacity-40" />
                  <span className="text-[10px] mt-2 font-semibold opacity-60">Chargement vidéo...</span>
                </div>
              )}

              <video
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3Crect width='1' height='1' fill='%23dbeafe'/%3E%3C/svg%3E"
                className="w-full h-full object-cover relative z-10"
                onLoadedData={() => {
                  console.log(' Vidéo chargée : /assets/images/videowell.MP4');
                  setVideoReady(true);
                  setVideoError(null);
                }}
                onCanPlay={() => {
                  console.log(' Vidéo prête à jouer');
                  setVideoReady(true);
                }}
                onError={(e) => {
                  const videoEl = e.currentTarget as HTMLVideoElement;
                  const src = videoEl.currentSrc || videoEl.src;
                  console.error(' Erreur de chargement vidéo. URL tentée :', src);
                  console.error('   Code erreur :', videoEl.error?.code, videoEl.error?.message);
                  setVideoError(
                    `Impossible de charger la vidéo.\n` +
                    `URL tentée : ${src}\n` +
                    `Vérifie que le fichier est bien dans public/assets/images/ avec la bonne casse.`
                  );
                  setVideoReady(false);
                }}
              >
                {/* Essaie les variantes de casse */}
                <source src="/assets/images/videowell.MP4" type="video/mp4" />
                <source src="/assets/images/videowell.mp4" type="video/mp4" />
                <source src="/assets/images/Videowell.MP4" type="video/mp4" />
                <source src="/assets/images/videowell.webm" type="video/webm" />
                Votre navigateur ne supporte pas la balise vidéo.
              </video>
            </div>

            {/* Message d'erreur visible sous la vidéo */}
            {videoError && (
              <div className="mt-3 max-w-xs p-2.5 bg-red-50 border border-red-300 rounded-lg text-[10px] text-red-800 whitespace-pre-line">
                 {videoError}
              </div>
            )}

            {/* Logo plateforme */}
             <div className="mt-0 flex flex-col items-center bg-white rounded-2xl shadow-xl px-6 py-4 border border-slate-100">
  {/* Logo PNG SAG (remplace l'icône Shield) */}
  <img
    src="/assets/images/logosag.jfif"
    alt="Logo SAG Siguiri"
    className="w-26 h-6 object-contain mb-2"
  />
  <div className="text-sm font-bold text-slate-900 leading-none">
    AshantiGold Anglo · SAG Siguiri
  </div>
  <div className="text-[10px] text-slate-500 mt-1">
    Hôpital de Koron · Siguiri
  </div>
</div>
          </div>

          {/* Badge 17 Villages */}
          <div className="absolute top-32 right-8 z-20 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-2.5">
            <div className="flex -space-x-2">
              <div className="w-7 h-7 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="w-7 h-7 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="w-7 h-7 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 leading-none">17 Villages</div>
              <div className="text-[10px] text-slate-500">Sous surveillance IRS</div>
            </div>
          </div>

          {/* Badge support médical */}
          <div className="absolute bottom-8 left-8 z-20 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 max-w-xs">
            <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center shrink-0">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Support médical 24/7</div>
              <div className="text-[10px] text-slate-500">Assistance IRS · SAG Koron</div>
            </div>
          </div>
        </div>

        {/* Mobile branding */}
        <div className="lg:hidden col-span-1 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white p-2 flex items-center justify-center">
              <div className="text-center font-black text-slate-900 leading-none">
                <span className="text-[10px] text-amber-600 block">SAG</span>
                <span className="text-[8px] text-slate-600">ANGLO</span>
                <span className="text-[9px] text-emerald-700 font-serif font-bold">GOLD</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                Société AngloGold Ashanti
              </div>
              <div className="text-sm font-bold">Hôpital de Koron · Siguiri</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="bg-white/10 p-2 rounded-lg">
              <div className="text-slate-300 uppercase">Seuil cible</div>
              <div className="font-bold text-emerald-400 font-mono">≥ 97.0%</div>
            </div>
            <div className="bg-white/10 p-2 rounded-lg">
              <div className="text-slate-300 uppercase">Insecticide</div>
              <div className="font-bold text-white font-mono">Actellic 300cs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Notice réglementaire en bas */}
      <div className="w-full max-w-7xl mt-6 p-4 bg-white/90 backdrop-blur rounded-xl border border-white/40 text-slate-700 text-xs leading-relaxed shadow-lg">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-green-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-800">
              Notice Réglementaire & Sécurité — Programme Paludisme SAG Koron 2026
            </p>
            <p className="text-[11px] text-slate-600">
              Cette application remplace officiellement le classeur « MALARIA NOTE BOOK 2026 ».
              Accès nominatif sous la supervision du <b>Dr. Faremba Doumbouya</b> et du <b>Colonel Magassouba</b>.
              Toute donnée saisie alimente automatiquement le rapport épidémiologique consolidé de l'Hôpital de Koron.
            </p>
          </div>
        </div>
      </div>

      {/* Modal Aide / Confidentialité / Support */}
      {activeHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            {activeHelpModal === 'help' && (
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-green-600" />
                  Guide d'Accès au Système IRS
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Saisissez votre matricule officiel SAG (ex: <b>SAG-MED-001</b>). En cas d'oubli,
                  contactez le bureau de supervision médicale de l'Hôpital de Koron.
                </p>
                <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 font-mono text-slate-700 mb-4">
                  <div>• Admin : SAG-MED-001 / sag2026</div>
                  <div>• Agent Saisie : SAG-AGT-COL / sag2026</div>
                </div>
              </div>
            )}

            {activeHelpModal === 'privacy' && (
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-green-600" />
                  Confidentialité & Données Sanitaires
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Les données nominatives des chefs de ménage des 17 villages de Siguiri,
                  les effectifs de femmes enceintes et d'enfants 0-5 ans, ainsi que les motifs de refus
                  sont protégés par le secret médical et les normes SAG.
                </p>
              </div>
            )}

            {activeHelpModal === 'support' && (
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-600" />
                  Assistance Technique
                </h3>
                <div className="p-3 bg-green-50 rounded-xl text-xs space-y-1.5 text-green-900 mb-4">
                  <div>• <b>Poste fixe Hôpital</b> : Extension SAG ..... / .....</div>
                  <div>• <b>Canal Radio VHF</b> : Canal 4 (Santé Communautaire)</div>
                  <div>• <b>Médecin Coordinateur</b> : Dr. ....................</div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setActiveHelpModal(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};