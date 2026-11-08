import { network } from 'hardhat';
import { parseEther, keccak256, toHex, encodePacked, encodeAbiParameters, parseAbiParameters } from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import assert from 'assert';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('--- RUNNING SCHRODINGER\'S HAMSTER NFT CONTRACT TEST SUITE ---');

  const artifactPath = path.resolve(__dirname, '..', 'artifacts', 'contracts', 'SchrodingersHamsterNFT.sol', 'SchrodingersHamsterNFT.json');
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

  const connection = await network.connect();
  const provider = connection.provider;

  async function rpc(method, params = []) {
    return await provider.request({ method, params });
  }

  // Pre-configured unlocked accounts from hardhat
  const accounts = await rpc('eth_accounts');
  const ownerAddress = accounts[0];
  const aliceAddress = accounts[1];
  const bobAddress = accounts[2];

  // Dedicated server authorizer private key (and an attacker key)
  const authorizerPriv = generatePrivateKey();
  const attackerPriv = generatePrivateKey();

  const authorizer = privateKeyToAccount(authorizerPriv);
  const attacker = privateKeyToAccount(attackerPriv);

  console.log('Deployer / Owner:', ownerAddress);
  console.log('Server Authorizer:', authorizer.address);
  console.log('Alice (Player):', aliceAddress);
  console.log('Bob (Recipient):', bobAddress);

  const localChainId = Number(BigInt(await rpc('eth_chainId')));
  console.log('Local EVM Chain ID:', localChainId);

  // Deploy contract
  console.log('\n1. Deploying SchrodingersHamsterNFT...');
  
  const encodedArgs = encodeAbiParameters(
    parseAbiParameters('address initialOwner, address initialAuthorizer'),
    [ownerAddress, authorizer.address]
  ).slice(2);

  const deployData = artifact.bytecode + encodedArgs;

  const deployTxHash = await rpc('eth_sendTransaction', [{
    from: ownerAddress,
    data: deployData,
    gas: '0x1000000'
  }]);

  const deployReceipt = await rpc('eth_getTransactionReceipt', [deployTxHash]);
  const contractAddress = deployReceipt.contractAddress;
  console.log('Deployed at:', contractAddress);

  // EIP-712 Domain and Types
  const domain = {
    name: 'Schrodingers Hamster',
    version: '1.0.0',
    chainId: localChainId,
    verifyingContract: contractAddress
  };

  const types = {
    MintAuthorization: [
      { name: 'recipient', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'tokenURI', type: 'string' },
      { name: 'metadataHash', type: 'bytes32' },
      { name: 'specimenHash', type: 'bytes32' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' }
    ]
  };

  async function signMintAuth(signer, values, customDomain = domain) {
    return await signer.signTypedData({
      domain: customDomain,
      types,
      primaryType: 'MintAuthorization',
      message: values
    });
  }

  const contractAbi = artifact.abi;
  const specimen1Hash = keccak256(toHex('specimen-uuid-monopeep-101'));
  const metadata1Hash = keccak256(toHex('{"name":"Monopeep","rarity":"rare"}'));
  const uri1 = 'ipfs://bafybeimonopeep123456789/metadata.json';
  const deadlineFuture = BigInt(Math.floor(Date.now() / 1000) + 3600);

  const mintSelector = keccak256(toHex('mintWithAuthorization(address,uint256,string,bytes32,bytes32,uint256,uint256,bytes)')).slice(0, 10);

  // Test 1: Authorized mint succeeds
  console.log('\n--- Test 1: Authorized Mint Succeeds ---');
  const auth1 = {
    recipient: aliceAddress,
    tokenId: 1n,
    tokenURI: uri1,
    metadataHash: metadata1Hash,
    specimenHash: specimen1Hash,
    nonce: 1001n,
    deadline: deadlineFuture
  };

  const sig1 = await signMintAuth(authorizer, auth1);

  const mintCalldata = encodeAbiParameters(
    parseAbiParameters('address,uint256,string,bytes32,bytes32,uint256,uint256,bytes'),
    [auth1.recipient, auth1.tokenId, auth1.tokenURI, auth1.metadataHash, auth1.specimenHash, auth1.nonce, auth1.deadline, sig1]
  );

  const tx1Hash = await rpc('eth_sendTransaction', [{
    from: aliceAddress,
    to: contractAddress,
    data: mintSelector + mintCalldata.slice(2),
    gas: '0x200000'
  }]);

  const tx1Receipt = await rpc('eth_getTransactionReceipt', [tx1Hash]);
  assert.strictEqual(tx1Receipt.status, '0x1', 'Mint tx must succeed');
  console.log('✓ Authorized mint succeeded with status 1');

  // Verify ownerOf(1) == aliceAddress
  const ownerOfSelector = keccak256(toHex('ownerOf(uint256)')).slice(0, 10);
  const ownerOfCallData = ownerOfSelector + encodeAbiParameters(parseAbiParameters('uint256'), [1n]).slice(2);
  const ownerOfResult = await rpc('eth_call', [{
    to: contractAddress,
    data: ownerOfCallData
  }]);
  const decodedOwner = '0x' + ownerOfResult.slice(26);
  assert.strictEqual(decodedOwner.toLowerCase(), aliceAddress.toLowerCase(), 'Alice must be ownerOf(1)');
  console.log('✓ Verified ownerOf(1) == Alice:', decodedOwner);

  // Verify tokenURI(1) == uri1
  const tokenUriSelector = keccak256(toHex('tokenURI(uint256)')).slice(0, 10);
  const tokenUriCallData = tokenUriSelector + encodeAbiParameters(parseAbiParameters('uint256'), [1n]).slice(2);
  const tokenUriResult = await rpc('eth_call', [{
    to: contractAddress,
    data: tokenUriCallData
  }]);
  const lenHex = tokenUriResult.slice(66, 130);
  const strLen = parseInt(lenHex, 16);
  const strBytes = Buffer.from(tokenUriResult.slice(130, 130 + strLen * 2), 'hex').toString('utf8');
  assert.strictEqual(strBytes, uri1, 'tokenURI must match immutable uri1');
  console.log('✓ Verified immutable tokenURI(1):', strBytes);

  // Test 2: Unauthorized mint fails (attacker signature)
  console.log('\n--- Test 2: Unauthorized Mint Fails ---');
  const auth2 = {
    recipient: aliceAddress,
    tokenId: 2n,
    tokenURI: 'ipfs://bafyfake',
    metadataHash: metadata1Hash,
    specimenHash: keccak256(toHex('specimen-fake')),
    nonce: 1002n,
    deadline: deadlineFuture
  };
  const fakeSig = await signMintAuth(attacker, auth2);
  const fakeCalldata = mintSelector + encodeAbiParameters(
    parseAbiParameters('address,uint256,string,bytes32,bytes32,uint256,uint256,bytes'),
    [auth2.recipient, auth2.tokenId, auth2.tokenURI, auth2.metadataHash, auth2.specimenHash, auth2.nonce, auth2.deadline, fakeSig]
  ).slice(2);

  let failedUnauthorized = false;
  try {
    await rpc('eth_call', [{
      from: aliceAddress,
      to: contractAddress,
      data: fakeCalldata
    }]);
  } catch (e) {
    failedUnauthorized = true;
  }
  assert.ok(failedUnauthorized, 'Mint with unauthorized signer must revert');
  console.log('✓ Unauthorized mint properly reverted');

  // Test 3: Duplicate specimen mint fails
  console.log('\n--- Test 3: Duplicate Specimen Mint Fails ---');
  const auth3Duplicate = {
    recipient: bobAddress,
    tokenId: 3n,
    tokenURI: 'ipfs://bafyduplicate',
    metadataHash: metadata1Hash,
    specimenHash: specimen1Hash, // Reusing specimen 1!
    nonce: 1003n,
    deadline: deadlineFuture
  };
  const sig3 = await signMintAuth(authorizer, auth3Duplicate);
  const dupCalldata = mintSelector + encodeAbiParameters(
    parseAbiParameters('address,uint256,string,bytes32,bytes32,uint256,uint256,bytes'),
    [auth3Duplicate.recipient, auth3Duplicate.tokenId, auth3Duplicate.tokenURI, auth3Duplicate.metadataHash, auth3Duplicate.specimenHash, auth3Duplicate.nonce, auth3Duplicate.deadline, sig3]
  ).slice(2);

  let failedDuplicate = false;
  try {
    await rpc('eth_call', [{
      to: contractAddress,
      data: dupCalldata
    }]);
  } catch (e) {
    failedDuplicate = true;
  }
  assert.ok(failedDuplicate, 'Mint with duplicate specimen must revert');
  console.log('✓ Duplicate specimen mint properly reverted');

  // Test 4: Reused authorization nonce fails
  console.log('\n--- Test 4: Reused Authorization Nonce Fails ---');
  const auth4ReusedNonce = {
    recipient: bobAddress,
    tokenId: 4n,
    tokenURI: 'ipfs://bafynew',
    metadataHash: metadata1Hash,
    specimenHash: keccak256(toHex('specimen-new')),
    nonce: 1001n, // Reusing nonce 1001
    deadline: deadlineFuture
  };
  const sig4 = await signMintAuth(authorizer, auth4ReusedNonce);
  const nonceCalldata = mintSelector + encodeAbiParameters(
    parseAbiParameters('address,uint256,string,bytes32,bytes32,uint256,uint256,bytes'),
    [auth4ReusedNonce.recipient, auth4ReusedNonce.tokenId, auth4ReusedNonce.tokenURI, auth4ReusedNonce.metadataHash, auth4ReusedNonce.specimenHash, auth4ReusedNonce.nonce, auth4ReusedNonce.deadline, sig4]
  ).slice(2);

  let failedReusedNonce = false;
  try {
    await rpc('eth_call', [{
      to: contractAddress,
      data: nonceCalldata
    }]);
  } catch (e) {
    failedReusedNonce = true;
  }
  assert.ok(failedReusedNonce, 'Mint with reused nonce must revert');
  console.log('✓ Reused nonce properly reverted');

  // Test 5: Expired authorization fails
  console.log('\n--- Test 5: Expired Authorization Fails ---');
  const auth5Expired = {
    recipient: aliceAddress,
    tokenId: 5n,
    tokenURI: 'ipfs://bafyexpired',
    metadataHash: metadata1Hash,
    specimenHash: keccak256(toHex('specimen-expired')),
    nonce: 1005n,
    deadline: 1000n
  };
  const sig5 = await signMintAuth(authorizer, auth5Expired);
  const expiredCalldata = mintSelector + encodeAbiParameters(
    parseAbiParameters('address,uint256,string,bytes32,bytes32,uint256,uint256,bytes'),
    [auth5Expired.recipient, auth5Expired.tokenId, auth5Expired.tokenURI, auth5Expired.metadataHash, auth5Expired.specimenHash, auth5Expired.nonce, auth5Expired.deadline, sig5]
  ).slice(2);

  let failedExpired = false;
  try {
    await rpc('eth_call', [{
      to: contractAddress,
      data: expiredCalldata
    }]);
  } catch (e) {
    failedExpired = true;
  }
  assert.ok(failedExpired, 'Expired authorization must revert');
  console.log('✓ Expired authorization properly reverted');

  // Test 6: Wrong Chain ID fails
  console.log('\n--- Test 6: Cross-Chain Replay Protection Fails ---');
  const auth6CrossChain = {
    recipient: aliceAddress,
    tokenId: 6n,
    tokenURI: 'ipfs://bafycrosschain',
    metadataHash: metadata1Hash,
    specimenHash: keccak256(toHex('specimen-crosschain')),
    nonce: 1006n,
    deadline: deadlineFuture
  };
  // Sign for Sepolia chain ID 11155111 while contract is on localChainId
  const wrongChainDomain = { ...domain, chainId: 11155111 };
  const sigWrongChain = await signMintAuth(authorizer, auth6CrossChain, wrongChainDomain);
  const wrongChainCalldata = mintSelector + encodeAbiParameters(
    parseAbiParameters('address,uint256,string,bytes32,bytes32,uint256,uint256,bytes'),
    [auth6CrossChain.recipient, auth6CrossChain.tokenId, auth6CrossChain.tokenURI, auth6CrossChain.metadataHash, auth6CrossChain.specimenHash, auth6CrossChain.nonce, auth6CrossChain.deadline, sigWrongChain]
  ).slice(2);

  let failedWrongChain = false;
  try {
    await rpc('eth_call', [{
      to: contractAddress,
      data: wrongChainCalldata
    }]);
  } catch (e) {
    failedWrongChain = true;
  }
  assert.ok(failedWrongChain, 'Cross-chain authorization replay must revert');
  console.log('✓ Cross-chain signature properly reverted');

  // Test 7: Tampered metadata fails
  console.log('\n--- Test 7: Tampered Metadata Fails ---');
  const auth7 = {
    recipient: aliceAddress,
    tokenId: 7n,
    tokenURI: 'ipfs://bafyoriginal',
    metadataHash: metadata1Hash,
    specimenHash: keccak256(toHex('specimen-tamper')),
    nonce: 1007n,
    deadline: deadlineFuture
  };
  const sig7 = await signMintAuth(authorizer, auth7);
  const tamperedCalldata = mintSelector + encodeAbiParameters(
    parseAbiParameters('address,uint256,string,bytes32,bytes32,uint256,uint256,bytes'),
    [auth7.recipient, auth7.tokenId, auth7.tokenURI, keccak256(toHex('tampered-metadata')), auth7.specimenHash, auth7.nonce, auth7.deadline, sig7]
  ).slice(2);

  let failedTampered = false;
  try {
    await rpc('eth_call', [{
      to: contractAddress,
      data: tamperedCalldata
    }]);
  } catch (e) {
    failedTampered = true;
  }
  assert.ok(failedTampered, 'Tampered metadata must revert');
  console.log('✓ Tampered metadata authorization properly reverted');

  // Test 8: Standard ERC-721 token transfer works (Alice transfers token 1 to Bob)
  console.log('\n--- Test 8: ERC-721 Token Transfer & Ownership Verification ---');
  const transferSelector = keccak256(toHex('safeTransferFrom(address,address,uint256)')).slice(0, 10);
  const transferCalldata = transferSelector + encodeAbiParameters(
    parseAbiParameters('address,address,uint256'),
    [aliceAddress, bobAddress, 1n]
  ).slice(2);

  const transferTxHash = await rpc('eth_sendTransaction', [{
    from: aliceAddress,
    to: contractAddress,
    data: transferCalldata,
    gas: '0x100000'
  }]);
  const transferReceipt = await rpc('eth_getTransactionReceipt', [transferTxHash]);
  assert.strictEqual(transferReceipt.status, '0x1', 'Transfer must succeed');
  console.log('✓ Token #1 transferred from Alice to Bob');

  // Check new owner is Bob
  const newOwnerResult = await rpc('eth_call', [{
    to: contractAddress,
    data: ownerOfCallData
  }]);
  const decodedNewOwner = '0x' + newOwnerResult.slice(26);
  assert.strictEqual(decodedNewOwner.toLowerCase(), bobAddress.toLowerCase(), 'Bob must now be ownerOf(1)');
  console.log('✓ Verified new ownerOf(1) == Bob:', decodedNewOwner);

  // Former owner (Alice) can no longer transfer
  let aliceCannotTransfer = false;
  try {
    await rpc('eth_call', [{
      from: aliceAddress,
      to: contractAddress,
      data: transferCalldata
    }]);
  } catch (e) {
    aliceCannotTransfer = true;
  }
  assert.ok(aliceCannotTransfer, 'Former owner Alice cannot transfer token 1');
  console.log('✓ Verified former owner Alice lost transfer permissions');

  // Test 9: Immutability Guarantee Check
  console.log('\n--- Test 9: Immutability Guarantee Check ---');
  const postTransferUriResult = await rpc('eth_call', [{
    to: contractAddress,
    data: tokenUriCallData
  }]);
  const postStrLen = parseInt(postTransferUriResult.slice(66, 130), 16);
  const postUri = Buffer.from(postTransferUriResult.slice(130, 130 + postStrLen * 2), 'hex').toString('utf8');
  assert.strictEqual(postUri, uri1, 'tokenURI must remain permanently identical');
  console.log('✓ tokenURI unchanged after transfer:', postUri);

  const mutableFunctions = contractAbi.filter(fn => 
    fn.type === 'function' && 
    (fn.name.toLowerCase().includes('settree') || 
     fn.name.toLowerCase().includes('settokenuri') || 
     fn.name.toLowerCase().includes('setbaseuri') ||
     fn.name.toLowerCase().includes('updatemetadata') ||
     fn.name.toLowerCase().includes('editmetadata'))
  );
  assert.strictEqual(mutableFunctions.length, 0, 'No mutable metadata setters allowed in contract');
  console.log('✓ Contract ABI verified: 0 mutable metadata functions exist');

  console.log('\n======================================================');
  console.log('ALL 9 SMART CONTRACT & IMMUTABILITY TESTS PASSED 100%!');
  console.log('======================================================\n');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
