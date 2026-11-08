import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  fallback,
  parseAbi,
  keccak256,
  toHex,
  Address,
  Hash
} from 'viem';
import { sepolia } from 'viem/chains';
import { MintAuthorizationPayload, Web3WalletState, SiweSessionState, MintGateInfo } from '../types/game';
import { BASE_URL } from './api';

export const SEPOLIA_CHAIN_ID = 11155111;

// Free public reliable Sepolia RPC endpoints
export const SEPOLIA_RPC_ENDPOINTS = [
  'https://rpc.sepolia.org',
  'https://ethereum-sepolia-rpc.publicnode.com',
  'https://1rpc.io/sepolia',
  'https://sepolia.gateway.tenderly.co'
];

// Official deployed Schrödinger's Hamster NFT contract on Ethereum Sepolia
export const DEFAULT_CONTRACT_ADDRESS: Address =
  ((import.meta as any).env?.VITE_NFT_CONTRACT_ADDRESS as Address) ||
  '0xd77e88ccdb7b535133796d428e95322217ce99a4';

export const HAMSTER_NFT_ABI = parseAbi([
  'function mintWithAuthorization(address recipient, uint256 tokenId, string uri, bytes32 metadataHash, bytes32 specimenHash, uint256 nonce, uint256 deadline, bytes signature) external',
  'function ownerOf(uint256 tokenId) external view returns (address)',
  'function tokenURI(uint256 tokenId) external view returns (string)',
  'function totalMinted() external view returns (uint256)',
  'function specimenMinted(bytes32 specimenHash) external view returns (bool)',
  'event HamsterMinted(uint256 indexed tokenId, address indexed recipient, bytes32 indexed specimenHash, bytes32 metadataHash, string tokenURI)'
]);

export function getPublicClient() {
  return createPublicClient({
    chain: sepolia,
    transport: fallback(SEPOLIA_RPC_ENDPOINTS.map(url => http(url)))
  });
}

export function getEthereumProvider(): any {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    return (window as any).ethereum;
  }
  return null;
}

export function getWalletClient() {
  const provider = getEthereumProvider();
  if (!provider) throw new Error('No EVM wallet detected (MetaMask, Rabby, etc.)');
  return createWalletClient({
    chain: sepolia,
    transport: custom(provider)
  });
}

/**
 * Checks current wallet connection state without triggering popups.
 */
export async function checkWalletConnection(): Promise<Web3WalletState> {
  const provider = getEthereumProvider();
  if (!provider) {
    return { connected: false, address: null, chainId: null, isSepolia: false };
  }

  try {
    const accounts = (await provider.request({ method: 'eth_accounts' })) as string[];
    const chainIdHex = (await provider.request({ method: 'eth_chainId' })) as string;
    const chainId = parseInt(chainIdHex, 16);

    if (accounts && accounts.length > 0) {
      return {
        connected: true,
        address: accounts[0],
        chainId,
        isSepolia: chainId === SEPOLIA_CHAIN_ID
      };
    }
  } catch (err) {
    console.warn('Error reading wallet status:', err);
  }

  return { connected: false, address: null, chainId: null, isSepolia: false };
}

/**
 * Connect wallet by requesting accounts.
 */
export async function connectWallet(): Promise<Web3WalletState> {
  const provider = getEthereumProvider();
  if (!provider) {
    throw new Error('No Ethereum wallet extension found. Please install MetaMask or Rabby.');
  }

  const accounts = (await provider.request({ method: 'eth_requestAccounts' })) as string[];
  const chainIdHex = (await provider.request({ method: 'eth_chainId' })) as string;
  const chainId = parseInt(chainIdHex, 16);

  if (!accounts || accounts.length === 0) {
    throw new Error('Wallet connection rejected by user.');
  }

  // If wrong chain, request switch
  if (chainId !== SEPOLIA_CHAIN_ID) {
    try {
      await switchToSepolia();
    } catch (switchErr) {
      console.warn('Network switch failed or dismissed:', switchErr);
    }
  }

  const updatedChainIdHex = (await provider.request({ method: 'eth_chainId' })) as string;
  const updatedChainId = parseInt(updatedChainIdHex, 16);

  return {
    connected: true,
    address: accounts[0],
    chainId: updatedChainId,
    isSepolia: updatedChainId === SEPOLIA_CHAIN_ID
  };
}

