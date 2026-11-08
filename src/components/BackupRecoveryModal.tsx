import React, { useState, useRef } from 'react';
import {
  X,
  Download,
  Upload,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Wallet,
  FileJson,
  Info,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { PlayerState, BackupValidationResult } from '../types/game';
import { exportPlayerBackup, validatePlayerBackup, importPlayerBackup } from '../services/api';
import { audio } from '../services/audio';

interface BackupRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerState | null;
  onRestoreSuccess: (player: PlayerState) => void;
}

export const BackupRecoveryModal: React.FC<BackupRecoveryModalProps> = ({
  isOpen,
  onClose,
  player,
  onRestoreSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'guide'>('export');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  // Import state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedBackup, setParsedBackup] = useState<any | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<BackupValidationResult | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExportBackup = async () => {
    setIsExporting(true);
    setExportSuccessMessage(null);
    try {
      audio.playClick();
      const backupData = await exportPlayerBackup();
      
      // Trigger browser file download
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `schrodingers-hamster-backup-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      audio.playSuccess();
      setExportSuccessMessage(`Backup saved: schrodingers-hamster-backup-${dateStr}.json (HMAC-SHA256 verified)`);
    } catch (err: any) {
      console.error('Export failed:', err);
      audio.playError();
      setExportSuccessMessage(`Export failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setValidationResult(null);
    setRestoreError(null);
    setIsValidating(true);

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      setParsedBackup(json);

      // Call server validation endpoint
      const result = await validatePlayerBackup(json);
      setValidationResult(result);
      if (result.valid && result.canRestore) {
        audio.playSuccess();
      } else {
        audio.playError();
      }
    } catch (err: any) {
      setValidationResult({
        valid: false,
        canRestore: false,
        error: 'PARSE_ERROR',
        message: 'Invalid JSON file: Could not parse backup file contents.'
      });
      audio.playError();
    } finally {
      setIsValidating(false);
    }
  };

  const handleExecuteRestore = async () => {
    if (!parsedBackup || !validationResult?.canRestore) return;

    setIsRestoring(true);
    setRestoreError(null);
    try {
      audio.playClick();
      const res = await importPlayerBackup(parsedBackup);
      audio.playVictory();
      onRestoreSuccess(res.player);
      onClose();
    } catch (err: any) {
      console.error('Restore error:', err);
      audio.playError();
      setRestoreError(err.message || 'Failed to restore player state.');
    } finally {
      setIsRestoring(false);
    }
  };

  const isWalletConnected = typeof window !== 'undefined' && !!sessionStorage.getItem('squeek_session_token');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          audio.playClick();
          onClose();
        }
      }}
    >
      <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl relative text-left">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-lime-500/10 border border-lime-500/30 flex items-center justify-center text-lime-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-fredoka text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2">
                Laboratory Save & Recovery
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Authoritative Cloudflare D1 Backups & Cryptographic Integrity
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              audio.playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-2 bg-slate-950/40 border-b border-slate-800/80 shrink-0">
          <button
            onClick={() => {
              audio.playClick();
              setActiveTab('export');
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'export'
                ? 'bg-lime-400 text-slate-950 shadow-sm shadow-lime-400/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Backup</span>
          </button>

          <button
            onClick={() => {
              audio.playClick();
              setActiveTab('import');
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'import'
                ? 'bg-lime-400 text-slate-950 shadow-sm shadow-lime-400/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import & Recover</span>
          </button>

          <button
            onClick={() => {
              audio.playClick();
              setActiveTab('guide');
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-lime-400 text-slate-950 shadow-sm shadow-lime-400/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Account Security</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: EXPORT BACKUP */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              {/* Account State Overview */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono">Current Account:</span>
                  <span className="font-mono font-bold text-lime-400">
                    {player?.id || 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono">Identity Type:</span>
                  <span className="flex items-center gap-1 font-mono text-xs">
                    {isWalletConnected ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Wallet className="w-3 h-3" /> SIWE Verified Wallet
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Guest Researcher
                      </span>
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-center font-mono">
                  <div className="p-2 rounded-lg bg-slate-900/60">
                    <div className="text-[10px] text-slate-400">Lab Level</div>
                    <div className="text-sm font-bold text-white">Lvl {player?.labLevel || 1}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/60">
                    <div className="text-[10px] text-slate-400">Companions</div>
                    <div className="text-sm font-bold text-white">{(player?.hamsters || []).length} / 30</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/60">
                    <div className="text-[10px] text-slate-400">Hybrids</div>
                    <div className="text-sm font-bold text-white">{(player?.hybrids || []).length} / 30</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/60">
                    <div className="text-[10px] text-slate-400">Research Notes</div>
                    <div className="text-sm font-bold text-cyan-300">{player?.researchInsight || 0}</div>
                  </div>
                </div>
              </div>

              {/* Explanatory Banner */}
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs text-slate-300 space-y-1.5">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-lime-400" />
                  Cryptographically Protected Save Export
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Your backup is generated directly from authoritative Cloudflare D1 server storage. It includes all procedural hybrid genetics, custom nicknames, unlocked research, energy, and Quantum Fate records. An HMAC-SHA256 signature guarantees authenticity.
                </p>
                <div className="text-[10px] text-slate-400 font-mono">
                  Filename format: <span className="text-lime-300">schrodingers-hamster-backup-YYYY-MM-DD.json</span>
                </div>
              </div>

              {/* Export Status Notification */}
              {exportSuccessMessage && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{exportSuccessMessage}</span>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleExportBackup}
                disabled={isExporting}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-lime-400 text-slate-950 hover:bg-lime-300 transition-colors shadow-lg shadow-lime-400/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating Server Snapshot...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download Save Backup (.json)
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: IMPORT & RESTORE */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              {/* Anti-Rollback Safety Notice */}
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-300">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Anti-Rollback Protection Active
                </div>
                <p className="text-[11px] text-amber-200/80 leading-relaxed">
                  Backups cannot be replayed to duplicate Research Notes, restore released specimens, or revert experiment outcomes. Restoration is only permitted on fresh installs or when recovering a cleared browser cache.
                </p>
              </div>

              {/* File Selector Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-lime-400 rounded-xl p-5 text-center cursor-pointer transition-colors bg-slate-950/40 space-y-2"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json,application/json"
                  className="hidden"
                />
                <div className="w-10 h-10 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                  <FileJson className="w-5 h-5 text-lime-400" />
                </div>
                <div>
                  <div className="font-bold text-xs text-white">
                    {selectedFile ? selectedFile.name : 'Click to select backup JSON file'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Accepts verified schrodingers-hamster-backup-*.json'}
                  </div>
                </div>
              </div>

              {/* Validation Feedback */}
              {isValidating && (
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700 text-xs text-slate-300 font-mono flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-lime-400" />
                  <span>Verifying HMAC cryptographic signature with server...</span>
                </div>
              )}

              {validationResult && !isValidating && (
                <div className="space-y-3">
                  {/* Validation Status Card */}
                  <div
                    className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                      validationResult.canRestore
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                        : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm">
                      {validationResult.canRestore ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Backup Verified & Eligible for Recovery</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>Restoration Prohibited</span>
                        </>
                      )}
                    </div>

                    <p className="text-[11px] leading-relaxed opacity-90">
                      {validationResult.message}
                    </p>

                    {/* Snapshot Metadata if present */}
                    {validationResult.summary && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/60 text-center font-mono text-[10px]">
                        <div className="p-1.5 rounded bg-slate-900/60">
                          <span className="text-slate-400">Revision:</span> #{validationResult.summary.saveRevision || validationResult.saveRevision || 1}
                        </div>
                        <div className="p-1.5 rounded bg-slate-900/60">
                          <span className="text-slate-400">Lab:</span> Lvl {validationResult.summary.labLevel}
                        </div>
                        <div className="p-1.5 rounded bg-slate-900/60">
                          <span className="text-slate-400">Specimens:</span> {validationResult.summary.totalHamsters}
                        </div>
                        <div className="p-1.5 rounded bg-slate-900/60">
                          <span className="text-slate-400">Notes:</span> {validationResult.summary.researchInsight}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Restore Action */}
                  {validationResult.canRestore ? (
                    <button
                      onClick={handleExecuteRestore}
                      disabled={isRestoring}
                      className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isRestoring ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Restoring Laboratory State...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Restore Laboratory Save
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-slate-800 text-slate-500 cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      Restoration Locked (Safety Policy)
                    </button>
                  )}

                  {restoreError && (
                    <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs font-mono">
                      {restoreError}
                    </div>
                  )}
                </div>
              )}

              {/* Admin-Assisted Recovery Accordion */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1">
                <div className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-cyan-400" />
                  Admin-Assisted Recovery Policy
                </div>
                <p className="text-[11px] leading-relaxed">
                  If you have lost your browser cache or switched devices and automated validation fails, keep your downloaded backup file safe. An operator can inspect the cryptographically signed D1 backup and re-link your player profile without exposing private keys.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: ACCOUNT IDENTITY GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-2">
                <div className="font-bold text-purple-300 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-purple-400" />
                  Permanent Identity: Web3 Wallet (Recommended)
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Linking your account with an Ethereum wallet via Sign-In With Ethereum (SIWE) provides permanent, unloseable account identity. Even if browser cookies and local storage are completely wiped, re-connecting your wallet immediately restores your exact laboratory and NFT collection.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-2">
                <div className="font-bold text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Guest Account Limitations
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Guest accounts rely on your browser's local storage key (<code className="text-lime-300">squeek_player_id</code>). If you use Incognito mode, clear site data, or change devices, the guest ID will be lost. To prevent losing your progress as a guest:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px] pl-1 font-mono">
                  <li>Download a Save Backup regularly using the Export tab.</li>
                  <li>Record your unique Player ID somewhere safe.</li>
                  <li>Or simply connect an Ethereum wallet to bind your account permanently.</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="font-bold text-slate-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-lime-400" />
                  Immutable NFTs & Onchain Ownership
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Specimens minted as NFTs on Sepolia are permanently recorded on the blockchain and pinned on IPFS. They can never be lost, modified, or transferred through local save files.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
