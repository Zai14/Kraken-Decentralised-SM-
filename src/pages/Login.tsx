import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet as WalletIcon, Loader2, Anchor } from 'lucide-react';
import { BrowserProvider } from 'ethers';
import { supabase } from '../lib/supabase';

export function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const connectMetamask = async () => {
    setError('');
    setLoading(true);

    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }

      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      
      if (accounts[0]) {
        const address = accounts[0].toLowerCase();
        
        try {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: `${address}@kraken.web3`,
            password: address,
          });

          if (signInError) {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email: `${address}@kraken.web3`,
              password: address,
              options: {
                data: {
                  wallet_address: address,
                }
              }
            });

            if (signUpError) throw signUpError;
          }

          localStorage.setItem('walletAddress', address);
          navigate('/');
        } catch (authError: any) {
          console.error('Auth error:', authError);
          throw new Error(authError.message || 'Failed to authenticate');
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Anchor className="w-12 h-12 text-zinc-100" />
          </div>
          <h1 className="text-5xl font-bold text-zinc-100 mb-2">Kraken</h1>
          <p className="text-zinc-400 mb-2">Secure Decentralized Messaging</p>
          <p className="text-sm text-zinc-500">Web3-Powered Communication</p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/50 text-red-500 rounded-lg p-3">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={connectMetamask}
            disabled={loading}
            className="w-full bg-zinc-800 text-zinc-100 py-3 px-4 rounded-lg hover:bg-zinc-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <WalletIcon className="w-5 h-5" />
                <span>Connect with MetaMask</span>
              </>
            )}
          </button>
        </div>

        <div className="text-center space-y-4">
          <p className="text-sm text-zinc-500">
            By connecting your wallet, you agree to our Terms of Service and Privacy Policy
          </p>
          <p className="text-sm text-zinc-500">
            Created By Za.i.14
          </p>
          <div className="flex justify-center space-x-4">
            <a href="#" className="text-zinc-400 hover:text-zinc-100 text-sm">Terms of Service</a>
            <a href="#" className="text-zinc-400 hover:text-zinc-100 text-sm">Privacy Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
}