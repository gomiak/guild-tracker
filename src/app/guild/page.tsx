'use client';

import { useEffect, useState } from "react";
import { getGuildData, markMemberAsExited, unmarkMemberAsExited } from "@/services/guildService"; 
import { getMessages, saveMessage } from "@/services/messageService";
import { addExternalCharacter, removeExternalCharacter, markExternalCharacterAsExited, unmarkExternalCharacterAsExited } from "@/services/externalCharacterService";
import { GuildMember, ExternalCharacter } from "@/types/guild";
import { useMassLogAlert } from "@/hooks/useMassLogAlert";
import MassLogConfig from "@/components/MassLogConfig";
import { Settings, AlertTriangle, AlertCircle, Users, UserCheck, UserX, Clock, Copy, Check, X, RotateCw, RefreshCw, ArrowUp, ArrowDown, UserMinus, UserPlus } from "lucide-react";

interface GuildAnalysis {
    info: {
        name: string;
        online: number;
        offline: number;
        total: number;
        external?: number;
    };
    vocations: Record<string, GuildMember[]>;
    exitedVocations: Record<string, GuildMember[]>;
    byLevel: {
        above: GuildMember[];
        below: GuildMember[];
    };
    sorted: GuildMember[];
    externalCharacters?: ExternalCharacter[];
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
    const [processingExit, setProcessingExit] = useState<string | null>(null);
    
    // Estados para personagens externos
    const [showAddCharacterModal, setShowAddCharacterModal] = useState(false);
    const [newCharacterName, setNewCharacterName] = useState("");
    const [addingCharacter, setAddingCharacter] = useState(false);
    
    // Estados para ordenação
    const [sortConfig, setSortConfig] = useState<{
        key: 'name' | 'level' | 'lastSeen';
        direction: 'asc' | 'desc';
    }>({
        key: 'level',
        direction: 'desc'
    });

    const { config, saveConfig, currentAlert, setCurrentAlert, checkMassLogs, lastAlertTime, resetCooldown, isOnCooldown } = useMassLogAlert();
    const VOCATIONS = ['Druid', 'Knight', 'Sorcerer', 'Paladin', 'Monk'];
    
    // Função para mapear vocações promovidas para vocações básicas
    const getBaseVocation = (vocation: string): string => {
        const vocationMap: { [key: string]: string } = {
            'Elder Druid': 'Druid',
            'Elite Knight': 'Knight',
            'Master Sorcerer': 'Sorcerer',
            'Royal Paladin': 'Paladin',
            'Exalted Monk': 'Monk',
            'Druid': 'Druid',
            'Knight': 'Knight',
            'Sorcerer': 'Sorcerer',
            'Paladin': 'Paladin',
            'Monk': 'Monk'
        };
        return vocationMap[vocation] || vocation;
    };

    // Função para converter ExternalCharacter para GuildMember
    const convertExternalToGuildMember = (char: ExternalCharacter): GuildMember => ({
        name: char.name,
        vocation: char.vocation,
        level: char.level,
        status: char.status,
        lastSeen: char.lastSeen || new Date(),
        isExited: char.isExited,
        isExternal: true
    });

