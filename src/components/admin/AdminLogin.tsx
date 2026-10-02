import React, { useState } from 'react';
import { adminLogin } from '../../utils/adminService';
import { resolveAssetUrl } from '../../game/AssetManager';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onBackToGame: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  onBackToGame,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const ok = await adminLogin(username, password);
      if (ok) {
        onLoginSuccess();
      } else {
        setError('Usuario o contraseña incorrectos. Verifica tus credenciales.');
      }
    } catch {
      setError('Error al procesar la autenticación. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-stone-950 text-stone-100 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/20 via-stone-950 to-stone-950 pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-md bg-stone-900/90 border border-amber-800/40 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative z-10 flex flex-col items-center">
        {/* Logo / Header */}
        <img
          src={resolveAssetUrl('assets/sprites/logo.png')}
          alt="Fox Thief Logo"
          className="h-20 object-contain drop-shadow mb-2"
        />

        <div className="text-center mb-6">
          <h1 className="font-game text-2xl sm:text-3xl text-yellow-400 font-extrabold tracking-wider">
            PANEL ADMINISTRATIVO
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Fox Thief — Sistema de Gestión y Analítica Global
          </p>
        </div>

        {error && (
          <div className="w-full mb-4 p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs font-medium flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-amber-200/90 mb-1.5">
              USUARIO
            </label>
            <input
              type="text"
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingresa tu usuario"
              className="w-full px-4 py-2.5 rounded-xl bg-stone-950/90 border border-stone-700 text-white placeholder:text-stone-600 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-amber-200/90 mb-1.5">
              CONTRASEÑA
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-stone-950/90 border border-stone-700 text-white placeholder:text-stone-600 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-sm transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-stone-950 font-game font-bold text-base tracking-wide shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span>AUTENTICANDO...</span>
            ) : (
              <>
                <span>🔐</span>
                <span>INICIAR SESIÓN</span>
              </>
            )}
          </button>
        </form>

        <div className="w-full mt-6 pt-4 border-t border-stone-800 flex items-center justify-between text-xs text-stone-500">
          <button
            type="button"
            onClick={onBackToGame}
            className="text-amber-400/80 hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>◀</span>
            <span>Volver al juego público</span>
          </button>
          <span>v2.0 • Admin Seguro</span>
        </div>
      </div>
    </div>
  );
};
