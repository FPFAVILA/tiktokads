import Head from 'next/head';

export default function BlockedPage() {
  return (
    <>
      <Head>
        <title>Access Restricted</title>
        <meta name="description" content="This content is not publicly available" />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 px-4">
        <div className="max-w-md w-full">
          <div className="text-center space-y-8">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full animate-pulse-slow"></div>
                <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-full border border-gray-700 shadow-2xl">
                  <svg
                    className="w-20 h-20 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl font-bold text-white tracking-tight">
                Access Restricted
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed">
                This content is not publicly available
              </p>
            </div>

            <div className="pt-6 border-t border-gray-800">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <svg
                  className="w-4 h-4"
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
                <span>Protected Resource</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
