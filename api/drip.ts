import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ethers } from 'ethers';

const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
];

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Allow CORS from the dashboard
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { address } = req.body;

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return res.status(400).json({ error: 'Invalid address' });
  }

  const privateKey = process.env.DRIP_WALLET_PRIVATE_KEY;
  const rpcUrls = (
    process.env.DRIP_RPC_URL || 'https://sepolia.base.org'
  )
    .split(',')
    .concat('https://base-sepolia-rpc.publicnode.com');
  const usdcAddress =
    process.env.DRIP_USDC_CONTRACT ||
    '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
  const amount = parseInt(process.env.DRIP_AMOUNT || '50000', 10);

  if (!privateKey) {
    return res.status(503).json({ error: 'Drip not configured' });
  }

  // Try each RPC until one works (public endpoints are unreliable)
  let provider: ethers.JsonRpcProvider | null = null;
  let wallet: ethers.Wallet | null = null;
  let lastRpcError: string = '';

  for (const rpcUrl of rpcUrls) {
    try {
      const p = new ethers.JsonRpcProvider(rpcUrl.trim());
      const w = new ethers.Wallet(privateKey, p);
      // Quick connectivity check
      await p.getBlockNumber();
      provider = p;
      wallet = w;
      break;
    } catch (e) {
      lastRpcError = e instanceof Error ? e.message : String(e);
      continue;
    }
  }

  if (!provider || !wallet) {
    return res.status(503).json({ error: 'All RPCs failed: ' + lastRpcError });
  }

  try {
    const usdc = new ethers.Contract(usdcAddress, ERC20_ABI, wallet);

    // Check drip wallet balance first
    const balance = await usdc.balanceOf(wallet.address);
    if (balance < BigInt(amount)) {
      return res
        .status(503)
        .json({ error: 'Drip wallet depleted. Try again later.' });
    }

    const tx = await usdc.transfer(address, amount);
    const receipt = await tx.wait();

    return res.status(200).json({
      ok: true,
      tx_hash: receipt.hash,
      amount: amount,
      message: `Sent ${amount / 1_000_000} test USDC to ${address}`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Drip error:', message);
    return res.status(500).json({ error: 'Drip failed: ' + message });
  }
}
