import { useState } from "react";
import { useGetSentenceWords, useCheckSentence, getGetSentenceWordsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PenTool, ArrowRight, CheckCircle, XCircle, RefreshCw, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GetSentenceWordsParams, SentenceCheckResult } from "@workspace/api-client-react";

export default function SentencePractice() {
  const [setup, setSetup] = useState<GetSentenceWordsParams | null>(null);
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [sentenceInput, setSentenceInput] = useState("");
  const [feedback, setFeedback] = useState<SentenceCheckResult | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: words, isLoading, isError, refetch } = useGetSentenceWords(
    setup!, 
    { query: { enabled: !!setup, queryKey: setup ? getGetSentenceWordsQueryKey(setup) : ["sentence-words-skip"] } }
  );

  const checkSentence = useCheckSentence();

  const handleStart = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setSetup({
      level: formData.get("level") === "all" ? undefined : formData.get("level") as any,
      section: formData.get("section") ? Number(formData.get("section")) : undefined,
      chapter: formData.get("chapter") ? Number(formData.get("chapter")) : undefined,
      count: Number(formData.get("count")) || 5,
    });
    setCurrentWordIdx(0);
    setSentenceInput("");
    setFeedback(null);
    setIsFinished(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!words || !sentenceInput.trim()) return;

    const currentWord = words[currentWordIdx];
    // words endpoint returns Vocab[] since it's testing vocab usage
    
    setSubmitError(null);
    checkSentence.mutate({
      data: {
        wordId: currentWord.id,
        wordType: "vocab",
        word: currentWord.word,
        reading: currentWord.reading,
        meaning: currentWord.meaning,
        sentence: sentenceInput,
      }
    }, {
      onSuccess: (result) => {
        setFeedback(result);
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error ?? err?.message ?? "Something went wrong. Please try again.";
        setSubmitError(msg);
      },
    });
  };

  const handleNext = () => {
    if (!words) return;
    if (currentWordIdx < words.length - 1) {
      setCurrentWordIdx(i => i + 1);
      setSentenceInput("");
      setFeedback(null);
    } else {
      setIsFinished(true);
    }
  };

  const handleRetry = () => {
    if (setup) {
      refetch().then(() => {
        setCurrentWordIdx(0);
        setSentenceInput("");
        setFeedback(null);
        setIsFinished(false);
      });
    }
  };

  if (!setup) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
        <header className="space-y-2 text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
            <PenTool className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Sentence Output</h1>
          <p className="text-muted-foreground">Practice writing Japanese sentences using your vocabulary.</p>
        </header>

        <Card className="bg-card border-border shadow-sm">
          <CardContent className="pt-6">
            <form onSubmit={handleStart} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Level</Label>
                  <Select name="level" defaultValue="all">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="N5">N5</SelectItem>
                      <SelectItem value="N4">N4</SelectItem>
                      <SelectItem value="N3">N3</SelectItem>
                      <SelectItem value="N2">N2</SelectItem>
                      <SelectItem value="N1">N1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Number of Words</Label>
                  <Select name="count" defaultValue="5">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 words</SelectItem>
                      <SelectItem value="5">5 words</SelectItem>
                      <SelectItem value="10">10 words</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Section (Optional)</Label>
                  <Input name="section" type="number" placeholder="Any" />
                </div>
                <div className="space-y-2">
                  <Label>Chapter (Optional)</Label>
                  <Input name="chapter" type="number" placeholder="Any" />
                </div>
              </div>
              <Button type="submit" className="w-full" size="lg">Start Writing</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        <p className="text-muted-foreground font-serif animate-pulse">Selecting vocabulary...</p>
      </div>
    );
  }

  if (isError || !words || words.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6 pt-12">
        <AlertTriangle className="w-16 h-16 text-destructive mx-auto" />
        <h2 className="text-2xl font-serif font-bold">No words found</h2>
        <p className="text-muted-foreground">We couldn't find enough vocabulary matching your filters.</p>
        <Button onClick={() => setSetup(null)} variant="outline">Go Back</Button>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-8 pt-12 animate-in zoom-in-95 duration-500">
        <div className="w-32 h-32 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
          <CheckCircle className="w-16 h-16 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-serif font-bold text-foreground">Practice Complete</h2>
          <p className="text-lg text-muted-foreground">Great job writing {words.length} sentences today.</p>
        </div>
        <div className="flex gap-4 justify-center">
          <Button onClick={handleRetry} size="lg" className="gap-2">
            <RefreshCw className="w-4 h-4" /> Practice Again
          </Button>
          <Button onClick={() => setSetup(null)} variant="outline" size="lg">
            Change Settings
          </Button>
        </div>
      </div>
    );
  }

  const word = words[currentWordIdx];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-8">
        <div>Word {currentWordIdx + 1} of {words.length}</div>
      </header>

      <Card className="bg-card shadow-sm border-border overflow-hidden">
        <div className="p-6 md:p-12 text-center border-b border-border bg-muted/10 relative">
          <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Target Word</p>
          <div className="flex flex-col items-center gap-2">
            <span className="text-muted-foreground font-serif tracking-widest">{word.reading}</span>
            <h2 className="text-5xl md:text-6xl font-serif font-bold text-primary mb-2">{word.word}</h2>
            <span className="text-lg font-medium">{word.meaning}</span>
          </div>
        </div>

        <CardContent className="p-4 md:p-8 space-y-6">
          {!feedback ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sentence">Write a Japanese sentence using this word:</Label>
                <Textarea 
                  id="sentence"
                  value={sentenceInput}
                  onChange={(e) => setSentenceInput(e.target.value)}
                  placeholder="ここに日本語を入力してください..."
                  className="min-h-[120px] font-serif text-lg resize-none bg-background"
                  disabled={checkSentence.isPending}
                  lang="ja"
                />
              </div>
              {submitError && (
                <div className="flex items-start gap-3 p-4 rounded-lg border border-destructive/50 bg-destructive/5 text-destructive text-sm">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}
              <div className="flex justify-end">
                <Button type="submit" disabled={!sentenceInput.trim() || checkSentence.isPending} size="lg">
                  {checkSentence.isPending ? "Checking..." : "Submit for Feedback"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className={cn(
                "p-6 rounded-xl border-2 flex flex-col gap-4 relative overflow-hidden",
                feedback.isCorrect ? "border-green-500 bg-green-500/5" : "border-destructive bg-destructive/5"
              )}>
                {feedback.isCorrect ? (
                  <CheckCircle className="w-24 h-24 absolute -bottom-6 -right-6 text-green-500/20" />
                ) : (
                  <XCircle className="w-24 h-24 absolute -bottom-6 -right-6 text-destructive/20" />
                )}
                
                <div>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className={cn(
                      "text-xl font-bold",
                      feedback.isCorrect ? "text-green-700 dark:text-green-400" : "text-destructive"
                    )}>
                      {feedback.isCorrect ? "Excellent!" : "Needs adjustment"}
                    </h3>
                    <span className="text-sm font-mono bg-background px-3 py-1 rounded-full border flex-shrink-0">
                      Score: {feedback.score}/100
                    </span>
                  </div>
                  <p className="mt-3 text-foreground leading-relaxed">{feedback.feedback}</p>
                </div>

                {feedback.corrections && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Corrected Sentence</p>
                    <p className="font-serif text-lg">{feedback.corrections}</p>
                  </div>
                )}
              </div>

              {feedback.alternativeExamples && feedback.alternativeExamples.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-bold text-lg">Example Usages</h4>
                  <div className="grid gap-3">
                    {feedback.alternativeExamples.map((alt: any, idx: number) => (
                      <div key={idx} className="p-4 bg-muted/30 rounded-lg border border-border/50">
                        <p className="font-serif text-lg">{alt.japanese}</p>
                        <p className="text-muted-foreground text-sm mt-1">{alt.english}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button onClick={handleNext} size="lg" className="group">
                  {currentWordIdx < words.length - 1 ? "Next Word" : "Finish Practice"}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
