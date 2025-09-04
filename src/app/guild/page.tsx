'use client';

import { useEffect, useState } from "react";
import { getGuildData } from "@/services/guildService"; 
import { getMessages, saveMessage } from "@/services/messageService";
import { GuildMember } from "@/types/guild";
import { useMassLogAlert } from "@/hooks/useMassLogAlert";
import MassLogConfig from "@/components/MassLogConfig";
import { Settings, AlertTriangle, AlertCircle, Users, UserCheck, UserX, Clock, Copy, Check, X, RotateCw, RefreshCw } from "lucide-react";

interface GuildAnalysis {
    info: {
        name: string;
        online: number;
        offline: number;
        total: number;
    };
    vocations: Record<string, GuildMember[]>;
    byLevel: {
        above: GuildMember[];
        below: GuildMember[];
    };
    sorted: GuildMember[];
}

const OnlineTimer = ({ lastSeen }: { lastSeen: Date }) => {
    const [timeAgo, setTimeAgo] = useState('');
    const [diffInMinutes, setDiffInMinutes] = useState(0);

    useEffect(() => {
        const calculate = () => {
            const now = new Date();
            const lastSeenDate = new Date(lastSeen);
            const diff = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));
            setDiffInMinutes(diff);

            if (diff < 60) {
                return `${diff}m`;
            }
            const hours = Math.floor(diff / 60);
            const minutes = diff % 60;
            return `${hours}h${minutes > 0 ? `${minutes}m` : ''}`;
        };

        setTimeAgo(calculate());

        const interval = setInterval(() => {
            setTimeAgo(calculate());
        }, 60000);

        return () => clearInterval(interval);
    }, [lastSeen]);

    const getColor = () => {
        if (diffInMinutes < 10) return "bg-red-600";    
        if (diffInMinutes < 30) return "bg-yellow-500"; 
        return "bg-gray-600";                            
    };

    return (
        <span className={`text-[10px] px-1 py-0.5 rounded text-white ${getColor()}`}>
            {timeAgo}
        </span>
    );
};

