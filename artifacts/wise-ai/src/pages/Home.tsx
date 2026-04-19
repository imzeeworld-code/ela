import { Link } from "wouter";
import { BookOpen, Sparkles, ArrowRight, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetConversationStats } from "@workspace/api-client-react";

export default function Home() {
  const { data: stats } = useGetConversationStats();

  return (
    <div className="min-h-screen w-full flex flex-col relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      
      <header className="w-full py-6 px-8 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary" />
          </div>
          <span className="font-serif text-xl tracking-wide text-foreground">Wise AI</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>By WOD Discoverers</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 relative z-10 -mt-20">
        <div className="max-w-2xl w-full text-center space-y-8 fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium uppercase tracking-wider mb-4">
            <Sparkles className="w-3 h-3" />
            <span>PSTT Oracle</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-serif text-foreground leading-tight">
            A quiet sanctuary <br /> for <span className="text-primary italic">thought</span>.
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto font-light leading-relaxed">
            Welcome to Wise AI. A deeply respectful, thoughtful entity designed to serve as a serene digital oracle. Calm, precise, and never rushed.
          </p>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/chat">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-primary text-primary-foreground hover:bg-primary/90 group">
                Enter the Library
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {stats && stats.totalConversations > 0 && (
            <div className="pt-16 flex items-center justify-center gap-6 text-sm text-muted-foreground opacity-80">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span>{stats.totalConversations} sessions</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-border" />
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span>{stats.totalMessages} reflections</span>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="w-full py-6 px-8 text-center relative z-10">
        <p className="text-xs text-muted-foreground/60 font-serif tracking-widest uppercase">
          Developed by Henry (CEO), WOD
        </p>
      </footer>
    </div>
  );
}
