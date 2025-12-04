import Head from 'next/head';
import { useState } from 'react';

export default function ProtectedPage() {
  const [showContent, setShowContent] = useState(false);

  return (
    <>
      <Head>
        <title>Seu Conteúdo Protegido</title>
        <meta name="description" content="Área protegida" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <header className="border-b border-gray-800 bg-black/50 backdrop-blur-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Conteúdo Protegido</h1>
                  <p className="text-xs text-gray-400">Acesso verificado com sucesso</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-400">Sessão ativa</span>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <svg
                    className="w-8 h-8 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Bem-vindo à Área Protegida
                  </h2>
                  <p className="text-gray-400">
                    Você passou com sucesso pelo sistema de verificação. Este é o conteúdo
                    protegido que só usuários verificados podem acessar.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-xl border border-gray-700 p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white">Segurança Avançada</h3>
                </div>
                <p className="text-sm text-gray-400">
                  Seu acesso foi validado através de múltiplas camadas de verificação,
                  garantindo que apenas usuários reais acessem este conteúdo.
                </p>
              </div>

              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-xl border border-gray-700 p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-purple-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white">Acesso Rápido</h3>
                </div>
                <p className="text-sm text-gray-400">
                  Sua sessão está ativa e você pode navegar livremente por todo o
                  conteúdo protegido durante as próximas 24 horas.
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-xl border border-gray-700 p-8">
              <h3 className="text-xl font-bold text-white mb-4">Seu Conteúdo</h3>

              {!showContent ? (
                <div className="text-center py-12">
                  <button
                    onClick={() => setShowContent(true)}
                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Revelar Conteúdo
                  </button>
                </div>
              ) : (
                <div className="prose prose-invert max-w-none">
                  <div className="space-y-4 text-gray-300">
                    <p className="text-lg leading-relaxed">
                      Este é o seu conteúdo protegido. Aqui você pode adicionar qualquer
                      informação, produto, serviço ou material que deseja manter acessível
                      apenas para usuários verificados.
                    </p>

                    <div className="grid sm:grid-cols-3 gap-4 py-6">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
                        >
                          <div className="aspect-video bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg mb-3" />
                          <h4 className="font-semibold text-white mb-1">
                            Conteúdo {i}
                          </h4>
                          <p className="text-sm text-gray-400">
                            Descrição do conteúdo protegido número {i}.
                          </p>
                        </div>
                      ))}
                    </div>

                    <p>
                      Você pode personalizar completamente esta página com seu conteúdo
                      real: vídeos, imagens, textos, produtos, links de download, ou
                      qualquer outro material que precise de proteção.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        <footer className="border-t border-gray-800 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <div className="text-sm text-gray-500">
                Sessão válida por 24 horas a partir da verificação
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Protected by advanced verification</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
