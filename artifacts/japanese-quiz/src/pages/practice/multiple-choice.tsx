import { useState } from "react";
import { useGetMultipleChoiceQuestions, getGetMultipleChoiceQuestionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrainCircuit, CheckCircle2, XCircle, ArrowRight, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GetMultipleChoiceQuestionsParams } from "@workspace/api-client-react";

export default function MultipleChoicePractice() {
  const [setup, setSetup] = useState<GetMultipleChoiceQuestionsParams | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const queryClient = useQueryClient();

  const { data: questions, isLoading, isError, refetch } = useGetMultipleChoiceQuestions(
    setup!, 
    { query: { enabled: !!setup, queryKey: setup ? getGetMultipleChoiceQuestionsQueryKey(setup) : ["mc-questions-skip"] } }
  );

  const handleStart = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setSetup({
      quizType: formData.get("quizType") as "vocab" | "kanji",
      level: formData.get("level") === "all" ? undefined : formData.get("level") as any,
      section: formData.get("section") ? Number(formData.get("section")) : undefined,
      chapter: formData.get("chapter") ? Number(formData.get("chapter")) : undefined,
      count: Number(formData.get("count")) || 10,
    });
    setCurrentQuestionIdx(0);
    setSelectedOption(null);
    setScore(0);
    setIsFinished(false);
  };

  const handleAnswer = (index: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(index);
    if (questions && index === questions[currentQuestionIdx].correctIndex) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (!questions) return;
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(i => i + 1);
      setSelectedOption(null);
    } else {
      setIsFinished(true);
    }
  };

  const handleRetry = () => {
    if (setup) {
      // refetch to get new questions, then reset state
      refetch().then(() => {
        setCurrentQuestionIdx(0);
        setSelectedOption(null);
        setScore(0);
        setIsFinished(false);
      });
    } else {
      setSetup(null);
    }
  };

  if (!setup) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
        <header className="space-y-2 text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
            <BrainCircuit className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Multiple Choice Quiz</h1>
          <p className="text-muted-foreground">Test your recognition of vocabulary and kanji.</p>
        </header>

        <Card className="bg-card border-border shadow-sm">
          <CardContent className="pt-6">
            <form onSubmit={handleStart} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Quiz Type</Label>
                  <Select name="quizType" defaultValue="vocab">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vocab">Vocabulary</SelectItem>
                      <SelectItem value="kanji">Kanji</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                  <Label>Section (Optional)</Label>
                  <Input name="section" type="number" placeholder="Any" />
                </div>
                <div className="space-y-2">
                  <Label>Chapter (Optional)</Label>
                  <Input name="chapter" type="number" placeholder="Any" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Number of Questions</Label>
                  <Select name="count" defaultValue="10">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 questions</SelectItem>
                      <SelectItem value="10">10 questions</SelectItem>
                      <SelectItem value="20">20 questions</SelectItem>
                      <SelectItem value="50">50 questions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full" size="lg">Start Practice</Button>
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
        <p className="text-muted-foreground font-serif animate-pulse">Assembling questions...</p>
      </div>
    );
  }

  if (isError || !questions || questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6 pt-12">
        <XCircle className="w-16 h-16 text-destructive mx-auto" />
        <h2 className="text-2xl font-serif font-bold">No questions found</h2>
        <p className="text-muted-foreground">We couldn't find any questions matching your criteria. Try loosening your filters or adding more words to your library.</p>
        <Button onClick={() => setSetup(null)} variant="outline">Go Back</Button>
      </div>
    );
  }

  if (isFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="max-w-2xl mx-auto text-center space-y-8 pt-12 animate-in zoom-in-95 duration-500">
        <div className="w-32 h-32 mx-auto bg-card border-[8px] border-primary rounded-full flex items-center justify-center shadow-lg">
          <span className="text-4xl font-bold text-primary">{percentage}%</span>
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-serif font-bold text-foreground">Quiz Complete</h2>
          <p className="text-lg text-muted-foreground">You scored {score} out of {questions.length} correct.</p>
        </div>
        <div className="flex gap-4 justify-center">
          <Button onClick={handleRetry} size="lg" className="gap-2">
            <RotateCcw className="w-4 h-4" /> Retry Similar
          </Button>
          <Button onClick={() => setSetup(null)} variant="outline" size="lg">
            Change Settings
          </Button>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestionIdx];
  const isAnswered = selectedOption !== null;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-8">
        <div>Question {currentQuestionIdx + 1} of {questions.length}</div>
        <div>Score: {score}</div>
      </header>

      <Card className="bg-card shadow-sm border-border overflow-hidden">
        <div className="p-8 md:p-16 flex flex-col items-center justify-center min-h-[220px] md:min-h-[300px] border-b border-border bg-muted/20 relative">
          <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.02] mix-blend-multiply pointer-events-none"></div>
          {question.promptReading && (
            <div className="text-muted-foreground text-xl mb-4 font-serif tracking-widest">{question.promptReading}</div>
          )}
          <h2 className="text-7xl md:text-8xl font-serif font-bold text-foreground tracking-tight drop-shadow-sm">
            {question.prompt}
          </h2>
        </div>
        
        <CardContent className="p-4 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {question.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === question.correctIndex;
              
              let stateClass = "hover:border-primary/50 hover:bg-muted/50 border-border bg-background cursor-pointer";
              if (isAnswered) {
                if (isCorrect) stateClass = "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400";
                else if (isSelected && !isCorrect) stateClass = "border-destructive bg-destructive/10 text-destructive";
                else stateClass = "border-border bg-background opacity-50";
              }

              return (
                <div 
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  className={cn(
                    "p-6 rounded-xl border-2 transition-all duration-200 text-center font-medium text-lg",
                    stateClass,
                    isAnswered && "cursor-default"
                  )}
                >
                  {option}
                  {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-green-500" />}
                  {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-destructive" />}
                </div>
              );
            })}
          </div>

          {isAnswered && (
            <div className="mt-8 pt-8 border-t border-border animate-in slide-in-from-top-4 duration-300">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div className="space-y-4 flex-1">
                  <h3 className="text-xl font-bold text-foreground">
                    {question.questionType === "vocab" ? question.vocab?.meaning : question.kanji?.meanings.join(", ")}
                  </h3>
                  
                  {question.questionType === "vocab" && question.vocab?.example_sentences && question.vocab.example_sentences.length > 0 && (
                    <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Example Sentences</p>
                      {question.vocab.example_sentences.map((ex, i) => (
                        <div key={i} className={i > 0 ? "pt-3 border-t border-border/40" : ""}>
                          <p className="font-serif text-lg">{ex.japanese}</p>
                          {ex.romaji && <p className="text-muted-foreground text-sm mt-0.5 italic">{ex.romaji}</p>}
                          <p className="text-muted-foreground text-sm mt-1">{ex.english}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {question.questionType === "kanji" && question.kanji?.examples && question.kanji.examples.length > 0 && (
                    <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Example Words</p>
                      {question.kanji.examples.map((ex, i) => (
                        <div key={i} className={i > 0 ? "pt-3 border-t border-border/40" : ""}>
                          <p className="font-serif text-lg">{ex.word} <span className="text-sm text-muted-foreground ml-2">({ex.reading})</span></p>
                          <p className="text-muted-foreground text-sm mt-1">{ex.meaning}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button onClick={handleNext} size="lg" className="flex-shrink-0 w-full sm:w-auto group">
                  {currentQuestionIdx < questions.length - 1 ? "Next Question" : "View Results"} 
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
