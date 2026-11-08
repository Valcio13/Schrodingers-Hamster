import React, { useState, useEffect, useRef } from 'react';
import { QuantumHybrid, Web3WalletState, SiweSessionState, MintGateInfo } from '../types/game';
import {
  checkWalletConnection,
  connectWallet,
  switchToSepolia,
  performSiweLogin,
  initiateMintGate,
  checkMintGateStatus,
  requestMintAuthorization,
  executeMintTransaction,
  confirmMintWithBackend,
  getPublicClient,
  DEFAULT_CONTRACT_ADDRESS,
  SEPOLIA_CHAIN_ID
} from '../services/web3';
import { PixelHybridHamster } from './PixelHybridHamster';
import {
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  ExternalLink,
  X,
  AlertTriangle,
  Loader2,
  Wallet,
  Clock,
  Activity,
  Layers,
  RefreshCw
} from 'lucide-react';
import { audio } from '../services/audio';
import confetti from 'canvas-confetti';

interface MintNftModalProps {
  hybrid: QuantumHybrid;
  wallet: Web3WalletState;
  session: SiweSessionState;
  onClose: () => void;
  onSuccess: (updatedHybrid: QuantumHybrid) => void;
}

export type MintFlowStep =
  | 'initial'
  | 'awaiting_squeek_block'  // 1. Awaiting Squeek Block
  | 'verifying_settlement'   // 2. Verifying Settlement
  | 'ready_to_mint'          // 3. Ready to Mint
  | 'wallet_confirmation'    // 4. Wallet Confirmation
  | 'minted_successfully'    // 5. Minted Successfully
  | 'error';

