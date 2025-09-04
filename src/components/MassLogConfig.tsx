'use client';

import { useState } from 'react';
import { MassLogAlertConfig } from '@/hooks/useMassLogAlert';

interface Props {
  config: MassLogAlertConfig;
  onSave: (config: MassLogAlertConfig) => void;
  onClose: () => void;
}

export default function MassLogConfig({ config, onSave, onClose }: Props) {
  const [formData, setFormData] = useState<MassLogAlertConfig>({
    enabled: config?.enabled ?? false,
    yellowAlertPlayers: config?.yellowAlertPlayers ?? 3,
    redAlertPlayers: config?.redAlertPlayers ?? 5,
    timeWindow: config?.timeWindow ?? 5,
    soundEnabled: config?.soundEnabled ?? true,
    cooldownMinutes: config?.cooldownMinutes ?? 10,
    soundVolume: config?.soundVolume ?? 70
  });

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-4 rounded-lg w-80">
        <h3 className="text-lg font-bold mb-4">Alertas de Mass Log</h3>
        
        <div className="mb-4">
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="mr-2"
              aria-label="Ativar sistema de alertas"
            />
            Ativar alertas
          </label>
        </div>

        <div className="mb-4">
          <label htmlFor="yellowAlertPlayers" className="block mb-1 text-sm">
            Alerta Amarelo (players):
          </label>
          <input
            id="yellowAlertPlayers"
            type="number"
            min="1"
            max="50"
            value={formData.yellowAlertPlayers}
            onChange={(e) => setFormData({ ...formData, yellowAlertPlayers: parseInt(e.target.value) || 3 })}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
            placeholder="Ex: 3"
            title="Número mínimo de players para alerta amarelo"
            aria-describedby="yellowAlertHelp"
          />
          <p id="yellowAlertHelp" className="text-xs text-gray-400 mt-1">
            Número de players para alerta visual (amarelo)
          </p>
        </div>

        <div className="mb-4">
          <label htmlFor="redAlertPlayers" className="block mb-1 text-sm">
            Alerta Vermelho (players):
          </label>
          <input
            id="redAlertPlayers"
            type="number"
            min="1"
            max="50"
            value={formData.redAlertPlayers}
            onChange={(e) => setFormData({ ...formData, redAlertPlayers: parseInt(e.target.value) || 5 })}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
            placeholder="Ex: 5"
            title="Número mínimo de players para alerta vermelho com som"
            aria-describedby="redAlertHelp"
          />
          <p id="redAlertHelp" className="text-xs text-gray-400 mt-1">
            Número de players para alerta crítico (vermelho) com som
          </p>
        </div>

        <div className="mb-4">
          <label htmlFor="timeWindow" className="block mb-1 text-sm">
            Tempo de verificação (minutos):
          </label>
          <input
            id="timeWindow"
            type="number"
            min="1"
            max="60"
            value={formData.timeWindow}
            onChange={(e) => setFormData({ ...formData, timeWindow: parseInt(e.target.value) || 5 })}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
            placeholder="Ex: 5"
            title="Janela de tempo em minutos para considerar logins recentes"
            aria-describedby="timeWindowHelp"
          />
          <p id="timeWindowHelp" className="text-xs text-gray-400 mt-1">
            Período para considerar players como "logados recentemente"
          </p>
        </div>

        <div className="mb-4">
          <label htmlFor="cooldownMinutes" className="block mb-1 text-sm">
            Cooldown do alerta (minutos):
          </label>
          <input
            id="cooldownMinutes"
            type="number"
            min="0"
            max="120"
            value={formData.cooldownMinutes}
            onChange={(e) => setFormData({ ...formData, cooldownMinutes: parseInt(e.target.value) || 10 })}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
            placeholder="Ex: 10"
            title="Tempo de espera entre alertas consecutivos"
            aria-describedby="cooldownHelp"
          />
          <p id="cooldownHelp" className="text-xs text-gray-400 mt-1">
            {formData.cooldownMinutes === 0 ? 
              '⚠️ Alertas tocarão sempre' : 
              `⏳ Próximo alerta após ${formData.cooldownMinutes}min`
            }
          </p>
        </div>

        <div className="mb-4">
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={formData.soundEnabled}
              onChange={(e) => setFormData({ ...formData, soundEnabled: e.target.checked })}
              className="mr-2"
              aria-label="Ativar som de alerta"
            />
            Ativar som de alerta
          </label>
        </div>

        {formData.soundEnabled && (
          <div className="mb-4">
            <label htmlFor="soundVolume" className="block mb-1 text-sm">
              Volume do som (%):
            </label>
            <input
                id="soundVolume"
                type="range"
                min="0"
                max="100"
                value={formData.soundVolume}
                onChange={(e) => setFormData({ ...formData, soundVolume: parseInt(e.target.value) })}
                className="w-full"
                title={`Volume atual: ${formData.soundVolume}%`}
                aria-valuenow={formData.soundVolume}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuetext={`${formData.soundVolume} por cento`}
                />
            <span className="text-xs text-gray-400">{formData.soundVolume}%</span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="bg-green-600 text-white px-4 py-2 rounded flex-1"
            aria-label="Salvar configurações"
          >
            Salvar
          </button>
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-4 py-2 rounded flex-1"
            aria-label="Cancelar e fechar configurações"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}