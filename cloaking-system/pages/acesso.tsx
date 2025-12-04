import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { BrowserFingerprint, FingerprintData } from '../lib/fingerprint';

export default function VerificationPage() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing verification...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const runVerification = async () => {
      try {
        setStatus('Analyzing browser environment...');
        setProgress(15);

        await new Promise(resolve => setTimeout(resolve, 800));

        setStatus('Collecting security data...');
        setProgress(35);

        const fingerprinter = new BrowserFingerprint();

        await new Promise(resolve => setTimeout(resolve, 1200));

        setStatus('Generating fingerprint...');
        setProgress(55);

        await new Promise(resolve => setTimeout(resolve, 800));

        const fingerprintData: FingerprintData = await fingerprinter.collect();

        setStatus('Validating access...');
        setProgress(75);

        const response = await fetch('/api/validate-access', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(fingerprintData),
          credentials: 'include',
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setStatus('Verification complete');
          setProgress(100);

          await new Promise(resolve => setTimeout(resolve, 500));

          window.location.href = '/resgate';
        } else {
          setError(data.message || 'Verification failed');
          setProgress(0);

          await new Promise(resolve => setTimeout(resolve, 2000));
          router.push('/');
        }
      } catch (err) {
        console.error('Verification error:', err);
        setError('An error occurred during verification');
        setProgress(0);

        await new Promise(resolve => setTimeout(resolve, 2000));
        router.push('/');
      }
    };

    runVerification();
  }, [router]);

  return (
    <>
      <Head>
        <title>Verification in Progress</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 px-4">
        <div className="max-w-lg w-full">
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-700 shadow-2xl p-8 space-y-8">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full"></div>
                  <div className="relative">
                    <svg
                      className="w-16 h-16 text-blue-500 animate-spin-slow"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <h1 className="text-2xl font-bold text-white">
                Security Check
              </h1>

              <p className={`text-sm ${error ? 'text-red-400' : 'text-gray-400'}`}>
                {error || status}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>

              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-4">
              {[
                { label: 'Browser', icon: '🌐' },
                { label: 'Device', icon: '📱' },
                { label: 'Network', icon: '🔒' },
              ].map((item, index) => (
                <div
                  key={item.label}
                  className={`bg-gray-800/50 rounded-lg p-3 text-center transition-all duration-300 ${
                    progress > (index + 1) * 25 ? 'border border-green-500/50' : 'border border-gray-700'
                  }`}
                >
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <div className="text-xs text-gray-500">{item.label}</div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center space-x-2 text-xs text-gray-600 pt-2">
              <svg
                className="w-3 h-3 animate-pulse"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Do not close this window</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