/**
 * Request network switch to Ethereum Sepolia.
 */
export async function switchToSepolia(): Promise<boolean> {
  const provider = getEthereumProvider();
  if (!provider) return false;

  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0xaa36a7' }] // 11155111 in hex
    });
    return true;
  } catch (switchError: any) {
    // 4902 indicates chain has not been added to wallet
    if (switchError.code === 4902) {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0xaa36a7',
            chainName: 'Sepolia',
            nativeCurrency: { name: 'Sepolia Ether', symbol: 'SEP', decimals: 18 },
            rpcUrls: [SEPOLIA_RPC_ENDPOINTS[0]],
            blockExplorerUrls: ['https://sepolia.etherscan.io']
          }
        ]
      });
      return true;
    }
    throw switchError;
  }
}

/**
 * Prepares and signs an EIP-4361 SIWE message.
 */
export async function performSiweLogin(address: string): Promise<SiweSessionState> {
  // 1. Request nonce from backend
  const nonceRes = await fetch(`${BASE_URL}/auth/nonce`);
  if (!nonceRes.ok) throw new Error('Failed to retrieve authentication nonce');
  const { nonce } = await nonceRes.json();

  const domain = window.location.host;
  const origin = window.location.origin;
  const statement = "Sign in to Schrödinger's Hamster to manage your quantum hybrid specimens and authorize immutable NFT minting.";
  const issuedAt = new Date().toISOString();

  // Standard EIP-4361 formatted message
  const message = [
    `${domain} wants you to sign in with your Ethereum account:`,
    address,
    '',
    statement,
    '',
    `URI: ${origin}`,
    `Version: 1`,
    `Chain ID: ${SEPOLIA_CHAIN_ID}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`
  ].join('\n');

  // 2. Request signature from wallet
  const walletClient = getWalletClient();
  const signature = await walletClient.signMessage({
    account: address as Address,
    message
  });

  // 3. Send signature and message to backend for atomic verification
  const guestPlayerId = typeof window !== 'undefined' ? (localStorage.getItem('squeek_player_id') || '') : '';
  const verifyRes = await fetch(`${BASE_URL}/auth/siwe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Player-ID': guestPlayerId
    },
    body: JSON.stringify({
      message,
      signature,
      address,
      nonce,
      playerId: guestPlayerId
    })
  });

  if (!verifyRes.ok) {
    const err = await verifyRes.json();
    throw new Error(err.error || 'SIWE verification failed');
  }

  const session = await verifyRes.json();
  // Store session token in sessionStorage (not long-lived localStorage)
  if (session.sessionToken) {
    sessionStorage.setItem('squeek_session_token', session.sessionToken);
  }
  // Sync client player ID with the linked session player ID
  if (session.playerId) {
    localStorage.setItem('squeek_player_id', session.playerId);
  }

  return {
    authenticated: true,
    address,
    playerId: session.playerId,
    sessionToken: session.sessionToken
  };
}

/**
 * Retrieves the current SIWE session from memory/sessionStorage.
 */
export async function checkSiweSession(): Promise<SiweSessionState> {
  const token = sessionStorage.getItem('squeek_session_token');
  if (!token) {
    return { authenticated: false, address: null, playerId: null, sessionToken: null };
  }

  try {
    const res = await fetch(`${BASE_URL}/auth/session`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      return {
        authenticated: true,
        address: data.address,
        playerId: data.playerId,
        sessionToken: token
      };
    }
  } catch (e) {
    console.warn('Session verification error:', e);
  }

  sessionStorage.removeItem('squeek_session_token');
  return { authenticated: false, address: null, playerId: null, sessionToken: null };
}

/**
 * Logout and clear session.
 */
export async function performLogout(): Promise<void> {
  const token = sessionStorage.getItem('squeek_session_token');
  if (token) {
    try {
      await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch {}
    sessionStorage.removeItem('squeek_session_token');
  }
}

/**
 * Initiates the Next-Squeek-Block Mint Gate for a given hybrid specimen.
 */
export async function initiateMintGate(specimenId: string): Promise<MintGateInfo> {
  const token = sessionStorage.getItem('squeek_session_token');
  if (!token) throw new Error('Please sign in with your Ethereum wallet first.');

  const res = await fetch(`${BASE_URL}/nft/initiate-mint`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ specimenId })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Failed to initiate mint gate');
  }

  return await res.json();
}

/**
 * Checks the current settlement status of a pending or unlocked mint gate.
 */
export async function checkMintGateStatus(specimenId: string): Promise<MintGateInfo> {
  const token = sessionStorage.getItem('squeek_session_token');
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}/nft/mint-status?specimenId=${encodeURIComponent(specimenId)}`, {
    headers
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Failed to check mint gate status');
  }

  return await res.json();
}

/**
 * Verifies and synchronizes onchain ERC-721 ownership of a minted specimen.
 */
export async function syncNftOwner(specimenId: string, tokenId?: number): Promise<{ owner: string; isCurrentOwner: boolean }> {
  const token = sessionStorage.getItem('squeek_session_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}/nft/sync-owner`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ specimenId, tokenId })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Failed to sync NFT owner');
  }

  return await res.json();
}

