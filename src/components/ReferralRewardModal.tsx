import React, { useState } from 'react';
import { Language, UserProfile, ReferralRecord, ReferralRewardConfig } from '../types';
import { 
  getReferralConfig, 
  getUserReferrals, 
  redeemPointsForPass, 
  claimReferralCode 
} from '../utils/storageDb';
import { playChimeSound } from '../utils/audio';
import { 
  Gift, 
  Copy, 
  Check, 
  Share2, 
  Users, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  X, 
  AlertCircle,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface ReferralRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  currentUser: UserProfile;
  onPointsRedeemed?: () => void;
}

export const ReferralRewardModal: React.FC<ReferralRewardModalProps> = ({
  isOpen,
  onClose,
  language,
  currentUser,
  onPointsRedeemed,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [enterCodeInput, setEnterCodeInput] = useState('');
  const [claimStatus, setClaimStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [redeemStatus, setRedeemStatus] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const config: ReferralRewardConfig = getReferralConfig();
  const referrals: ReferralRecord[] = getUserReferrals(currentUser.id);
  const studentCode = currentUser.referralCode || `CAS-${currentUser.name.split(' ')[0].toUpperCase()}-${currentUser.id.slice(-3)}`;
  const currentPoints = currentUser.referralPoints || 0;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(studentCode);
    setCopiedCode(true);
    playChimeSound('click');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Hey! I am preparing for CA Foundation on CA Saathi. Use my invite code "${studentCode}" to join and get ${config.welcomeBonusPoints} free reward points for mock test passes: ${window.location.origin}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleRedeemPass = () => {
    const res = redeemPointsForPass(currentUser.id);
    setRedeemStatus(res);
    if (res.success) {
      playChimeSound('success');
      if (onPointsRedeemed) onPointsRedeemed();
    } else {
      playChimeSound('click');
    }
  };

  const handleClaimFriendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enterCodeInput.trim()) return;

    const res = claimReferralCode(
      currentUser.id,
      currentUser.name,
      currentUser.email,
      enterCodeInput.trim()
    );

    setClaimStatus(res);
    if (res.success) {
      playChimeSound('success');
      setEnterCodeInput('');
      if (onPointsRedeemed) onPointsRedeemed();
    } else {
      playChimeSound('click');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 relative my-6 animate-in fade-in zoom-in-95 overflow-hidden">
        
        {/* Banner */}
        <div className="p-6 bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 text-white flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold border border-white/20 flex items-center gap-1">
                <Gift className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Study Buddies' : 'स्टडी बडीज'}</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {language === 'en' ? 'Invite Friends, Earn Free Passes' : 'साथियों को जोड़ें, फ्री पास पाएं'}
            </h2>
            <p className="text-xs text-blue-100/90 mt-1">
              {language === 'en'
                ? `Get +${config.pointsPerReferral} reward points for every friend who joins. Redeem 100 points for a free pass!`
                : `प्रत्येक मित्र के जुड़ने पर +${config.pointsPerReferral} अंक प्राप्त करें। 100 अंक होने पर फ्री पास रिडीम करें!`}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Points Balance Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase text-amber-800 dark:text-amber-300 block">
                {language === 'en' ? 'Your Reward Points' : 'आपके रिवॉर्ड अंक'}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Sparkles className="w-5 h-5 text-amber-500 fill-amber-400" />
                <span className="text-2xl font-black text-amber-950 dark:text-amber-200">
                  {currentPoints} pts
                </span>
              </div>
            </div>

            <button
              onClick={handleRedeemPass}
              disabled={currentPoints < config.passRedemptionCost}
              className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {language === 'en' ? `Redeem Pass (${config.passRedemptionCost} pts)` : `पास रिडीम करें (${config.passRedemptionCost} pts)`}
            </button>
          </div>

          {redeemStatus && (
            <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              redeemStatus.success 
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 text-emerald-800 dark:text-emerald-200' 
                : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 text-rose-800 dark:text-rose-200'
            }`}>
              {redeemStatus.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{redeemStatus.message}</span>
            </div>
          )}

          {/* Referral Code Box */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {language === 'en' ? 'Your Unique Referral Code:' : 'आपका विशिष्ट रेफरल कोड:'}
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 font-mono font-black text-base text-center tracking-wider text-indigo-700 dark:text-indigo-400 border border-slate-200 dark:border-slate-700">
                {studentCode}
              </div>
              <button
                onClick={handleCopyCode}
                className="py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <Share2 className="w-4 h-4" />
              <span>{language === 'en' ? 'Share on WhatsApp' : 'व्हाट्सएप पर शेयर करें'}</span>
            </button>
          </div>

          {/* Enter a Friend's Referral Code */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
            <span className="text-xs font-bold text-slate-900 dark:text-white block">
              {language === 'en' ? 'Have a friend’s referral code?' : 'क्या आपके पास मित्र का रेफरल कोड है?'}
            </span>
            <form onSubmit={handleClaimFriendCode} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. CAS-ROHAN-42"
                value={enterCodeInput}
                onChange={(e) => setEnterCodeInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold uppercase focus:outline-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              >
                {language === 'en' ? 'Apply' : 'लागू करें'}
              </button>
            </form>

            {claimStatus && (
              <p className={`text-[11px] font-semibold mt-1 ${claimStatus.success ? 'text-emerald-600' : 'text-rose-600'}`}>
                {claimStatus.message}
              </p>
            )}
          </div>

          {/* Referral History */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>{language === 'en' ? 'Your Invited Friends' : 'आपके आमंत्रित मित्र'} ({referrals.length})</span>
            </h4>

            {referrals.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                {language === 'en' ? 'No friends invited yet. Share your code above!' : 'अभी तक कोई मित्र नहीं जुड़ा। ऊपर दिए कोड को शेयर करें!'}
              </p>
            ) : (
              <div className="space-y-2">
                {referrals.map((ref) => (
                  <div
                    key={ref.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{ref.refereeName}</span>
                      <span className="text-[10px] text-slate-400">{ref.createdAt} • Verified Registration</span>
                    </div>
                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                      +{ref.pointsAwarded} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