    // Função para ordenar membros
    const sortMembers = (members: GuildMember[]): GuildMember[] => {
        if (!members) return [];
        
        return [...members].sort((a, b) => {
            let aValue: any, bValue: any;
            
            switch (sortConfig.key) {
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'level':
                    aValue = a.level;
                    bValue = b.level;
                    break;
                case 'lastSeen':
                    aValue = new Date(a.lastSeen).getTime();
                    bValue = new Date(b.lastSeen).getTime();
                    break;
                default:
                    return 0;
            }
            
            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    };

    // Manipulador de clique para ordenação
    const handleSort = (key: 'name' | 'level' | 'lastSeen') => {
        setSortConfig((prev: any) => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Componente para renderizar o ícone de ordenação
    const SortIcon = ({ columnKey }: { columnKey: 'name' | 'level' | 'lastSeen' }) => {
        if (sortConfig.key !== columnKey) return null;
        
        return sortConfig.direction === 'asc' ? 
            <ArrowUp size={12} className="inline ml-1" /> : 
            <ArrowDown size={12} className="inline ml-1" />;
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
        let intervalId: any;
        let isFetching = false;
        
        const fetchGuild = async () => {
            if (isFetching) {
                return;
            }
            
            isFetching = true;
            try {
                const data = await getGuildData(); 
                setGuild(data);
                setLastUpdate(new Date());
                
                if (data.sorted) {
                    checkMassLogs(data.sorted); 
                }
            } catch (err: any) {
                console.error('Erro no fetch:', err);
                setError(err.message);
            } finally {
                setLoading(false);
                isFetching = false;
            }
        };
        
        fetchGuild();
        intervalId = setInterval(fetchGuild, 30000);
        
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, []); // Removido checkMassLogs da dependência 

    const handleEditStart = (member: GuildMember) => {
        setEditingMember(member.name);
        setEditMessage(messages.get(member.name) || "");
    };

    const handleEditSave = async (memberName: string) => {
        if (editMessage.trim()) {
            setSaving(memberName);
            try {
                await saveMessage(memberName, editMessage.trim());
                setMessages((prev: any) => new Map(prev.set(memberName, editMessage.trim())));
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

    const handleMarkAsExited = async (member: GuildMember) => {
        try {
            setProcessingExit(member.name);
            
            await markMemberAsExited(member.name);
            
            const freshData = await getGuildData();
            setGuild(freshData);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setProcessingExit(null);
        }
    };

    const handleUnmarkAsExited = async (member: GuildMember) => {
        try {
            setProcessingExit(member.name);
            
            await unmarkMemberAsExited(member.name);
            
            const freshData = await getGuildData();
            setGuild(freshData);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setProcessingExit(null);
        }
    };

    const getMemberMessage = (name: string) => {
        return messages.get(name) || '';
    };

    // Funções para personagens externos
    const handleAddExternalCharacter = async () => {
        if (!newCharacterName.trim()) return;
        
        try {
            setAddingCharacter(true);
            await addExternalCharacter(newCharacterName.trim());
            setNewCharacterName("");
            setShowAddCharacterModal(false);
            
            // Recarregar dados
            const freshData = await getGuildData();
            setGuild(freshData);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setAddingCharacter(false);
        }
    };

    const handleRemoveExternalCharacter = async (name: string) => {
        try {
            await removeExternalCharacter(name);
            
            // Recarregar dados
            const freshData = await getGuildData();
            setGuild(freshData);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleMarkExternalAsExited = async (character: ExternalCharacter) => {
        try {
            setProcessingExit(character.name);
            await markExternalCharacterAsExited(character.name);
            
            // Recarregar dados
            const freshData = await getGuildData();
            setGuild(freshData);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setProcessingExit(null);
        }
    };

    const handleUnmarkExternalAsExited = async (character: ExternalCharacter) => {
        try {
            setProcessingExit(character.name);
            await unmarkExternalCharacterAsExited(character.name);
            
            // Recarregar dados
            const freshData = await getGuildData();
            setGuild(freshData);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setProcessingExit(null);
        }
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

    const { info, vocations, exitedVocations } = guild;

    const MemberRow = ({ member, isMain = false, showExitButton = true }: { member: GuildMember; isMain?: boolean; showExitButton?: boolean }) => {
        return (
        <tr key={member.name} className="border-b border-gray-700 hover:bg-gray-700">
            <td className="p-1 truncate max-w-[100px]">
                <span
                    className="cursor-pointer text-blue-300 hover:text-blue-200 text-xs flex items-center gap-1"
                    onClick={() => handleNameClick(member.name)}
                    title={member.name}
                >
                    {member.isExternal && (
                        <span className="bg-purple-600 text-white px-1 py-0.5 rounded text-xs font-bold">
                            E
                        </span>
                    )}
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
                            onChange={(e: any) => setEditMessage(e.target.value)}
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
                            title="Cancelar"
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

            {showExitButton && (
                                                             <td className="p-1 text-center">
                                                                 <button
                                                                     onClick={() => handleMarkAsExited(member)}
                                                                     disabled={processingExit === member.name}
                                                                     className="bg-red-600 text-white px-1 py-0.5 rounded text-xs hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                     title="Marcar como exitado"
                                                                 >
                                                                     {processingExit === member.name ? (
                                                                         <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                                                     ) : (
                                                                         <UserMinus size={12} />
                                                                     )}
                                                                 </button>
                                                             </td>
            )}
        </tr>
        );
    };

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
                
                <div className="mb-4 p-2 bg-gray-900 rounded-lg max-w-2xl mx-auto relative">
                    <div className="flex justify-center">
                        <div className="flex flex-col items-start gap-1">
                            <p className="text-sm flex items-center gap-1">
                                <Users size={16} />
                                Total: {info.total}
                            </p>
                            
                            <p className="text-sm text-green-400 flex items-center gap-1">
                                <UserCheck size={16} />
                                Online: {info.online} 
                                {exitedVocations && Object.values(exitedVocations).flat().length > 0 && (
                                    <span className="text-red-400">
                                        ({Object.values(exitedVocations).flat().length} exitados)
                                    </span>
                                )}
                            </p>
                            
                            {/* Contagem de Mains - filha do Online */}
                            {vocations && (
                                <p className="text-sm text-blue-400 flex items-center gap-1 ml-4">
                                    <UserCheck size={14} />
                                    ├─ Mains online: {Object.values(vocations).flat().filter(m => m.level >= 100).length}
                                    {exitedVocations && Object.values(exitedVocations).flat().filter(m => m.level >= 100).length > 0 && (
                                        <span className="text-red-400">
                                            ({Object.values(exitedVocations).flat().filter(m => m.level >= 100).length} exitados)
                                        </span>
                                    )}
                                </p>
                            )}
                            
                            {/* Contagem de Bombas - filha do Online */}
                            {vocations && (
                                <p className="text-sm text-orange-400 flex items-center gap-1 ml-4">
                                    <UserCheck size={14} />
                                    └─ Bombas online: {Object.values(vocations).flat().filter(m => m.level < 100).length}
                                    {exitedVocations && Object.values(exitedVocations).flat().filter(m => m.level < 100).length > 0 && (
                                        <span className="text-red-400">
                                            ({Object.values(exitedVocations).flat().filter(m => m.level < 100).length} exitados)
                                        </span>
                                    )}
                                </p>
                            )}
                            
                            <p className="text-sm text-gray-400 flex items-center gap-1">
                                <UserX size={16} />
                                Offline: {info.offline}
                            </p>

                            {lastUpdate && (
                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                    <Clock size={12} />
                                    Última atualização: {lastUpdate.toLocaleTimeString()}
                                </p>
                            )}
                        </div>
                    </div>
                    
                    <div className="absolute top-2 right-2 flex gap-2">
                        <button
                            onClick={() => setShowAddCharacterModal(true)}
                            className="bg-green-600 text-white p-2 rounded text-xs hover:bg-green-700 transition-colors"
                            title="Adicionar personagem externo"
                        >
                            <UserPlus size={16} />
                        </button>
                        <button
                            onClick={() => setShowConfig(true)}
                            className="bg-blue-600 text-white p-2 rounded text-xs hover:bg-blue-700 transition-colors"
                            title="Configurar alertas de mass log"
                        >
                            <Settings size={16} />
                        </button>
                    </div>
                </div>

                <div className="mb-4">
                    <h2 className="text-lg font-bold mb-2 text-center text-green-600">Mains (Level 100+)</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 w-full">
                        {VOCATIONS.map(vocation => {
                            const vocationMembers = vocations[vocation] || [];
                            const externalMembers = guild.externalCharacters?.filter(char => getBaseVocation(char.vocation) === vocation) || [];
                            const convertedExternalMembers = externalMembers.map(convertExternalToGuildMember);
                            const allMembers = [...vocationMembers, ...convertedExternalMembers];
                            const mains = allMembers.filter((m: any) => m.level >= 100); 
                            
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
                                                        <th 
                                                            className="text-left p-1 text-xs text-gray-400 w-[45%] cursor-pointer hover:bg-gray-700"
                                                            onClick={() => handleSort('name')}
                                                        >
                                                            Nome <SortIcon columnKey="name" />
                                                        </th>
                                                        <th 
                                                            className="text-center p-1 text-xs text-gray-400 w-[10%] cursor-pointer hover:bg-gray-700"
                                                            onClick={() => handleSort('level')}
                                                        >
                                                            Level <SortIcon columnKey="level" />
                                                        </th>
                                                        <th 
                                                            className="text-center p-1 text-xs text-gray-400 w-[10%] cursor-pointer hover:bg-gray-700"
                                                            onClick={() => handleSort('lastSeen')}
                                                        >
                                                            Online <SortIcon columnKey="lastSeen" />
                                                        </th>
                                                        <th className="text-left p-1 text-xs text-gray-400 w-[30%]">Obs</th>
                                                        <th className="text-center p-1 text-xs text-gray-400 w-[15%]">Ação</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sortMembers(mains).map(member => (
                                                        <MemberRow key={member.name} member={member} isMain={true} showExitButton={true} />
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
                            const externalMembers = guild.externalCharacters?.filter(char => getBaseVocation(char.vocation) === vocation) || [];
                            const convertedExternalMembers = externalMembers.map(convertExternalToGuildMember);
                            const allMembers = [...vocationMembers, ...convertedExternalMembers];
                            const bombas = allMembers.filter((m: any) => m.level < 100); 
                            
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
                                                        <th 
                                                            className="text-left p-1 text-xs text-gray-400 w-[35%] cursor-pointer hover:bg-gray-700"
                                                            onClick={() => handleSort('name')}
                                                        >
                                                            Nome <SortIcon columnKey="name" />
                                                        </th>
                                                        <th 
                                                            className="text-center p-1 text-xs text-gray-400 w-[15%] cursor-pointer hover:bg-gray-700"
                                                            onClick={() => handleSort('level')}
                                                        >
                                                            Level <SortIcon columnKey="level" />
                                                        </th>
                                                        <th 
                                                            className="text-center p-1 text-xs text-gray-400 w-[15%] cursor-pointer hover:bg-gray-700"
                                                            onClick={() => handleSort('lastSeen')}
                                                        >
                                                            Online <SortIcon columnKey="lastSeen" />
                                                        </th>
                                                        <th className="text-left p-1 text-xs text-gray-400 w-[30%]">Obs</th>
                                                        <th className="text-center p-1 text-xs text-gray-400 w-[15%]">Ação</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sortMembers(bombas).map(member => (
                                                        <MemberRow key={member.name} member={member} isMain={false} showExitButton={true} />
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

                {exitedVocations && (
                    <div className="mb-4">
                        <h2 className="text-lg font-bold mb-2 text-center text-red-600">Exitados</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 w-full">
                            {VOCATIONS.map(vocation => {
                                const vocationMembers = exitedVocations[vocation] || [];
                            
                            return (
                                <div key={`exited-${vocation}`} className="border border-gray-600 rounded p-2 bg-gray-800 w-full">
                                    <h3 className="font-semibold text-center mb-1 text-red-400 truncate text-sm">{vocation}</h3>
                                    
                                    {vocationMembers.length === 0 ? (
                                        <p className="text-gray-500 text-center text-xs">Nenhum exitado</p>
                                    ) : (
                                        <div className="w-full">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-gray-600">
                                                        <th 
                                                            className="text-left p-1 text-xs text-gray-400 w-[35%] cursor-pointer hover:bg-gray-700"
                                                            onClick={() => handleSort('name')}
                                                        >
                                                            Nome <SortIcon columnKey="name" />
                                                        </th>
                                                        <th 
                                                            className="text-center p-1 text-xs text-gray-400 w-[15%] cursor-pointer hover:bg-gray-700"
                                                            onClick={() => handleSort('level')}
                                                        >
                                                            Level <SortIcon columnKey="level" />
                                                        </th>
                                                        <th 
                                                            className="text-center p-1 text-xs text-gray-400 w-[15%] cursor-pointer hover:bg-gray-700"
                                                            onClick={() => handleSort('lastSeen')}
                                                        >
                                                            Online <SortIcon columnKey="lastSeen" />
                                                        </th>
                                                        <th className="text-left p-1 text-xs text-gray-400 w-[30%]">Obs</th>
                                                        <th className="text-center p-1 text-xs text-gray-400 w-[15%]">Ação</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sortMembers(vocationMembers).map(member => (
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
                                                                <span className="bg-red-600 text-white px-1 py-0.5 rounded text-xs">
                                                                    {member.level}
                                                                </span>
                                                            </td>
                                                            
                                                            <td className="p-1 text-center">
                                                                <OnlineTimer lastSeen={member.lastSeen} />
                                                            </td>

                                                            <td className="p-1 truncate max-w-[100px]">
                                                                <span
                                                                    className="cursor-pointer text-xs text-gray-300 hover:text-white truncate block"
                                                                    onClick={() => handleEditStart(member)}
                                                                    title={getMemberMessage(member.name) || "Clique para adicionar observação"}
                                                                >
                                                                    {getMemberMessage(member.name) || "..."}
                                                                </span>
                                                            </td>

                                                            <td className="p-1 text-center">
                                                                <button
                                                                    onClick={() => handleUnmarkAsExited(member)}
                                                                    disabled={processingExit === member.name}
                                                                    className="bg-green-600 text-white px-1 py-0.5 rounded text-xs hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    title="Desmarcar como exitado"
                                                                >
                                                                    {processingExit === member.name ? (
                                                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                                                    ) : (
                                                                        <UserPlus size={12} />
                                                                    )}
                                                                </button>
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
                )}


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

            {/* Modal para adicionar personagem externo */}
            {showAddCharacterModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-6 rounded-lg max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-4 text-white">Adicionar Personagem Externo</h3>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Nome do Personagem
                            </label>
                            <input
                                type="text"
                                value={newCharacterName}
                                onChange={(e) => setNewCharacterName(e.target.value)}
                                placeholder="Digite o nome do personagem"
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleAddExternalCharacter();
                                    }
                                }}
                            />
                        </div>

                        {/* Lista de personagens externos já adicionados */}
                        <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-300 mb-2">
                                Personagens Externos Adicionados ({guild?.externalCharacters?.length || 0})
                            </h4>
                            {guild?.externalCharacters && guild.externalCharacters.length > 0 ? (
                                <div className="max-h-32 overflow-y-auto bg-gray-700 rounded-md p-2">
                                    <div className="space-y-1">
                                        {guild.externalCharacters.map((char) => (
                                            <div
                                                key={char.name}
                                                className="flex items-center justify-between bg-gray-600 rounded px-2 py-1 hover:bg-gray-500 transition-colors"
                                            >
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <span className="text-purple-300 truncate">
                                                        {char.name}
                                                    </span>
                                                    <span className="text-gray-400 text-xs">
                                                        Lv.{char.level}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveExternalCharacter(char.name)}
                                                    className="text-red-400 hover:text-red-300 hover:bg-red-900 rounded p-1 transition-colors"
                                                    title="Remover do monitoramento"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-700 rounded-md p-3 text-center">
                                    <p className="text-gray-400 text-sm">Nenhum personagem externo adicionado ainda</p>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => {
                                    setShowAddCharacterModal(false);
                                    setNewCharacterName("");
                                }}
                                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAddExternalCharacter}
                                disabled={!newCharacterName.trim() || addingCharacter}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {addingCharacter ? 'Adicionando...' : 'Adicionar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}