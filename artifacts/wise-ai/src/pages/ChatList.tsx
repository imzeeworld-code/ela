import { useState } from "react";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { MessageSquare, Plus, Trash2, ChevronRight, BookOpen } from "lucide-react";
import { 
  useListConversations, 
  useCreateConversation, 
  useDeleteConversation,
  getListConversationsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";

export default function ChatList() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: conversations, isLoading } = useListConversations();
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    createConversation.mutate(
      { data: { title: newTitle } },
      {
        onSuccess: (newConv) => {
          queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
          setIsDialogOpen(false);
          setNewTitle("");
          setLocation(`/chat/${newConv.id}`);
        }
      }
    );
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Remove this conversation from the archives?")) {
      deleteConversation.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
          }
        }
      );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="glass-panel sticky top-0 z-20 border-b-0 border-x-0 rounded-none px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <BookOpen className="w-4 h-4 text-primary" />
          </div>
          <span className="font-serif text-lg text-foreground">Wise AI</span>
        </Link>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary border border-primary/20">
              <Plus className="w-4 h-4 mr-2" />
              New Inquiry
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Begin a New Inquiry</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="title" className="text-muted-foreground mb-2 block">Subject of reflection</Label>
              <Input
                id="title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., The nature of consciousness"
                className="bg-background border-border focus-visible:ring-primary"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleCreate} 
                disabled={!newTitle.trim() || createConversation.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {createConversation.isPending ? "Preparing..." : "Commence"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12">
        <div className="mb-10 text-center fade-in-up">
          <h1 className="font-serif text-4xl text-foreground mb-3">The Archives</h1>
          <p className="text-muted-foreground font-light">Past reflections and ongoing inquiries.</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="w-full h-24 rounded-lg bg-muted/50" />
            ))}
          </div>
        ) : conversations?.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border/50 rounded-lg bg-muted/10">
            <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-serif text-xl text-foreground mb-2">The archives are empty</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-6">
              No conversations have been recorded yet. Begin a new inquiry to consult with Wise AI.
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="bg-primary text-primary-foreground">
              Begin First Inquiry
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {conversations?.map((conv, i) => (
              <div 
                key={conv.id}
                className="fade-in-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <Link href={`/chat/${conv.id}`}>
                  <div className="group relative block p-6 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-primary/30 transition-all duration-300 cursor-pointer overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex items-center justify-between relative z-10">
                      <div>
                        <h3 className="text-lg font-serif text-foreground group-hover:text-primary transition-colors mb-1">
                          {conv.title}
                        </h3>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
                          <span>{format(new Date(conv.updatedAt), "MMM d, yyyy • h:mm a")}</span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {conv.messageCount} messages
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => handleDelete(conv.id, e)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
