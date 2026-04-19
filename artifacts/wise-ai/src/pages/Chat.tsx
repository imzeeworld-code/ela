import { useState, useRef, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { format } from "date-fns";
import { 
  Send, 
  ArrowLeft, 
  TestTube2, 
  ShieldCheck,
  BookOpen,
  Menu,
  ChevronLeft
} from "lucide-react";
import { 
  useGetConversation, 
  useListMessages, 
  useSendMessage,
  getListMessagesQueryKey,
  useListConversations
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Sidebar from "@/components/chat/Sidebar";

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const convId = parseInt(id || "0", 10);
  
  const [content, setContent] = useState("");
  const [isLabMode, setIsLabMode] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: conversation, isLoading: isLoadingConv, isError: isConvError } = useGetConversation(convId, { 
    query: { enabled: !!convId, queryKey: ['/api/conversations', convId] } 
  });
  
  const { data: messages, isLoading: isLoadingMessages } = useListMessages(convId, { 
    query: { enabled: !!convId, queryKey: getListMessagesQueryKey(convId) } 
  });
  
  const sendMessage = useSendMessage();

  useEffect(() => {
    if (isConvError) setLocation('/chat');
  }, [isConvError, setLocation]);

  useEffect(() => {
    if (messages && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, sendMessage.isPending]);

  const handleSend = () => {
    if (!content.trim() || sendMessage.isPending) return;
    
    sendMessage.mutate(
      { 
        id: convId, 
        data: { 
          content: content.trim(),
          mode: isLabMode ? 'lab' : 'chat' 
        } 
      },
      {
        onSuccess: () => {
          setContent("");
          queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey(convId) });
          queryClient.invalidateQueries({ queryKey: ['/api/conversations'] }); // Update stats/lists
        }
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  if (isLoadingConv) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Skeleton className="w-12 h-12 rounded-full" /></div>;
  }

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-80 flex-col border-r border-border bg-card/30">
        <Sidebar activeId={convId} />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-screen relative">
        
        {/* Header */}
        <header className="h-16 px-4 flex items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0 border-r border-border bg-card">
                <Sidebar activeId={convId} />
              </SheetContent>
            </Sheet>

            <Button variant="ghost" size="icon" className="hidden md:flex text-muted-foreground hover:text-foreground" onClick={() => setLocation('/chat')}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_10px_rgba(var(--primary),0.2)]">
                <BookOpen className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="font-serif font-medium text-foreground leading-tight">Wise AI</h2>
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span>WOD</span>
                  <span className="w-1 h-1 rounded-full bg-primary/50" />
                  <span>Oracle</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-secondary text-xs text-muted-foreground border border-border cursor-help">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary/70" />
                  <span className="hidden sm:inline">Rules Checked</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-popover text-popover-foreground border-border">
                Wise AI always verifies internal ethical constraints before responding.
              </TooltipContent>
            </Tooltip>

            <div className="flex items-center gap-2 border-l border-border pl-4">
              <TestTube2 className={`w-4 h-4 ${isLabMode ? 'text-primary' : 'text-muted-foreground'}`} />
              <Label htmlFor="lab-mode" className="text-xs text-muted-foreground cursor-pointer hidden sm:inline">Lab Mode</Label>
              <Switch 
                id="lab-mode" 
                checked={isLabMode} 
                onCheckedChange={setIsLabMode}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>
        </header>

        {/* Conversation Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-32">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center py-8 opacity-50 fade-in-up">
              <p className="font-serif text-xl text-foreground mb-1">{conversation?.title}</p>
              <p className="text-xs text-muted-foreground font-mono">
                Initiated {conversation ? format(new Date(conversation.createdAt), "MMMM d, yyyy") : ''}
              </p>
            </div>

            {isLoadingMessages ? (
              <div className="space-y-4">
                <Skeleton className="w-2/3 h-20 rounded-2xl rounded-tl-sm bg-card/50" />
                <Skeleton className="w-2/3 h-24 rounded-2xl rounded-tr-sm bg-primary/10 ml-auto" />
              </div>
            ) : messages?.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground font-light italic">The oracle awaits your inquiry...</p>
              </div>
            ) : (
              messages?.map((msg, i) => (
                <div 
                  key={msg.id} 
                  className={`flex w-full fade-in-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  style={{ animationDelay: `${Math.min(i * 0.05, 0.5)}s` }}
                >
                  <div 
                    className={`
                      max-w-[85%] rounded-2xl px-5 py-4 shadow-sm
                      ${msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                        : 'bg-card border border-border rounded-tl-sm text-foreground'
                      }
                      ${msg.mode === 'lab' && msg.role === 'assistant' ? 'border-primary/50 shadow-[0_0_15px_rgba(217,119,6,0.1)]' : ''}
                    `}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
                        <BookOpen className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-serif font-medium text-primary">Wise AI</span>
                        {msg.mode === 'lab' && (
                          <span className="text-[10px] uppercase tracking-wider bg-primary/20 text-primary px-1.5 py-0.5 rounded font-mono ml-2">
                            Lab Report
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className={`whitespace-pre-wrap leading-relaxed ${msg.mode === 'lab' && msg.role === 'assistant' ? 'lab-monologue' : 'font-light'}`}>
                      {msg.content}
                    </div>
                    
                    <div className={`text-[10px] mt-3 font-mono opacity-50 ${msg.role === 'user' ? 'text-right text-primary-foreground' : 'text-left text-muted-foreground'}`}>
                      {format(new Date(msg.createdAt), "h:mm a")}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {sendMessage.isPending && (
              <div className="flex w-full justify-start fade-in-up">
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm px-5 py-4 bg-card border border-border flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary/50 animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-primary/50 animate-pulse delay-150" />
                  <div className="w-2 h-2 rounded-full bg-primary/50 animate-pulse delay-300" />
                </div>
              </div>
            )}
            <div ref={bottomRef} className="h-4" />
          </div>
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/95 to-transparent pt-10 pb-4 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <div className="relative glass-panel rounded-2xl focus-within:border-primary/50 focus-within:shadow-[0_0_20px_rgba(217,119,6,0.1)] transition-all">
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  autoResize();
                }}
                onKeyDown={handleKeyDown}
                placeholder={isLabMode ? "Enter parameters for analysis..." : "Speak your mind..."}
                className="min-h-[60px] max-h-[200px] w-full resize-none border-0 bg-transparent py-4 pl-4 pr-16 focus-visible:ring-0 text-foreground placeholder:text-muted-foreground/50 font-light"
                rows={1}
                disabled={sendMessage.isPending}
              />
              <Button 
                onClick={handleSend}
                disabled={!content.trim() || sendMessage.isPending}
                size="icon"
                className="absolute bottom-2 right-2 h-10 w-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-transform active:scale-95 disabled:opacity-50"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </Button>
            </div>
            <div className="text-center mt-2">
              <p className="text-[10px] text-muted-foreground/60 font-mono">
                Wise AI (PSTT) • WOD Discoverers • Shift+Enter for new line
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
