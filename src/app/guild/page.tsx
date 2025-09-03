'use client';

import { useEffect, useState } from "react";
import { getGuildData } from "@/services/guildService"; 
import { GuildMember } from "@/types/guild";

interface MemberMessage {
name: string;
message: string;
}

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

export default function GuildPage() {
const [guild, setGuild] = useState<GuildAnalysis | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [messages, setMessages] = useState<MemberMessage[]>([]);
const [editingMember, setEditingMember] = useState<string | null>(null);
const [editMessage, setEditMessage] = useState("");
const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

const VOCATIONS = ['Druid', 'Knight', 'Sorcerer', 'Paladin', 'Monk'];

useEffect(() => {
    const savedMessages = localStorage.getItem('guildMemberMessages');
    if (savedMessages) {
    setMessages(JSON.parse(savedMessages));
    }
}, []);

useEffect(() => {
    localStorage.setItem('guildMemberMessages', JSON.stringify(messages));
}, [messages]);

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

const handleEditStart = (member: GuildMember, currentMessage: string) => {
    setEditingMember(member.name);
    setEditMessage(currentMessage);
};

const handleEditSave = (memberName: string) => {
    if (editMessage.trim()) {
    setMessages(prev => {
        const existing = prev.find(m => m.name === memberName);
        if (existing) {
        return prev.map(m => m.name === memberName ? { ...m, message: editMessage } : m);
        }
        return [...prev, { name: memberName, message: editMessage }];
    });
    }
    setEditingMember(null);
    setEditMessage("");
};

const getMemberMessage = (name: string) => {
    return messages.find(m => m.name === name)?.message || '';
};

const handleNameClick = (memberName: string) => {
    navigator.clipboard.writeText(`exiva "${memberName}`);
};

if (loading) return <p>Carregando...</p>;
if (error) return <p>Erro: {error}</p>;
if (!guild) return <p>Nenhuma guild encontrada</p>;

const { info, vocations, byLevel } = guild;

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
                            <th className="text-left p-2 text-sm text-gray-400 w-[45%]">Nome</th>
                            <th className="text-center p-2 text-sm text-gray-400 w-[20%]">Level</th>
                            <th className="text-left p-2 text-sm text-gray-400 w-[35%]">Obs</th>
                        </tr>
                        </thead>
                        <tbody>
                        {mains.map(member => (
                            <tr key={member.name} className="border-b border-gray-700 hover:bg-gray-700">
                            <td className="p-2 truncate">
                                <span
                                className="cursor-pointer text-blue-300 hover:text-blue-200 text-sm"
                                onClick={() => handleNameClick(member.name)}
                                title={member.name}
                                >
                                {member.name}
                                </span>
                            </td>
                            <td className="p-2 text-center">
                                <span className="bg-green-600 text-white px-2 py-1 rounded text-sm">
                                {member.level}
                                </span>
                            </td>
                            <td className="p-2 truncate">
                                {editingMember === member.name ? (
                                <input
                                    type="text"
                                    value={editMessage}
                                    onChange={(e) => setEditMessage(e.target.value)}
                                    onBlur={() => handleEditSave(member.name)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleEditSave(member.name)}
                                    className="w-full p-1 text-sm bg-gray-700 border border-gray-600 rounded"
                                    placeholder="..."
                                    autoFocus
                                />
                                ) : (
                                <span
                                    className="cursor-pointer text-sm text-gray-300 hover:text-white truncate block"
                                    onClick={() => handleEditStart(member, getMemberMessage(member.name))}
                                    title={getMemberMessage(member.name) || "Clique para editar"}
                                >
                                    {getMemberMessage(member.name) || "..."}
                                </span>
                                )}
                            </td>
                            </tr>
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
                            <th className="text-left p-2 text-sm text-gray-400 w-[45%]">Nome</th>
                            <th className="text-center p-2 text-sm text-gray-400 w-[20%]">Level</th>
                            <th className="text-left p-2 text-sm text-gray-400 w-[35%]">Obs</th>
                        </tr>
                        </thead>
                        <tbody>
                        {bombas.map(member => (
                            <tr key={member.name} className="border-b border-gray-700 hover:bg-gray-700">
                            <td className="p-2 truncate">
                                <span
                                className="cursor-pointer text-blue-300 hover:text-blue-200 text-sm"
                                onClick={() => handleNameClick(member.name)}
                                title={member.name}
                                >
                                {member.name}
                                </span>
                            </td>
                            <td className="p-2 text-center">
                                <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm">
                                {member.level}
                                </span>
                            </td>
                            <td className="p-2 truncate">
                                {editingMember === member.name ? (
                                <input
                                    type="text"
                                    value={editMessage}
                                    onChange={(e) => setEditMessage(e.target.value)}
                                    onBlur={() => handleEditSave(member.name)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleEditSave(member.name)}
                                    className="w-full p-1 text-sm bg-gray-700 border border-gray-600 rounded"
                                    placeholder="..."
                                    autoFocus
                                />
                                ) : (
                                <span
                                    className="cursor-pointer text-sm text-gray-300 hover:text-white truncate block"
                                    onClick={() => handleEditStart(member, getMemberMessage(member.name))}
                                    title={getMemberMessage(member.name) || "Clique para editar"}
                                >
                                    {getMemberMessage(member.name) || "..."}
                                </span>
                                )}
                            </td>
                            </tr>
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