'use client';

import { useEffect, useState } from "react";
import { getGuildData } from "@/services/guildService"; 
import { getMessages, saveMessage } from "@/services/messageService";
import { GuildMember } from "@/types/guild";

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

    useEffect(() => {
        const calculateTimeAgo = () => {            
            const now = new Date();
            const lastSeenDate = new Date(lastSeen);
            const diffInMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));
            return `${diffInMinutes}m`;
        };

        setTimeAgo(calculateTimeAgo());
        
        const interval = setInterval(() => {
            setTimeAgo(calculateTimeAgo());
        }, 60000);
        
        return () => clearInterval(interval);
    }, [lastSeen]);

    return (
        <span className="text-xs px-2 py-1 rounded bg-red-600 text-white">
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
                console.error('Erro ao carregar mensagens:', err);
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
    }, []);

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
        <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Carregando dados...</p>
        </div>
    );

    if (error) return (
        <div className="p-4 text-center">
            <p className="text-red-500">Erro: {error}</p>
            <button 
                onClick={() => window.location.reload()}
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
            >
                Tentar Novamente
            </button>
        </div>
    );

    if (!guild) return (
        <div className="p-4 text-center">
            <p>Nenhuma guild encontrada</p>
        </div>
    );

    const { info, vocations, byLevel } = guild;

    const MemberRow = ({ member, isMain = false }: { member: GuildMember; isMain?: boolean }) => (
        <tr key={member.name} className="border-b border-gray-700 hover:bg-gray-700">
            {/* Nome - 30% */}
            <td className="p-2 truncate max-w-[90px]">
                <span
                    className="cursor-pointer text-blue-300 hover:text-blue-200 text-sm"
                    onClick={() => handleNameClick(member.name)}
                    title={member.name}
                >
                    {member.name}
                </span>
            </td>
            
            {/* Level - 15% */}
            <td className="p-2 text-center">
                <span className={`${isMain ? 'bg-green-600' : 'bg-blue-600'} text-white px-2 py-1 rounded text-sm`}>
                    {member.level}
                </span>
            </td>
            
            {/* Timer Online - 15% */}
            <td className="p-2 text-center">
                <OnlineTimer lastSeen={member.lastSeen} />
            </td>
            
            {/* Observação - 40% */}
            <td className="p-2 truncate max-w-[140px]">
                {editingMember === member.name ? (
                    <div className="flex gap-1">
                        <input
                            type="text"
                            value={editMessage}
                            onChange={(e) => setEditMessage(e.target.value)}
                            maxLength={50}
                            className="w-full p-1 text-sm bg-gray-700 border border-gray-600 rounded flex-1"
                            placeholder="Local ou observação..."
                            autoFocus
                        />
                        <button
                            onClick={() => handleEditSave(member.name)}
                            disabled={saving === member.name}
                            className="bg-green-600 text-white px-2 py-1 rounded text-sm disabled:opacity-50"
                        >
                            {saving === member.name ? "✓" : "✓"}
                        </button>
                        <button
                            onClick={() => setEditingMember(null)}
                            className="bg-gray-600 text-white px-2 py-1 rounded text-sm"
                        >
                            ✗
                        </button>
                    </div>
                ) : (
                    <span
                        className="cursor-pointer text-sm text-gray-300 hover:text-white truncate block"
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
        <div className="p-4 w-full min-h-screen">
            <div className="w-full">
                <h1 className="text-2xl font-bold mb-6 text-center">{info.name}</h1>
                
                <div className="mb-8 p-4 bg-gray-900 rounded-lg text-center max-w-2xl mx-auto">
                    <p>👥 Total de membros: {info.total}</p>
                    <p>🟢 Online: {info.online}</p>
                    <p>⚫ Offline: {info.offline}</p>
                    {lastUpdate && (
                        <p className="text-sm text-gray-400 mt-2">
                            📍 Última atualização: {lastUpdate.toLocaleTimeString()}
                        </p>
                    )}
                </div>

                {/* Mains (Level 100+) */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold mb-4 text-center text-green-600">Mains (Level 100+)</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 w-full">
                        {VOCATIONS.map(vocation => {
                            const vocationMembers = vocations[vocation] || [];
                            const mains = vocationMembers.filter(m => m.level >= 100); 
                            
                            return (
                                <div key={`main-${vocation}`} className="border border-gray-600 rounded-lg p-4 bg-gray-800 w-full">
                                    <h3 className="font-semibold text-center mb-3 text-green-400 truncate">{vocation}</h3>
                                    
                                    {mains.length === 0 ? (
                                        <p className="text-gray-500 text-center text-sm">Nenhum main online</p>
                                    ) : (
                                        <div className="w-full">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-gray-600">
                                                        <th className="text-left p-2 text-sm text-gray-400 w-[30%]">Nome</th>
                                                        <th className="text-center p-2 text-sm text-gray-400 w-[15%]">Level</th>
                                                        <th className="text-center p-2 text-sm text-gray-400 w-[15%]">Online</th>
                                                        <th className="text-left p-2 text-sm text-gray-400 w-[40%]">Obs</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {/* ✅ ORDENADO POR LEVEL AQUI */}
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

                {/* Bombas (Level 100-) */}
                <div>
                    <h2 className="text-xl font-bold mb-4 text-center text-blue-600">Bombas (Level 100-)</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 w-full">
                        {VOCATIONS.map(vocation => {
                            const vocationMembers = vocations[vocation] || [];
                            const bombas = vocationMembers.filter(m => m.level < 100); 
                            
                            return (
                                <div key={`bomba-${vocation}`} className="border border-gray-600 rounded-lg p-4 bg-gray-800 w-full">
                                    <h3 className="font-semibold text-center mb-3 text-blue-400 truncate">{vocation}</h3>
                                    
                                    {bombas.length === 0 ? (
                                        <p className="text-gray-500 text-center text-sm">Nenhuma bomba online</p>
                                    ) : (
                                        <div className="w-full">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-gray-600">
                                                        <th className="text-left p-2 text-sm text-gray-400 w-[30%]">Nome</th>
                                                        <th className="text-center p-2 text-sm text-gray-400 w-[15%]">Level</th>
                                                        <th className="text-center p-2 text-sm text-gray-400 w-[15%]">Online</th>
                                                        <th className="text-left p-2 text-sm text-gray-400 w-[40%]">Obs</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {/* ✅ ORDENADO POR LEVEL AQUI */}
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
                    <div className="text-center py-8 mt-8">
                        <p className="text-lg text-gray-500">😴 Nenhum membro online no momento</p>
                    </div>
                )}
            </div>
        </div>
    );
}