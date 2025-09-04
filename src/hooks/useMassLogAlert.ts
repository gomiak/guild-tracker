'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface MassLogAlertConfig {
    enabled: boolean;
    yellowAlertPlayers: number;
    redAlertPlayers: number;
    timeWindow: number;
    soundEnabled: boolean;
    cooldownMinutes: number;
    soundVolume: number;
}

const defaultConfig: MassLogAlertConfig = {
    enabled: false,
    yellowAlertPlayers: 3,
    redAlertPlayers: 5,
    timeWindow: 5,
    soundEnabled: true,
    cooldownMinutes: 10,
    soundVolume: 70,
};

export type AlertType = 'none' | 'yellow' | 'red';

export function useMassLogAlert() {
    const [config, setConfig] = useState<MassLogAlertConfig>(defaultConfig);
    const [currentAlert, setCurrentAlert] = useState<AlertType>('none');
    const [lastAlertTime, setLastAlertTime] = useState<number>(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('massLogAlertConfig');
        if (saved) {
            try {
                const parsedConfig = JSON.parse(saved);
                setConfig(parsedConfig);
            } catch (error) {
                setConfig(defaultConfig);
            }
        }

        const lastAlert = localStorage.getItem('lastAlertTime');
        if (lastAlert) {
            setLastAlertTime(parseInt(lastAlert));
        }
    }, []);

    const saveConfig = useCallback((newConfig: MassLogAlertConfig) => {
        setConfig(newConfig);
        localStorage.setItem('massLogAlertConfig', JSON.stringify(newConfig));
    }, []);

    const isOnCooldown = useCallback(() => {
        if (config.cooldownMinutes === 0) return false;
        if (lastAlertTime === 0) return false;

        const now = Date.now();
        const cooldownMs = config.cooldownMinutes * 60 * 1000;
        return now - lastAlertTime < cooldownMs;
    }, [lastAlertTime, config.cooldownMinutes]);

    const playAlertSound = useCallback(() => {
        console.log('🎵 Tentando tocar som...');

        if (config.cooldownMinutes > 0 && lastAlertTime > 0) {
            const now = Date.now();
            const cooldownMs = config.cooldownMinutes * 60 * 1000;
            if (now - lastAlertTime < cooldownMs) {
                console.log('🔇 Em cooldown, não tocando');
                return;
            }
        }

        if (!config.soundEnabled) {
            console.log('🔇 Som desativado nas configurações');
            return;
        }

        try {
            const audio = new Audio('/sounds/alert.mp3');
            const volume = config.soundVolume / 100;
            audio.volume = Math.max(0, Math.min(1, volume));
            audio.currentTime = 0;

            audio
                .play()
                .then(() => {
                    console.log('🔊 Som tocado com sucesso');
                    const now = Date.now();
                    setLastAlertTime(now);
                    localStorage.setItem('lastAlertTime', now.toString());
                })
                .catch((error) => {
                    console.log('🔇 Autoplay bloqueado:', error);
                });
        } catch (error) {
            console.log('❌ Erro ao tocar som:', error);
        }
    }, [
        config.soundEnabled,
        config.soundVolume,
        config.cooldownMinutes,
        lastAlertTime,
    ]);

    const resetCooldown = useCallback(() => {
        setLastAlertTime(0);
        localStorage.removeItem('lastAlertTime');
        console.log('🔄 Cooldown resetado manualmente');
    }, []);

    const checkMassLogs = useCallback(
        (members: any[]) => {
            if (!config.enabled) {
                setCurrentAlert('none');
                return;
            }

            const now = new Date();
            const recentLogins = members.filter((member) => {
                if (!member.lastSeen) return false;
                const lastSeen = new Date(member.lastSeen);
                const diffMinutes =
                    (now.getTime() - lastSeen.getTime()) / (1000 * 60);
                return diffMinutes <= config.timeWindow;
            });

            if (recentLogins.length >= config.redAlertPlayers) {
                setCurrentAlert('red');
                playAlertSound(); 
            } else if (recentLogins.length >= config.yellowAlertPlayers) {
                setCurrentAlert('yellow');
            } else {
                setCurrentAlert('none');
            }
        },
        [
            config.enabled,
            config.yellowAlertPlayers,
            config.redAlertPlayers,
            config.timeWindow,
            playAlertSound, 
        ],
    );

    return {
        config,
        saveConfig,
        currentAlert,
        setCurrentAlert,
        checkMassLogs,
        lastAlertTime,
        resetCooldown,
        isOnCooldown,
        playAlertSound,
    };
}
