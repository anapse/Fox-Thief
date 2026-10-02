import React, { useState } from 'react';
import { sounds } from '../../audio/soundManager';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const OFFICIAL_EMAIL = 'anapse_video@hotmail.com';

  const handleCopy = () => {
    navigator.clipboard.writeText(OFFICIAL_EMAIL);
    sounds.playCoin();
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    sounds.playCoin();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setMessage('');
      onClose();
    }, 1800);
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-sm wood-board rounded-3xl p-5 flex flex-col items-center border-4 border-amber-950 shadow-2xl relative">
        {/* Header Ribbon */}
        <div className="px-6 py-1.5 rounded-2xl bg-gradient-to-b from-amber-500 to-amber-700 border-3 border-amber-950 shadow-lg -mt-3 mb-4">
          <h2 className="font-game text-2xl text-yellow-100 tracking-wider font-extrabold drop-shadow">
            CONTÁCTANOS
          </h2>
        </div>

        {/* Official Email Display Card */}
        <div className="w-full bg-gradient-to-b from-amber-900 to-amber-950 border-2 border-yellow-500/80 rounded-2xl p-3.5 mb-3 shadow-lg flex flex-col items-center text-center">
          <span className="text-xs text-amber-300 font-bold uppercase tracking-wider">
            Correo Oficial de Soporte
          </span>
          <span className="font-game text-base sm:text-lg text-yellow-200 mt-1 select-all break-all">
            {OFFICIAL_EMAIL}
          </span>

          <button
            type="button"
            onClick={handleCopy}
            className="btn-yellow px-4 py-1.5 rounded-xl font-game text-xs text-amber-950 mt-2 shadow flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <span>{copied ? '✅' : '📋'}</span>
            <span>{copied ? '¡CORREO COPIADO!' : 'COPIAR CORREO'}</span>
          </button>
        </div>

        {submitted ? (
          <div className="bg-amber-100 rounded-2xl p-5 text-center border-2 border-amber-800 my-2 shadow-inner w-full">
            <span className="text-3xl">📬✨</span>
            <h3 className="font-game text-base text-amber-950 font-bold mt-1">
              ¡Mensaje Recibido!
            </h3>
            <p className="text-xs text-amber-900 mt-0.5">
              Gracias por contactarnos.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-2.5">
            <div>
              <label className="block font-game text-xs text-amber-200 mb-1">
                Escríbenos tu mensaje o sugerencia:
              </label>
              <textarea
                required
                rows={3}
                placeholder="Escribe aquí tus dudas o sugerencias..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-amber-100 border-2 border-amber-900 text-amber-950 font-game text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none shadow-inner"
              />
            </div>

            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onClose();
                }}
                className="btn-wood flex-1 py-2.5 rounded-2xl font-game text-sm text-white shadow-md active:scale-95 transition-all"
              >
                CERRAR
              </button>
              <button
                type="submit"
                className="btn-green flex-1 py-2.5 rounded-2xl font-game text-sm text-white shadow-md active:scale-95 transition-all"
              >
                ENVIAR
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