export const MintNftModal: React.FC<MintNftModalProps> = ({
  hybrid,
  wallet,
  session,
  onClose,
  onSuccess
}) => {
  const [step, setStep] = useState<MintFlowStep>('initial');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [mintedTokenId, setMintedTokenId] = useState<number | null>(null);
  const [currentWallet, setCurrentWallet] = useState<Web3WalletState>(wallet);
  const [currentSession, setCurrentSession] = useState<SiweSessionState>(session);
  const [gateInfo, setGateInfo] = useState<MintGateInfo | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const pollTimerRef = useRef<any>(null);

  const displayName = hybrid.generatedName || hybrid.nickname;

  // On mount: check if specimen already has an active or unlocked mint gate
  useEffect(() => {
    let isMounted = true;

    async function checkInitialStatus() {
      if (hybrid.nftTokenId) {
        setMintedTokenId(hybrid.nftTokenId);
        setTxHash(hybrid.nftTxHash || null);
        setStep('minted_successfully');
        return;
      }

      try {
        setIsChecking(true);
        const info = await checkMintGateStatus(hybrid.id);
        if (!isMounted) return;
        setGateInfo(info);

        if (info.status === 'unlocked') {
          setStep('ready_to_mint');
        } else if (info.status === 'awaiting_block') {
          setStep('awaiting_squeek_block');
        } else if (info.status === 'minted') {
          setStep('minted_successfully');
        } else {
          setStep('initial');
        }
      } catch (err) {
        console.warn('Initial mint gate check warning:', err);
        if (isMounted) setStep('initial');
      } finally {
        if (isMounted) setIsChecking(false);
      }
    }

    checkInitialStatus();

    return () => {
      isMounted = false;
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [hybrid.id, hybrid.nftTokenId]);

  // Polling loop while in 'awaiting_squeek_block'
  useEffect(() => {
    if (step !== 'awaiting_squeek_block') {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      return;
    }

    pollTimerRef.current = setInterval(async () => {
      try {
        const info = await checkMintGateStatus(hybrid.id);
        setGateInfo(info);

        if (info.status === 'unlocked') {
          audio.playClick();
          setStep('ready_to_mint');
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        } else if (info.liveBlockHeight && gateInfo?.baselineBlockHeight && info.liveBlockHeight > gateInfo.baselineBlockHeight) {
          // Detected newer block, brief verification state
          setStep('verifying_settlement');
        }
      } catch (err: any) {
        console.warn('Polling mint status warning:', err);
      }
    }, 4000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [step, hybrid.id, gateInfo?.baselineBlockHeight]);

  // Helper to ensure wallet and SIWE authentication
  const ensureAuthenticated = async () => {
    let activeWallet = currentWallet;
    if (!activeWallet.connected || !activeWallet.address) {
      activeWallet = await connectWallet();
      setCurrentWallet(activeWallet);
    }

    if (activeWallet.chainId !== SEPOLIA_CHAIN_ID) {
      await switchToSepolia();
      activeWallet = await checkWalletConnection();
      setCurrentWallet(activeWallet);
    }

    let activeSession = currentSession;
    if (!activeSession.authenticated && activeWallet.address) {
      activeSession = await performSiweLogin(activeWallet.address);
      setCurrentSession(activeSession);
    }

    return { activeWallet, activeSession };
  };

  // Step 1: Initiate Squeek Gate
  const handleInitiateGate = async () => {
    audio.playClick();
    setErrorMessage(null);
    setIsChecking(true);

    try {
      await ensureAuthenticated();
      const info = await initiateMintGate(hybrid.id);
      setGateInfo(info);

      if (info.status === 'unlocked') {
        setStep('ready_to_mint');
      } else {
        setStep('awaiting_squeek_block');
      }
    } catch (err: any) {
      console.error('Initiate gate error:', err);
      setStep('error');
      setErrorMessage(err.message || 'Failed to initiate Squeekchain Mint Gate.');
    } finally {
      setIsChecking(false);
    }
  };

  // Manual status refresh
  const handleManualCheck = async () => {
    audio.playClick();
    setIsChecking(true);
    setErrorMessage(null);

    try {
      const info = await checkMintGateStatus(hybrid.id);
      setGateInfo(info);
      if (info.status === 'unlocked') {
        setStep('ready_to_mint');
      } else {
        setStep('awaiting_squeek_block');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Temporary API check failure.');
    } finally {
      setIsChecking(false);
    }
  };

  // Steps 4 & 5: Proceed to Onchain Minting
  const handleProceedToMint = async () => {
    audio.playClick();
    setErrorMessage(null);

    try {
      const { activeWallet } = await ensureAuthenticated();

      // Request Server-Signed EIP-712 Mint Authorization
      setStep('wallet_confirmation');
      const auth = await requestMintAuthorization(hybrid.id);

      // Submit transaction via connected wallet
      const hash = await executeMintTransaction(auth);
      setTxHash(hash);

      // Wait for Sepolia block confirmation
      const publicClient = getPublicClient();
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status !== 'success') {
        throw new Error('Mint transaction reverted on Sepolia.');
      }

      // Confirm with Backend to bind D1 state
      const confirmRes = await confirmMintWithBackend(auth.tokenId, hash);
      setMintedTokenId(auth.tokenId);
      setStep('minted_successfully');

      audio.playLevelUp();
      confetti({
        particleCount: 130,
        spread: 85,
        origin: { y: 0.6 }
      });

      if (confirmRes && confirmRes.hybrid) {
        onSuccess(confirmRes.hybrid);
      } else {
        const updated: QuantumHybrid = {
          ...hybrid,
          nftTokenId: auth.tokenId,
          nftTxHash: hash,
          nftContractAddress: auth.contractAddress || DEFAULT_CONTRACT_ADDRESS,
          nftMintedAt: Date.now(),
          nftOwnerAddress: activeWallet.address || undefined
        };
        onSuccess(updated);
      }
    } catch (err: any) {
      console.error('Minting execution error:', err);
      setStep('error');
      if (err.message?.includes('User rejected') || err.message?.includes('rejected')) {
        setErrorMessage('Transaction was rejected in your wallet.');
      } else if (err.message?.includes('insufficient funds')) {
        setErrorMessage('Insufficient Sepolia test ETH for gas. Request free test ETH from a Sepolia faucet.');
      } else {
        setErrorMessage(err.message || 'An error occurred during mint transaction.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div className="bg-slate-900 border border-purple-500/60 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative space-y-4">
        {/* Close Button: Always available except while signing in wallet */}
        {step !== 'wallet_confirmation' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Header */}
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-500/50 flex items-center justify-center text-purple-300">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white font-fredoka flex items-center gap-1.5">
              Mint as Immutable NFT <span className="text-xs px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 font-mono border border-purple-500/30">Sepolia Testnet</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
              <span>Ethereum Sepolia (11155111)</span>
              <span>•</span>
              <span className="text-cyan-400">Squeekchain Gate</span>
              <span>•</span>
              <span className="text-amber-300">100% Optional</span>
            </p>
          </div>
        </div>

        {/* Specimen Visual & Attributes Card */}
        <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center gap-4">
          <div className="w-20 h-20 shrink-0 flex items-center justify-center rounded-xl bg-slate-900/80 border border-slate-800/80">
            <PixelHybridHamster hybrid={hybrid} size="lg" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-bold text-white font-fredoka truncate">
                {displayName}
              </span>
              <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-purple-950/90 text-purple-300 border border-purple-500/40">
                {hybrid.rarity}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono truncate">
              Lineage: {hybrid.parent1Species} × {hybrid.parent2Species}
            </div>
            <div className="text-[10px] text-purple-300/80 font-mono truncate">
              {hybrid.traits.activeMutations?.join(' • ') || 'Standard quantum genome'}
            </div>
          </div>
        </div>

        {/* Optionality & Beta Notice */}
        <div className="px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 font-sans flex items-center justify-between">
          <span>✨ Minting as an NFT is completely optional.</span>
          <span className="text-[10px] text-purple-300 font-mono">Sepolia Testnet Beta</span>
        </div>

        {/* Recipient Wallet Display */}
        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs font-mono flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-cyan-400" /> Recipient:
          </span>
          <span className="text-slate-200 font-bold truncate max-w-[200px]">
            {currentWallet.address
              ? `${currentWallet.address.slice(0, 6)}...${currentWallet.address.slice(-4)}`
              : 'Connect Wallet on Mint'}
          </span>
        </div>

        {/* 5-STATE FLOW CARD */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-3">
          {/* STATE 1: Awaiting Squeek Block */}
          {step === 'awaiting_squeek_block' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-amber-300 font-bold">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 animate-spin text-amber-400" />
                  <span>State 1/5: Awaiting Next Squeek Block</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-600/40">
                  Locked
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                Minting requires proof of work verified by Squeektoshi's wheel. A verified Squeekchain block must settle onchain strictly after your request.
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px] p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px]">Baseline Block Height:</span>
                  <span className="font-bold text-white">#{gateInfo?.baselineBlockHeight || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Settled / Live Block:</span>
                  <span className="font-bold text-cyan-400">
                    #{gateInfo?.liveBlockHeight || gateInfo?.baselineBlockHeight || '—'}
                  </span>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-blue-950/40 border border-blue-500/30 text-[10px] text-blue-200 flex items-center justify-between">
                <span>💡 You can close this window and continue playing.</span>
                <button
                  onClick={handleManualCheck}
                  disabled={isChecking}
                  className="px-2 py-1 rounded bg-blue-900/80 hover:bg-blue-800 text-blue-200 flex items-center gap-1 font-mono transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
                  <span>Check Now</span>
                </button>
              </div>
            </div>
          )}

          {/* STATE 2: Verifying Settlement */}
          {step === 'verifying_settlement' && (
            <div className="space-y-2 text-cyan-300">
              <div className="flex items-center gap-2 font-bold">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span>State 2/5: Verifying Squeekchain Settlement...</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                A new Squeekchain block was detected! Validating onchain settlement round and post-request completion evidence on Ethereum Sepolia.
              </p>
              <div className="flex items-center gap-2 text-[10px] text-cyan-400">
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                <span>Verifying anchor transaction hash & round boundaries...</span>
              </div>
            </div>
          )}

          {/* STATE 3: Ready to Mint */}
          {step === 'ready_to_mint' && (
            <div className="space-y-2.5 text-emerald-300">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>State 3/5: Ready to Mint!</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                  Unlocked
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                Eligible! Squeekchain block <strong>#{gateInfo?.qualifyingBlockHeight || (gateInfo?.baselineBlockHeight ? gateInfo.baselineBlockHeight + 1 : '—')}</strong> was completed and verified. Eligibility is permanently unlocked for this specimen.
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px] p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px]">Baseline Block:</span>
                  <span className="font-bold text-slate-300">#{gateInfo?.baselineBlockHeight || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Qualifying Block:</span>
                  <span className="font-bold text-emerald-400">
                    #{gateInfo?.qualifyingBlockHeight || 'Verified'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STATE 4: Wallet Confirmation */}
          {step === 'wallet_confirmation' && (
            <div className="space-y-2 text-purple-300 animate-pulse">
              <div className="flex items-center gap-2 font-bold">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                <span>State 4/5: Please Confirm in Your Wallet...</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                Generating cryptographic EIP-712 authorization and submitting transaction to Ethereum Sepolia. Check your wallet extension for signature and gas confirmation.
              </p>
            </div>
          )}

          {/* STATE 5: Minted Successfully */}
          {step === 'minted_successfully' && (
            <div className="space-y-2 text-emerald-400">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>State 5/5: Mint Confirmed! Token #{mintedTokenId || hybrid.nftTokenId}</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                Your procedural quantum hamster is permanently recorded onto Ethereum Sepolia with immutable IPFS metadata and artwork.
              </p>
              {(txHash || hybrid.nftTxHash) && (
                <a
                  href={`https://sepolia.etherscan.io/tx/${txHash || hybrid.nftTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-cyan-300 hover:text-cyan-200 underline pt-1"
                >
                  <span>View Transaction on Sepolia Etherscan</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}

          {/* INITIAL STATE */}
          {step === 'initial' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-200 font-bold">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Squeekchain Next-Block Gate</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                To guarantee genuine provenance, minting this specimen requires recording a baseline Squeek block, then waiting for Squeektoshi to complete the next settled block.
              </p>
            </div>
          )}

          {/* ERROR STATE */}
          {step === 'error' && (
            <div className="flex items-start gap-2 text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-tight space-y-1">
                <span className="font-bold block">Mint Gate Notice:</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}
        </div>

        {/* Immutability Notice */}
        <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200/90 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed font-sans">
            <strong>True Immutability Guarantee:</strong> Once minted, this specimen's genome, eye morphology, horns, limbs, wings, aura, and artwork are permanently frozen onto Ethereum Sepolia.
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-2 flex items-center justify-end gap-2.5">
          {step === 'minted_successfully' ? (
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs font-mono transition-colors shadow-lg shadow-purple-600/30"
            >
              Back to QuantumDex
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                disabled={step === 'wallet_confirmation'}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {step === 'awaiting_squeek_block' ? 'Close & Wait in Background' : 'Cancel'}
              </button>

              {step === 'initial' && (
                <button
                  onClick={handleInitiateGate}
                  disabled={isChecking}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs font-mono transition-all shadow-lg shadow-purple-600/30 flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Lock Squeek Gate</span>
                </button>
              )}

              {step === 'awaiting_squeek_block' && (
                <button
                  onClick={handleManualCheck}
                  disabled={isChecking}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs font-mono transition-all shadow-lg shadow-amber-600/30 flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                  <span>Check Squeek Block</span>
                </button>
              )}

              {step === 'verifying_settlement' && (
                <button
                  disabled
                  className="px-5 py-2.5 rounded-xl bg-cyan-700 text-white font-bold text-xs font-mono opacity-80 flex items-center gap-1.5"
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying...</span>
                </button>
              )}

              {step === 'ready_to_mint' && (
                <button
                  onClick={handleProceedToMint}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs font-mono transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Authorize & Mint (Sepolia)</span>
                </button>
              )}

              {step === 'error' && (
                <button
                  onClick={gateInfo?.status === 'unlocked' ? handleProceedToMint : handleInitiateGate}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs font-mono transition-all shadow-lg shadow-rose-600/30 flex items-center gap-1.5 active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