/**
 * Request server-side EIP-712 mint authorization for an eligible hybrid.
 */
export async function requestMintAuthorization(specimenId: string): Promise<MintAuthorizationPayload> {
  const token = sessionStorage.getItem('squeek_session_token');
  if (!token) throw new Error('Please sign in with your Ethereum wallet first.');

  const res = await fetch(`${BASE_URL}/nft/authorize-mint`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ specimenId })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Failed to authorize mint');
  }

  return await res.json();
}

/**
 * Submits the mint transaction to Ethereum Sepolia via connected wallet.
 */
export async function executeMintTransaction(auth: MintAuthorizationPayload): Promise<Hash> {
  const walletClient = getWalletClient();
  const contractAddr = (auth.contractAddress || DEFAULT_CONTRACT_ADDRESS) as Address;

  const hash = await walletClient.writeContract({
    address: contractAddr,
    abi: HAMSTER_NFT_ABI,
    functionName: 'mintWithAuthorization',
    args: [
      auth.recipient as Address,
      BigInt(auth.tokenId),
      auth.tokenURI,
      auth.metadataHash as `0x${string}`,
      auth.specimenHash as `0x${string}`,
      BigInt(auth.nonce),
      BigInt(auth.deadline),
      auth.signature as `0x${string}`
    ],
    chain: sepolia,
    account: auth.recipient as Address
  });

  return hash;
}

/**
 * Confirms confirmed mint transaction with the backend to update D1 and collection state.
 */
export async function confirmMintWithBackend(tokenId: number, txHash: string): Promise<any> {
  const token = sessionStorage.getItem('squeek_session_token');
  const res = await fetch(`${BASE_URL}/nft/confirm-mint`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : ''
    },
    body: JSON.stringify({ tokenId, txHash })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to confirm mint');
  }

  return await res.json();
}

/**
 * Queries onchain ownership directly from the contract.
 */
export async function fetchOnchainOwner(tokenId: number, contractAddress?: string): Promise<string | null> {
  try {
    const publicClient = getPublicClient();
    const addr = (contractAddress || DEFAULT_CONTRACT_ADDRESS) as Address;
    const owner = await publicClient.readContract({
      address: addr,
      abi: HAMSTER_NFT_ABI,
      functionName: 'ownerOf',
      args: [BigInt(tokenId)]
    });
    return (owner as string).toLowerCase();
  } catch (err) {
    return null;
  }
}