export default function GuildPage() {
    
    const [guild, setGuild] = useState<GuildAnalysis | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [messages, setMessages] = useState<Map<string, string>>(new Map());
    const [editingMember, setEditingMember] = useState<string | null>(null);
    const [editMessage, setEditMessage] = useState("");
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [saving, setSaving] = useState<string | null>(null);
    const [showConfig, setShowConfig] = useState(false);

    const { config, saveConfig, currentAlert, setCurrentAlert, checkMassLogs, lastAlertTime, resetCooldown, isOnCooldown } = useMassLogAlert();
    const VOCATIONS = ['Druid', 'Knight', 'Sorcerer', 'Paladin', 'Monk'];

    
    const sortByLevelDesc = (members: GuildMember[]): GuildMember[] => {
        return [...members].sort((a, b) => b.level - a.level);
    };

    useEffect(() => {
        const loadMessages = async () => {
            try {
                const serverMessages = await getMessages();
                const messagesMap = new Map(serverMessages.map(m => [m.name, m.message]));
                setMessages(messagesMap);
            } catch (err) {
                setError('Erro ao carregar mensagens');
            }
        };
        
        loadMessages();
    }, []);

useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    const fetchGuild = async () => {
        try {
            const data = await getGuildData(); 
            setGuild(data);
            setLastUpdate(new Date());
            
            if (data.sorted) {
                checkMassLogs(data.sorted); 
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    fetchGuild();
    intervalId = setInterval(fetchGuild, 30000);
    
    return () => {
        if (intervalId) clearInterval(intervalId);
    };
}, [checkMassLogs]); 
    const handleEditStart = (member: GuildMember) => {
        setEditingMember(member.name);
        setEditMessage(messages.get(member.name) || "");
    };

    const handleEditSave = async (memberName: string) => {
        if (editMessage.trim()) {
            setSaving(memberName);
            try {
                await saveMessage(memberName, editMessage.trim());
                setMessages(prev => new Map(prev.set(memberName, editMessage.trim())));
                setEditingMember(null);
                setEditMessage("");
            } catch (err: any) {
                setError(err.message);
            } finally {
                setSaving(null);
            }
        } else {
            setEditingMember(null);
            setEditMessage("");
        }
    };

    const handleNameClick = (memberName: string) => {
        navigator.clipboard.writeText(`exiva "${memberName}`);
    };

    const getMemberMessage = (name: string) => {
        return messages.get(name) || '';
    };

    if (loading) return (
        <div className="p-2 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm">Loading...</p>
        </div>
    );

    if (error) return (
        <div className="p-2 text-center">
            <p className="text-red-500 text-sm">Erro: {error}</p>
            <button 
                onClick={() => window.location.reload()}
                className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-xs flex items-center gap-1 mx-auto"
            >
                <RotateCw size={14} />
                Tentar Novamente
            </button>
        </div>
    );

    if (!guild) return (
        <div className="p-2 text-center">
            <p className="text-sm">Nenhuma guild encontrada</p>
        </div>
    );

    const { info, vocations } = guild;

    const MemberRow = ({ member, isMain = false }: { member: GuildMember; isMain?: boolean }) => (
        <tr key={member.name} className="border-b border-gray-700 hover:bg-gray-700">
            <td className="p-1 truncate max-w-[100px]">
                <span
                    className="cursor-pointer text-blue-300 hover:text-blue-200 text-xs flex items-center gap-1"
                    onClick={() => handleNameClick(member.name)}
                    title={member.name}
                >
                    {member.name}
                    <Copy size={10} className="opacity-0 group-hover:opacity-100" />
                </span>
            </td>
            
            <td className="p-1 text-center">
                <span className={`${isMain ? 'bg-green-600' : 'bg-blue-600'} text-white px-1 py-0.5 rounded text-xs`}>
                    {member.level}
                </span>
            </td>
            
            <td className="p-1 text-center">
                <OnlineTimer lastSeen={member.lastSeen} />
            </td>

            <td className="p-1 truncate max-w-[100px]">
                {editingMember === member.name ? (
                    <div className="flex gap-0.5">
                        <input
                            type="text"
                            value={editMessage}
                            onChange={(e) => setEditMessage(e.target.value)}
                            maxLength={50}
                            className="w-full p-0.5 text-xs bg-gray-700 border border-gray-600 rounded flex-1"
                            placeholder="Local..."
                            autoFocus
                        />
                        <button
                            onClick={() => handleEditSave(member.name)}
                            disabled={saving === member.name}
                            className="bg-green-600 text-white px-1 py-0.5 rounded text-xs disabled:opacity-50"
                        >
                            {saving === member.name ? <Clock size={12} /> : <Check size={12} />}
                        </button>
                        <button
                            onClick={() => setEditingMember(null)}
                            className="bg-gray-600 text-white px-1 py-0.5 rounded text-xs"
                        >
                            <X size={12} />
                        </button>
                    </div>
                ) : (
                    <span
                        className="cursor-pointer text-xs text-gray-300 hover:text-white truncate block"
                        onClick={() => handleEditStart(member)}
                        title={getMemberMessage(member.name) || "Clique para adicionar observação"}
                    >
                        {getMemberMessage(member.name) || "..."}
                    </span>
                )}
            </td>
        </tr>
    );

    return (
        <div className="p-2 w-full min-h-screen">
            {currentAlert === 'red' && (
                <div className="fixed top-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg z-50">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={24} />
                        <div>
                            <p className="font-bold">MASSLOG!</p>
                            <p className="text-sm">{config.redAlertPlayers}+ players em {config.timeWindow}min</p>
                            {isOnCooldown() && ( 
                                <p className="text-xs text-yellow-300 flex items-center gap-1">
                                    <Clock size={12} />
                                    Próximo alerta em {config.cooldownMinutes}min
                                </p>
                            )}
                        </div>
                        <div className="flex flex-col gap-1">
                            <button
                                onClick={() => setCurrentAlert('none')}
                                className="bg-red-800 px-2 py-1 rounded text-xs"
                            >
                                Fechar
                            </button>
                            <button
                                onClick={resetCooldown}
                                className="bg-gray-700 px-2 py-1 rounded text-xs mt-1 flex items-center justify-center"
                                title="Resetar cooldown"
                            >
                                <RefreshCw size={12} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {currentAlert === 'yellow' && (
                <div className="fixed top-4 right-4 bg-yellow-600 text-black p-4 rounded-lg shadow-lg z-50">
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={24} />
                        <div>
                            <p className="font-bold">Cuidado</p>
                            <p className="text-sm">{config.yellowAlertPlayers}+ players em {config.timeWindow}min</p>
                        </div>
                        <button
                            onClick={() => setCurrentAlert('none')}
                            className="ml-4 bg-yellow-700 text-white px-2 py-1 rounded text-xs"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            )}

            <div className="w-full">
                <h1 className="text-xl font-bold mb-4 text-center">{info.name}</h1>
                
                <div className="mb-4 p-2 bg-gray-900 rounded-lg text-center max-w-2xl mx-auto relative">
                    <p className="text-sm flex items-center justify-center gap-1">
                        <Users size={16} />
                        Total: {info.total}
                    </p>
                    <p className="text-sm text-green-400 flex items-center justify-center gap-1">
                        <UserCheck size={16} />
                        Online: {info.online}
                    </p>
                    <p className="text-sm text-gray-400 flex items-center justify-center gap-1">
                        <UserX size={16} />
                        Offline: {info.offline}
                    </p>
                    
                    <button
                        onClick={() => setShowConfig(true)}
                        className="absolute top-2 right-2 bg-blue-600 text-white p-2 rounded text-xs hover:bg-blue-700 transition-colors"
                        title="Configurar alertas de mass log"
                    >
                        <Settings size={16} />
                    </button>

                    {lastUpdate && (
                        <p className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1">
                            <Clock size={12} />
                            Última atualização: {lastUpdate.toLocaleTimeString()}
                        </p>
                    )}
                </div>

                <div className="mb-4">
                    <h2 className="text-lg font-bold mb-2 text-center text-green-600">Mains (Level 100+)</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 w-full">
                        {VOCATIONS.map(vocation => {
                            const vocationMembers = vocations[vocation] || [];
                            const mains = vocationMembers.filter(m => m.level >= 100); 
                            
                            return (
                                <div key={`main-${vocation}`} className="border border-gray-600 rounded p-2 bg-gray-800 w-full">
                                    <h3 className="font-semibold text-center mb-1 text-green-400 truncate text-sm">{vocation}</h3>
                                    
                                    {mains.length === 0 ? (
                                        <p className="text-gray-500 text-center text-xs">Nenhum main online</p>
                                    ) : (
                                        <div className="w-full">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-gray-600">
                                                        <th className="text-left p-1 text-xs text-gray-400 w-[45%]">Nome</th>
                                                        <th className="text-center p-1 text-xs text-gray-400 w-[10%]">Level</th>
                                                        <th className="text-center p-1 text-xs text-gray-400 w-[10%]">Online</th>
                                                        <th className="text-left p-1 text-xs text-gray-400 w-[35%]">Obs</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sortByLevelDesc(mains).map(member => (
                                                        <MemberRow key={member.name} member={member} isMain={true} />
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <h2 className="text-lg font-bold mb-2 text-center text-blue-600">Bombas (Level 100-)</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 w-full">
                        {VOCATIONS.map(vocation => {
                            const vocationMembers = vocations[vocation] || [];
                            const bombas = vocationMembers.filter(m => m.level < 100); 
                            
                            return (
                                <div key={`bomba-${vocation}`} className="border border-gray-600 rounded p-2 bg-gray-800 w-full">
                                    <h3 className="font-semibold text-center mb-1 text-blue-400 truncate text-sm">{vocation}</h3>
                                    
                                    {bombas.length === 0 ? (
                                        <p className="text-gray-500 text-center text-xs">Nenhuma bomba online</p>
                                    ) : (
                                        <div className="w-full">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-gray-600">
                                                        <th className="text-left p-1 text-xs text-gray-400 w-[35%]">Nome</th>
                                                        <th className="text-center p-1 text-xs text-gray-400 w-[15%]">Level</th>
                                                        <th className="text-center p-1 text-xs text-gray-400 w-[15%]">Online</th>
                                                        <th className="text-left p-1 text-xs text-gray-400 w-[35%]">Obs</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sortByLevelDesc(bombas).map(member => (
                                                        <MemberRow key={member.name} member={member} />
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {info.online === 0 && (
                    <div className="text-center py-4 mt-4">
                        <p className="text-sm text-gray-500">Nenhum membro online no momento</p>
                    </div>
                )}
            </div>

            {showConfig && (
                <MassLogConfig
                    config={config}
                    onSave={saveConfig}
                    onClose={() => setShowConfig(false)}
                />
            )}
        </div>
    );
}