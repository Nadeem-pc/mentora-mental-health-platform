import { useEffect, useState } from "react";
import { chatService } from "@/services/shared/chatService";
import type { TherapistConversation } from "@/services/shared/chatService";
import { MessageCircle, Loader2 } from "lucide-react";

interface ConversationListProps {
    onSelectConversation: (conversation: TherapistConversation) => void;
    selectedConversationId?: string;
}

export function ConversationList({
    onSelectConversation,
    selectedConversationId
}: ConversationListProps) {
    const [conversations, setConversations] = useState<TherapistConversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const formatTimeAgo = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString();
    };

    useEffect(() => {
        const loadConversations = async () => {
            try {
                setLoading(true);
                const data = await chatService.getTherapistConversations();
                setConversations(data);
                setError(null);
            } catch (err) {
                setError("Failed to load conversations");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadConversations();
        // Poll for new conversations every 5 seconds
        const interval = setInterval(loadConversations, 5000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-red-500 text-sm">
                {error}
            </div>
        );
    }

    if (conversations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
                <p>No conversations yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-2 overflow-y-auto">
            {conversations.map((conversation) => {
                const unreadCount = conversation.unreadCount ?? 0;

                return (
                    <button
                        key={conversation.clientId}
                        onClick={() => onSelectConversation(conversation)}
                        className={`w-full p-3 text-left rounded-lg transition-colors ${
                            selectedConversationId === conversation.clientId
                                ? "bg-blue-100 border-l-4 border-blue-500"
                                : "hover:bg-gray-100"
                        }`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 truncate">
                                    {conversation.clientName}
                                </h3>
                                <p className="text-sm text-gray-600 truncate">
                                    {conversation.lastMessage || "No messages yet"}
                                </p>
                            </div>
                            <div className="ml-2 flex flex-col items-end">
                                {conversation.lastMessageAt && (
                                    <span className="text-xs text-gray-500">
                                        {formatTimeAgo(conversation.lastMessageAt)}
                                    </span>
                                )}
                                {unreadCount > 0 && (
                                    <span className="mt-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
