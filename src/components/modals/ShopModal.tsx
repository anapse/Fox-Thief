import React, { useState } from 'react';
import { sounds } from '../../audio/soundManager';
import { ShopItem } from '../../types/game';
import { getSavedShop, saveShop, getSavedStats, saveStats } from '../../utils/storage';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  onUpgradesChanged: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  isOpen,
  onClose,
  coins,
  onUpgradesChanged,
}) => {
  if (!isOpen) return null;

  const [items, setItems] = useState<ShopItem[]>(() => getSavedShop());
  const [currentCoins, setCurrentCoins] = useState(coins);

  const handleBuy = (item: ShopItem) => {
    if (currentCoins < item.cost || item.level >= item.maxLevel) return;

    sounds.playCoin();
    const newCoins = currentCoins - item.cost;
    setCurrentCoins(newCoins);

    const stats = getSavedStats();
    stats.totalCoins = newCoins;
    saveStats(stats);

    const updated = items.map((i) => {
      if (i.id === item.id) {
        return {
          ...i,
          level: i.level + 1,
          cost: Math.round(i.cost * 1.6),
        };
      }
      return i;
    });

    setItems(updated);
    saveShop(updated);
    onUpgradesChanged();
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm wood-board rounded-3xl p-5 flex flex-col items-center border-4 border-amber-950 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        {/* Header with Awning */}
        <div className="flex flex-col items-center -mt-3 mb-3">
          <div className="w-32 h-6 bg-red-600 rounded-t-lg flex overflow-hidden border-2 border-red-950 shadow">
            <div className="w-1/4 h-full bg-white"></div>
            <div className="w-1/4 h-full bg-red-600"></div>
            <div className="w-1/4 h-full bg-white"></div>
            <div className="w-1/4 h-full bg-red-600"></div>
          </div>
          <div className="px-6 py-1.5 rounded-b-2xl bg-gradient-to-b from-amber-500 to-amber-700 border-2 border-amber-950 shadow-lg">
            <h2 className="font-game text-2xl text-yellow-100 tracking-wider font-extrabold drop-shadow">
              TIENDA DE LA GRANJA
            </h2>
          </div>
        </div>

        {/* Current coins board */}
        <div className="mb-3 px-4 py-1.5 rounded-full bg-amber-900/90 border border-amber-700 flex items-center gap-2 shadow-inner">
          <span className="text-xl">🪙</span>
          <span className="font-game text-yellow-300 text-lg">
            Tus Monedas: {currentCoins}
          </span>
        </div>

        {/* Items List */}
        <div className="w-full flex flex-col gap-2.5">
          {items.map((item) => {
            const isMax = item.level >= item.maxLevel;
            const canAfford = currentCoins >= item.cost;

            return (
              <div
                key={item.id}
                className="bg-amber-100/95 rounded-2xl p-3 border-2 border-amber-800/80 shadow-md flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-200/80 border border-amber-400 flex items-center justify-center text-2xl shadow-inner flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-game text-sm text-amber-950 font-bold leading-tight">
                      {item.name}
                    </h3>
                    <p className="text-[11px] text-amber-900/80 line-clamp-2 leading-tight mt-0.5">
                      {item.description}
                    </p>
                    <div className="mt-1 flex items-center gap-1">
                      {Array.from({ length: item.maxLevel }).map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-3.5 h-1.5 rounded-full ${
                            idx < item.level ? 'bg-amber-600' : 'bg-stone-300'
                          }`}
                        />
                      ))}
                      <span className="text-[10px] text-amber-800 font-bold ml-1">
                        Niv. {item.level}/{item.maxLevel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Buy Button */}
                <button
                  disabled={isMax || !canAfford}
                  onClick={() => handleBuy(item)}
                  className={`px-3 py-2 rounded-xl font-game text-xs flex flex-col items-center justify-center flex-shrink-0 min-w-[70px] shadow transition-all ${
                    isMax
                      ? 'bg-stone-400 text-stone-700 cursor-not-allowed border border-stone-500'
                      : canAfford
                      ? 'btn-yellow text-amber-950 active:scale-95'
                      : 'bg-stone-300 text-stone-500 cursor-not-allowed border border-stone-400'
                  }`}
                >
                  {isMax ? (
                    <span>MAX</span>
                  ) : (
                    <>
                      <span>MEJORAR</span>
                      <span className="text-[11px] font-bold text-amber-900 mt-0.5">
                        🪙 {item.cost}
                      </span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="btn-wood w-full py-3 rounded-2xl flex items-center justify-center gap-2 text-white font-game text-lg tracking-wide shadow-md active:scale-95 transition-all mt-4"
        >
          <span>VOLVER AL JUEGO</span>
        </button>
      </div>
    </div>
  );
};
