const fs = require('fs');
const path = require('path');
const solc = require('solc');

function findImports(importPath) {
  let resolvedPath = '';
  if (importPath.startsWith('@openzeppelin/')) {
    resolvedPath = path.resolve(__dirname, '..', 'node_modules', importPath);
  } else {
    resolvedPath = path.resolve(__dirname, '..', 'contracts', importPath);
  }

  if (fs.existsSync(resolvedPath)) {
    return { contents: fs.readFileSync(resolvedPath, 'utf8') };
  } else {
    return { error: `File not found: ${resolvedPath}` };
  }
}

function compileContract() {
  const contractPath = path.resolve(__dirname, '..', 'contracts', 'SchrodingersHamsterNFT.sol');
  const source = fs.readFileSync(contractPath, 'utf8');

  const input = {
    language: 'Solidity',
    sources: {
      'SchrodingersHamsterNFT.sol': {
        content: source
      }
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode']
        }
      }
    }
  };

  console.log('Compiling SchrodingersHamsterNFT.sol with solc...');
  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

  if (output.errors) {
    let hasError = false;
    for (const error of output.errors) {
      if (error.severity === 'error') {
        hasError = true;
        console.error('Compiler Error:', error.formattedMessage);
      } else {
        console.warn('Compiler Warning:', error.formattedMessage);
      }
    }
    if (hasError) {
      throw new Error('Compilation failed with errors.');
    }
  }

  const contract = output.contracts['SchrodingersHamsterNFT.sol']['SchrodingersHamsterNFT'];
  const artifactsDir = path.resolve(__dirname, '..', 'contracts', 'artifacts');
  fs.mkdirSync(artifactsDir, { recursive: true });

  const artifact = {
    contractName: 'SchrodingersHamsterNFT',
    abi: contract.abi,
    bytecode: '0x' + contract.evm.bytecode.object,
    deployedBytecode: '0x' + contract.evm.deployedBytecode.object
  };

  fs.writeFileSync(
    path.join(artifactsDir, 'SchrodingersHamsterNFT.json'),
    JSON.stringify(artifact, null, 2)
  );

  console.log('Successfully compiled SchrodingersHamsterNFT!');
  console.log('Bytecode size:', Math.round(contract.evm.bytecode.object.length / 2), 'bytes');
  console.log('Artifact saved to contracts/artifacts/SchrodingersHamsterNFT.json');

  return artifact;
}

if (require.main === module) {
  compileContract();
}

module.exports = { compileContract };
