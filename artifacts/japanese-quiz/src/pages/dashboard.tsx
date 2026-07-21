import { useGetStats } from '@workspace/api-client-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { BrainCircuit, PenTool, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: stats, isLoading } = useGetStats();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <header className="space-y-2">
        <h1 className="text-3xl font-serif font-bold text-foreground tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground">Your study library at a glance.</p>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i} className="border-border shadow-sm"><CardContent className="p-6 h-28 flex flex-col justify-between"><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-10 w-16" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-card border-border shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 transform translate-x-2 -translate-y-2 text-6xl font-serif font-bold group-hover:scale-110 transition-transform">語</div>
            <CardContent className="p-6 relative z-10">
              <p className="text-sm font-medium text-muted-foreground">Total Vocabulary</p>
              <p className="text-4xl font-serif font-bold mt-2 text-primary">{stats?.totalVocab}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 transform translate-x-2 -translate-y-2 text-6xl font-serif font-bold group-hover:scale-110 transition-transform">漢</div>
            <CardContent className="p-6 relative z-10">
              <p className="text-sm font-medium text-muted-foreground">Total Kanji</p>
              <p className="text-4xl font-serif font-bold mt-2 text-primary">{stats?.totalKanji}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">N5 Vocab</p>
              <p className="text-4xl font-serif font-bold mt-2">{stats?.vocabByLevel?.N5 || 0}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">N5 Kanji</p>
              <p className="text-4xl font-serif font-bold mt-2">{stats?.kanjiByLevel?.N5 || 0}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mt-12">
        <h2 className="text-xl font-serif font-bold mb-6 text-foreground">Practice Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/practice/multiple-choice">
            <div className="group border border-border bg-card rounded-xl p-6 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
              <div className="flex items-start gap-5">
                <div className="p-3 bg-primary/5 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg font-serif">Multiple Choice Quiz</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    Test your reading and meaning recognition for vocab and kanji. Build speed and accuracy.
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
              </div>
            </div>
          </Link>
          <Link href="/practice/sentence">
            <div className="group border border-border bg-card rounded-xl p-6 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
              <div className="flex items-start gap-5">
                <div className="p-3 bg-primary/5 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <PenTool className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg font-serif">Sentence Creation</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    Practice using words in context. Write sentences and get immediate AI feedback on grammar.
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
