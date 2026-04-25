export function Login({ onLogin, error }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 relative overflow-hidden">
      {/* Animated background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-[#1DB954] rounded-full mix-blend-screen filter blur-[128px] opacity-20 animate-pulse" style={{ animationDuration: '6s' }}></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-[#1ed760] rounded-full mix-blend-screen filter blur-[128px] opacity-20 animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-[128px] opacity-10 animate-pulse" style={{ animationDuration: '6s', animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md text-center space-y-8">
        {/* App Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-28 h-28 flex-shrink-0 bg-gradient-to-br from-[#1DB954] to-[#1aa34a] rounded-3xl flex items-center justify-center shadow-2xl shadow-[#1DB954]/50 transform transition-transform hover:scale-105">
              <svg
                className="w-24 h-24 flex-shrink-0 text-white"
                viewBox="0 0 24 24"
                fill="none"
              >
                {/* Spotify logo arcs */}
                <path d="M4 5C7.5 3.5 10.5 3.5 14 5C17.5 6.5 19.5 7.5 20 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M5.5 9C8.5 7.8 11.5 7.8 14.5 9C17.5 10.2 19 10.8 19.5 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M7 13C9.5 12 12 12 14.5 13C17 14 18 14.5 18.5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                {/* Question mark */}
                <path d="M10 19C10 18 10.5 17.5 11.2 17C11.9 16.6 12.2 16.3 12.2 15.5C12.2 14.8 11.7 14.3 11 14.3C10.3 14.3 9.8 14.8 9.8 15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="11" cy="21.5" r="0.8" fill="currentColor"/>
              </svg>
            </div>
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1DB954] to-[#1aa34a] rounded-3xl filter blur-2xl opacity-50 -z-10"></div>
          </div>
        </div>

        {/* Title and Description */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-black text-white leading-tight">
            Spotify Album<br />Guesser
          </h1>
          <p className="text-xl text-gray-400 max-w-md mx-auto leading-relaxed">
            Test your music knowledge! Guess albums from your liked songs as the cover gradually reveals itself.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl backdrop-blur-sm animate-fadeIn">
            <div className="flex items-center gap-3 justify-center text-red-400">
              <svg
                className="w-5 h-5 flex-shrink-0"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Login Button */}
        <div className="pt-4">
          <button
            onClick={onLogin}
            className="group relative w-full bg-gradient-to-r from-[#1DB954] to-[#1ed760] hover:from-[#1ed760] hover:to-[#1DB954] text-white font-bold py-5 px-8 rounded-full text-lg transition-all duration-300 flex items-center justify-center gap-3 shadow-2xl shadow-[#1DB954]/30 hover:shadow-[#1DB954]/50 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {/* Button glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#1DB954] to-[#1ed760] rounded-full filter blur-xl opacity-50 group-hover:opacity-75 transition-opacity -z-10"></div>

            <svg
              className="w-7 h-7 flex-shrink-0"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            <span>Login with Spotify</span>
          </button>
        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 text-gray-600 text-sm pt-2">
          <svg
            className="w-4 h-4 flex-shrink-0"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p>Secure OAuth 2.0 Authentication</p>
        </div>

      </div>

      {/* Credit */}
      <div className="absolute bottom-6 left-6 z-10">
        <p className="text-sm text-gray-600">
          Made by{' '}
          <a
            href="https://github.com/pmarch11"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-[#1DB954] transition-colors underline"
          >
            Patric Marchant
          </a>
        </p>
      </div>
    </div>
  );
}
