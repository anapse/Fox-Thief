import React, { useState } from 'react';
import { sounds } from '../../audio/soundManager';
import { resolveAssetUrl } from '../../game/AssetManager';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [currentStep, setCurrentStep] = useState<number>(0);

  const steps = [
    {
      step: 1,
      title: 'Las gallinas producen huevos',
      description: 'Tus gallinas en los 3 niveles del gallinero ponen huevos automáticamente de forma periódica.',
      visual: (
        <div className="relative w-full h-32 bg-amber-950/40 rounded-2xl border-2 border-amber-800/80 flex items-center justify-around p-2 overflow-hidden">
          <div className="flex flex-col items-center animate-bounce-subtle">
            <img src={resolveAssetUrl('assets/sprites/Gallina en el nido.png')} alt="Gallina" className="h-16 object-contain drop-shadow" />
            <span className="text-xs font-game text-yellow-300">Poniendo...</span>
          </div>
          <div className="text-2xl animate-pulse">✨</div>
          <div className="flex flex-col items-center">
            <img src={resolveAssetUrl('assets/sprites/Huevo individual.png')} alt="Huevo" className="h-10 object-contain drop-shadow" />
            <span className="text-[10px] font-game text-amber-200">¡Huevo Listo!</span>
          </div>
        </div>
      ),
    },
    {
      step: 2,
      title: 'El huevo rueda al nido del suelo',
      description: 'El huevo desciende por la rampa de madera hasta el nido central de recolección en el patio.',
      visual: (
        <div className="relative w-full h-32 bg-amber-950/40 rounded-2xl border-2 border-amber-800/80 flex items-center justify-center p-2 overflow-hidden gap-4">
          <div className="text-2xl">🪵 ➔ 🥚 ➔ 🌾</div>
          <div className="flex flex-col items-center">
            <img src={resolveAssetUrl('assets/sprites/Huevo individual.png')} alt="Huevo" className="h-12 object-contain animate-bounce drop-shadow" />
            <span className="text-xs font-game text-yellow-300">Nido del Suelo</span>
          </div>
        </div>
      ),
    },
    {
      step: 3,
      title: 'Arrastra el huevo a la cesta',
      description: 'Toca con tu dedo o ratón el huevo del nido y arrástralo directamente hacia la gran cesta de mimbre.',
      visual: (
        <div className="relative w-full h-32 bg-amber-950/40 rounded-2xl border-2 border-amber-800/80 flex items-center justify-around p-2 overflow-hidden">
          <div className="flex flex-col items-center">
            <img src={resolveAssetUrl('assets/sprites/Huevo individual.png')} alt="Huevo" className="h-10 object-contain" />
            <span className="text-2xl">👆</span>
          </div>
          <div className="text-2xl text-yellow-400 font-bold animate-pulse">════►</div>
          <div className="flex flex-col items-center">
            <img src={resolveAssetUrl('assets/sprites/Cesta.png')} alt="Cesta" className="h-16 object-contain drop-shadow" />
          </div>
        </div>
      ),
    },
    {
      step: 4,
      title: 'Llena la cesta y genera monedas',
      description: 'Reúne 10 huevos en la cesta para venderla automáticamente: ganas +10 monedas y recuperas +0.5 corazón de vida.',
      visual: (
        <div className="relative w-full h-32 bg-amber-950/40 rounded-2xl border-2 border-amber-800/80 flex items-center justify-around p-2 overflow-hidden">
          <div className="flex flex-col items-center">
            <img src={resolveAssetUrl('assets/sprites/Cesta.png')} alt="Cesta Llena" className="h-14 object-contain" />
            <span className="text-xs font-game text-yellow-300">🥚 10 / 10</span>
          </div>
          <div className="text-xl">💰 +10</div>
          <div className="flex flex-col items-center bg-emerald-950/60 p-2 rounded-xl border border-emerald-500">
            <span className="text-2xl">🪙 ❤️+½</span>
            <span className="text-[10px] font-game text-emerald-300">¡Venta Exitosa!</span>
          </div>
        </div>
      ),
    },
    {
      step: 5,
      title: 'El zorro aparece por la derecha',
      description: '¡Cuidado! El Zorro Ladrón entra por el sendero derecho caminando junto a la barda de piedra para robar.',
      visual: (
        <div className="relative w-full h-32 bg-amber-950/40 rounded-2xl border-2 border-amber-800/80 flex items-center justify-between px-6 overflow-hidden">
          <div className="flex flex-col items-center text-red-400 font-bold text-xs">
            <span className="text-2xl">⚠️</span>
            <span>¡Alerta!</span>
          </div>
          <div className="flex flex-col items-center">
            <img src={resolveAssetUrl('assets/sprites/zorro.png')} alt="Zorro" className="h-16 object-contain drop-shadow" />
            <span className="text-xs font-game text-orange-300">Zorro Ladrón</span>
          </div>
        </div>
      ),
    },
    {
      step: 6,
      title: 'Toca una maceta para espantarlo',
      description: 'Toca cualquiera de las macetas del muro superior justo cuando el zorro pase por debajo para tirársela encima.',
      visual: (
        <div className="relative w-full h-32 bg-amber-950/40 rounded-2xl border-2 border-amber-800/80 flex flex-col items-center justify-center p-2 overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <span className="text-sm font-game text-emerald-400">👆 Toca</span>
              <img src={resolveAssetUrl('assets/sprites/macetas.png')} alt="Maceta" className="h-10 object-contain animate-bounce" />
            </div>
            <div className="text-lg">⬇️</div>
            <div className="flex flex-col items-center">
              <span className="text-xl">🦊💥 ⭐</span>
              <span className="text-xs font-game text-yellow-300">¡PUM! ¡BONK!</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      step: 7,
      title: 'Si falla, el zorro se roba los huevos',
      description: 'Si el zorro llega al nido, se lleva TODOS los huevos del suelo, se burla de ti y te quita -0.5 corazones.',
      visual: (
        <div className="relative w-full h-32 bg-amber-950/40 rounded-2xl border-2 border-amber-800/80 flex items-center justify-around p-2 overflow-hidden">
          <div className="flex flex-col items-center">
            <span className="text-xs font-game text-red-400">Piso Vacío</span>
            <span className="text-2xl">🌾❌</span>
          </div>
          <div className="flex flex-col items-center bg-red-950/60 p-2 rounded-xl border border-red-500 text-center">
            <span className="font-game text-sm text-yellow-300">"¡JAJAJA! 🥚"</span>
            <span className="text-xs text-red-400 font-bold">-0.5 Corazón</span>
          </div>
        </div>
      ),
    },
    {
      step: 8,
      title: 'Sistema de Corazones (Vida)',
      description: 'Comienzas con 3 corazones máximos. Cada robo resta -0.5 corazón y cada cesta vendida recupera +0.5 corazón.',
      visual: (
        <div className="relative w-full h-32 bg-amber-950/40 rounded-2xl border-2 border-amber-800/80 flex flex-col items-center justify-center p-2 overflow-hidden gap-2">
          <div className="flex items-center gap-3 text-3xl">
            <span>❤️</span>
            <span>❤️</span>
            <span>💔</span>
          </div>
          <span className="text-xs font-game text-amber-200">Vida en intervalos de medio corazón (0 a 3 corazones)</span>
        </div>
      ),
    },
    {
      step: 9,
      title: 'Condición de Derrota',
      description: 'Si tu vida llega a 0 corazones por culpa de los robos del zorro, la partida termina inmediatamente en Game Over.',
      visual: (
        <div className="relative w-full h-32 bg-amber-950/40 rounded-2xl border-2 border-amber-800/80 flex items-center justify-center p-2 overflow-hidden gap-4">
          <div className="text-3xl">🖤 🖤 🖤</div>
          <div className="flex flex-col items-center">
            <span className="text-sm font-game text-red-400 font-bold">¡0 CORAZONES!</span>
            <span className="text-xs font-game text-yellow-300">GAME OVER</span>
          </div>
        </div>
      ),
    },
    {
      step: 10,
      title: 'Objetivo y Top 50',
      description: '¡Acumula la mayor cantidad de monedas de oro, vende muchas cestas, espanta al zorro y entra al Top 50 de mejores granjeros!',
      visual: (
        <div className="relative w-full h-32 bg-amber-950/40 rounded-2xl border-2 border-amber-800/80 flex items-center justify-around p-2 overflow-hidden">
          <div className="text-3xl animate-bounce">🏆</div>
          <div className="flex flex-col items-center text-center">
            <span className="font-game text-base text-yellow-300">TOP 50 GRANJEROS</span>
            <span className="text-xs text-emerald-300 font-bold">Guarda tu nombre y récord</span>
          </div>
          <div className="text-3xl">👑</div>
        </div>
      ),
    },
  ];

  const current = steps[currentStep];

  const handleNext = () => {
    sounds.playClick();
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    sounds.playClick();
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-sm wood-board rounded-3xl p-5 flex flex-col items-center border-4 border-amber-950 shadow-2xl relative">
        {/* Header Ribbon */}
        <div className="px-6 py-1.5 rounded-2xl bg-gradient-to-b from-blue-500 to-blue-700 border-3 border-amber-950 shadow-lg -mt-3 mb-3">
          <h2 className="font-game text-xl sm:text-2xl text-white tracking-wider font-extrabold drop-shadow">
            CÓMO JUGAR ({currentStep + 1} / {steps.length})
          </h2>
        </div>

        {/* Step Visual Composition */}
        <div className="w-full my-1">
          {current.visual}
        </div>

        {/* Title & Description */}
        <div className="w-full bg-amber-100/95 rounded-2xl p-3.5 border-2 border-amber-800/80 shadow-md my-2 text-center">
          <div className="inline-block px-3 py-0.5 rounded-full bg-blue-600 text-white font-game text-xs mb-1.5 shadow">
            PASO {current.step}
          </div>
          <h3 className="font-game text-base text-amber-950 font-bold leading-snug">
            {current.title}
          </h3>
          <p className="text-xs text-amber-900 mt-1 leading-relaxed">
            {current.description}
          </p>
        </div>

        {/* Dot Indicators */}
        <div className="flex items-center gap-1.5 my-2">
          {steps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                sounds.playClick();
                setCurrentStep(idx);
              }}
              className={`h-2 rounded-full transition-all ${
                idx === currentStep ? 'w-6 bg-yellow-400' : 'w-2 bg-amber-900/60'
              }`}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="w-full flex gap-2 mt-1">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`btn-wood flex-1 py-2.5 rounded-2xl font-game text-sm text-white shadow-md transition-all ${
              currentStep === 0 ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'
            }`}
          >
            ◀ ANTERIOR
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="btn-green flex-1 py-2.5 rounded-2xl font-game text-sm text-white shadow-md active:scale-95 transition-all"
          >
            {currentStep === steps.length - 1 ? '¡ENTENDIDO! ✔' : 'SIGUIENTE ▶'}
          </button>
        </div>
      </div>
    </div>
  );
};
