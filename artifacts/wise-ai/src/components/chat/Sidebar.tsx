import { Link } from "wouter";
import { format } from "date-fns";
import { BookOpen, MessageSquare, Plus } from "lucide-react";
import { useListConversations, useCreateConversation, getListConversationsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

export default function Sidebar({ activeId }: { activeId: number }) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: conversations, isLoading } = useListConversations();
  const createConversation = useCreateConversation();

  const handleNew = () => {
    createConversation.mutate(
      { data: { title: "New Inquiry" } },
      {
        onSuccess: (newConv) => {
          queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
          setLocation(`/chat/${newConv.id}`);
        }
      }
    );
  };

  return (
    <div className="flex flex-col h-full bg-card/30">
      <div className="p-4 border-b border-border/50 shrink-0">
        <Link href="/" className="flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
          <BookOpen className="w-5 h-5 text-primary" />
          <span className="font-serif text-lg text-foreground">Wise AI</span>
        </Link>
        
        <Button 
          className="w-full justify-start bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
          onClick={handleNew}
          disabled={createConversation.isPending}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Inquiry
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2 py-4">
        <div className="space-y-1">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="w-full h-14 rounded-lg bg-muted/30 mb-2" />
            ))
          ) : conversations?.map(conv => (
            <Link key={conv.id} href={`/chat/${conv.id}`}>
              <div className={`
                w-full text-left p-3 rounded-lg transition-all duration-200 cursor-pointer
                ${activeId === conv.id 
                  ? 'bg-primary/10 border border-primary/20 shadow-[inset_2px_0_0_0_rgba(var(--primary))]' 
                  : 'hover:bg-muted/50 border border-transparent'
                }
              `}>
                <div className={`truncate font-medium text-sm mb-1 ${activeId === conv.id ? 'text-primary' : 'text-foreground'}`}>
                  {conv.title}
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                  <MessageSquare className="w-3 h-3" />
                  <span>{conv.messageCount}</span>
                  <span>•</span>
                  <span>{format(new Date(conv.updatedAt), "MMM d")}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-border/50 shrink-0">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60 uppercase tracking-widest font-serif">
          <span>WOD</span>
          <span className="w-1 h-1 rounded-full bg-border" />
          <span>Henry</span>
        </div>
      </div>
    </div>
  );
}
