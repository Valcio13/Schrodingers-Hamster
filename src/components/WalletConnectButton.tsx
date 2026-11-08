import React, { useState, useEffect, useRef } from 'react';
import {
  checkWalletConnection,
  connectWallet,
  switchToSepolia,
  performSiweLogin,
  checkSiweSession,
  performLogout,
  SEPOLIA_CHAIN_ID,
  getEthereumProvider
} from '../services/web3';
import { Web3WalletState, SiweSessionState } from '../types/game';
import { Wallet, LogOut, CheckCircle2, AlertTriangle, ShieldCheck, Copy, Check } from 'lucide-react';
import { audio } from '../services/audio';

interface WalletConnectButtonProps {
  onSessionChange?: (session: SiweSessionState) => void;
}

export const WalletConnectButton: React.FC<WalletConnectButtonProps> = ({ onSessionChange }) => {
  const [wallet, setWallet] = useState<Web3WalletState>({
    connected: false,
    address: null,
    chainId: null,
    isSepolia: false
  });

  const [session, setSession] = useState<SiweSessionState>({
    authenticated: false,
    address: null,
    playerId: null,
    sessionToken: null
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showPopover, setShowPopover] = useState(false);
  const [copied, setCopied] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Initialize and listen to wallet changes
  useEffect(() => {
    let mounted = true;

    async function init() {
      const w = await checkWalletConnection();
      if (mounted) setWallet(w);

      const s = await checkSiweSession();
      if (mounted) {
        setSession(s);
        if (onSessionChange) onSessionChange(s);
      }
    }
    init();

    const provider = getEthereumProvider();
    if (provider && provider.on) {
      const handleAccountsChanged = async (accounts: string[]) => {
        if (!accounts || accounts.length === 0) {
          sessionStorage.removeItem('squeek_session_token');
          const unauthSession = { authenticated: false, address: null, playerId: null, sessionToken: null };
          setWallet({ connected: false, address: null, chainId: null, isSepolia: false });
          setSession(unauthSession);
          if (onSessionChange) onSessionChange(unauthSession);
        } else {
          // If wallet account switched, revoke previous session to ensure fresh SIWE auth
          const newAddress = accounts[0].toLowerCase();
          const token = sessionStorage.getItem('squeek_session_token');
          if (token) {
            sessionStorage.removeItem('squeek_session_token');
            const unauthSession = { authenticated: false, address: null, playerId: null, sessionToken: null };
            setSession(unauthSession);
            if (onSessionChange) onSessionChange(unauthSession);
          }
          const updated = await checkWalletConnection();
          setWallet(updated);
        }
      };

      const handleChainChanged = async () => {
        const updated = await checkWalletConnection();
        setWallet(updated);
      };

      provider.on('accountsChanged', handleAccountsChanged);
      provider.on('chainChanged', handleChainChanged);

      return () => {
        mounted = false;
        if (provider.removeListener) {
          provider.removeListener('accountsChanged', handleAccountsChanged);
          provider.removeListener('chainChanged', handleChainChanged);
        }
      };
    }

    return () => {
      mounted = false;
    };
  }, []);

  // Close popover on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowPopover(false);
      }
    }
    if (showPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPopover]);

  const handleConnect = async () => {
    audio.playClick();
    setIsLoading(true);
    try {
      const w = await connectWallet();
      setWallet(w);
      if (w.connected && w.address && !session.authenticated) {
        // Automatically prompt SIWE authentication
        try {
          const s = await performSiweLogin(w.address);
          setSession(s);
          if (onSessionChange) onSessionChange(s);
        } catch (siweErr: any) {
          console.warn('SIWE login skipped or rejected:', siweErr);
        }
      }
    } catch (err: any) {
      console.error('Wallet connection failed:', err);
      alert(err.message || 'Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSiweLogin = async () => {
    if (!wallet.address) return;
    audio.playClick();
    setIsLoading(true);
    try {
      const s = await performSiweLogin(wallet.address);
      setSession(s);
      if (onSessionChange) onSessionChange(s);
    } catch (err: any) {
      alert(err.message || 'SIWE authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchNetwork = async () => {
    audio.playClick();
    setIsLoading(true);
    try {
      await switchToSepolia();
      const updated = await checkWalletConnection();
      setWallet(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to switch network to Sepolia');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    audio.playClick();
    await performLogout();
    setSession({ authenticated: false, address: null, playerId: null, sessionToken: null });
    setShowPopover(false);
    if (onSessionChange) onSessionChange({ authenticated: false, address: null, playerId: null, sessionToken: null });
  };

  const handleCopy = () => {
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const formatShortAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="relative inline-block font-mono" ref={popoverRef}>
      {/* 1. DISCONNECTED STATE */}
      {!wallet.connected ? (
        <button
          onClick={handleConnect}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/90 border border-cyan-500/50 text-cyan-300 hover:text-white text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
          title="Connect EVM Wallet (MetaMask, Rabby, etc.)"
        >
          <Wallet className="w-3.5 h-3.5 text-cyan-400" />
          <span>{isLoading ? 'CONNECTING...' : 'CONNECT WALLET'}</span>
        </button>
      ) : !wallet.isSepolia ? (
        /* 2. WRONG NETWORK STATE */
        <button
          onClick={handleSwitchNetwork}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/90 hover:bg-amber-900 border border-amber-500/70 text-amber-300 hover:text-white text-xs font-bold transition-all shadow-sm active:scale-95 animate-pulse"
          title="Click to switch to Ethereum Sepolia"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>SWITCH TO SEPOLIA</span>
        </button>
      ) : (
        /* 3. CONNECTED STATE */
        <button
          onClick={() => {
            audio.playClick();
            setShowPopover(prev => !prev);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 border ${
            session.authenticated
              ? 'bg-slate-900 hover:bg-slate-800 border-purple-500/60 text-purple-300 hover:text-white'
              : 'bg-slate-900 hover:bg-slate-800 border-amber-500/50 text-amber-300 hover:text-white'
          }`}
          title="Wallet Connected • Click to view options"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{wallet.address ? formatShortAddress(wallet.address) : 'Connected'}</span>
        </button>
      )}

      {/* POPOVER MENU */}
      {showPopover && wallet.connected && wallet.address && (
        <div className="absolute right-0 mt-2 w-64 p-3 rounded-2xl bg-slate-950/95 border border-purple-500/60 shadow-2xl z-50 text-xs backdrop-blur-md animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span>Ethereum Sepolia</span>
            <span className="text-emerald-400 font-mono">Chain 11155111</span>
          </div>

          {/* Full Address */}
          <div className="mt-2.5 p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-200 font-mono break-all select-all">
              {formatShortAddress(wallet.address)}
            </span>
            <button
              onClick={handleCopy}
              className="p-1 text-slate-400 hover:text-white transition-colors"
              title="Copy Address"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* SIWE Status */}
          <div className="mt-2.5 pt-2 border-t border-slate-800/80">
            {session.authenticated ? (
              <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>SIWE Authenticated</span>
              </div>
            ) : (
              <button
                onClick={handleSiweLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-purple-950/90 hover:bg-purple-900 border border-purple-500/60 text-purple-200 hover:text-white font-bold text-[11px] transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                <span>{isLoading ? 'SIGNING...' : 'Sign In with Ethereum'}</span>
              </button>
            )}
          </div>

          {/* Disconnect Action */}
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex justify-end">
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-rose-400 transition-colors"
            >
              <LogOut className="w-3 h-3" />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
