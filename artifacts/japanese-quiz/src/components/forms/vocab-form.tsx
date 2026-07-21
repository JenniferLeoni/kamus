import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { useCreateVocab, useUpdateVocab, getListVocabQueryKey, getGetVocabQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { Vocab, VocabInput } from "@workspace/api-client-react";

const vocabSchema = z.object({
  word: z.string().min(1, "Word is required"),
  reading: z.string().min(1, "Reading is required"),
  romaji: z.string().optional(),
  meaning: z.string().min(1, "Meaning is required"),
  type: z.string().min(1, "Type is required"),
  level: z.enum(["N5", "N4", "N3", "N2", "N1"]),
  section: z.coerce.number().min(1),
  chapter: z.coerce.number().min(1),
  example_sentences: z.array(z.object({
    japanese: z.string().min(1, "Required"),
    romaji: z.string().min(1, "Required"),
    english: z.string().min(1, "Required"),
  })).default([]),
  grammar_examples: z.array(z.object({
    grammar: z.string().min(1, "Required"),
    sentence: z.string().min(1, "Required"),
    romaji: z.string().min(1, "Required"),
    english: z.string().min(1, "Required"),
  })).default([]),
});

type VocabFormValues = z.infer<typeof vocabSchema>;

interface Props {
  initialData?: Vocab;
}

export default function VocabForm({ initialData }: Props) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const createVocab = useCreateVocab();
  const updateVocab = useUpdateVocab();

  const form = useForm<VocabFormValues>({
    resolver: zodResolver(vocabSchema),
    defaultValues: initialData ? {
      ...initialData,
      romaji: initialData.romaji || "",
      example_sentences: initialData.example_sentences || [],
      grammar_examples: initialData.grammar_examples || [],
    } : {
      word: "",
      reading: "",
      romaji: "",
      meaning: "",
      type: "noun",
      level: "N5",
      section: 1,
      chapter: 1,
      example_sentences: [],
      grammar_examples: [],
    },
  });

  const { fields: sentenceFields, append: appendSentence, remove: removeSentence } = useFieldArray({
    control: form.control,
    name: "example_sentences"
  });

  const { fields: grammarFields, append: appendGrammar, remove: removeGrammar } = useFieldArray({
    control: form.control,
    name: "grammar_examples"
  });

  function onSubmit(data: VocabFormValues) {
    if (initialData) {
      updateVocab.mutate({ id: initialData.id, data: data as VocabInput }, {
        onSuccess: (updated) => {
          toast({ title: "Vocabulary updated" });
          queryClient.setQueryData(getGetVocabQueryKey(updated.id), updated);
          queryClient.invalidateQueries({ queryKey: getListVocabQueryKey() });
          setLocation("/browse");
        },
        onError: () => {
          toast({ title: "Failed to update", variant: "destructive" });
        }
      });
    } else {
      createVocab.mutate({ data: data as VocabInput }, {
        onSuccess: () => {
          toast({ title: "Vocabulary added" });
          queryClient.invalidateQueries({ queryKey: getListVocabQueryKey() });
          setLocation("/browse");
        },
        onError: () => {
          toast({ title: "Failed to add", variant: "destructive" });
        }
      });
    }
  }

  const isPending = createVocab.isPending || updateVocab.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card className="bg-card shadow-sm border-border">
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="word" render={({ field }) => (
                <FormItem>
                  <FormLabel>Word (Kanji/Kana)</FormLabel>
                  <FormControl><Input {...field} className="font-serif text-lg" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="reading" render={({ field }) => (
                <FormItem>
                  <FormLabel>Reading (Hiragana)</FormLabel>
                  <FormControl><Input {...field} className="font-serif text-lg" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="romaji" render={({ field }) => (
                <FormItem>
                  <FormLabel>Romaji (Optional)</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="meaning" render={({ field }) => (
                <FormItem>
                  <FormLabel>English Meaning</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Word Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="noun">Noun</SelectItem>
                      <SelectItem value="verb">Verb</SelectItem>
                      <SelectItem value="adjective">Adjective</SelectItem>
                      <SelectItem value="adverb">Adverb</SelectItem>
                      <SelectItem value="particle">Particle</SelectItem>
                      <SelectItem value="expression">Expression</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="level" render={({ field }) => (
                <FormItem>
                  <FormLabel>Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="N5">N5</SelectItem>
                      <SelectItem value="N4">N4</SelectItem>
                      <SelectItem value="N3">N3</SelectItem>
                      <SelectItem value="N2">N2</SelectItem>
                      <SelectItem value="N1">N1</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="section" render={({ field }) => (
                <FormItem>
                  <FormLabel>Section</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="chapter" render={({ field }) => (
                <FormItem>
                  <FormLabel>Chapter</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </CardContent>
        </Card>

        {/* Example Sentences */}
        <Card className="bg-card shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-lg font-serif">Example Sentences</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => appendSentence({ japanese: "", romaji: "", english: "" })}>
              <Plus className="w-4 h-4 mr-2" /> Add Sentence
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {sentenceFields.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No sentences added.</p>}
            {sentenceFields.map((field, index) => (
              <div key={field.id} className="relative grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-border rounded-lg bg-background">
                <Button type="button" variant="ghost" size="icon" className="absolute -top-3 -right-3 h-6 w-6 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10 bg-background border border-border" onClick={() => removeSentence(index)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
                <FormField control={form.control} name={`example_sentences.${index}.japanese`} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Japanese</FormLabel>
                    <FormControl><Input {...field} className="font-serif" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name={`example_sentences.${index}.romaji`} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Romaji</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name={`example_sentences.${index}.english`} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">English</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Grammar Examples */}
        <Card className="bg-card shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-lg font-serif">Grammar Patterns</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => appendGrammar({ grammar: "", sentence: "", romaji: "", english: "" })}>
              <Plus className="w-4 h-4 mr-2" /> Add Pattern
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {grammarFields.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No patterns added.</p>}
            {grammarFields.map((field, index) => (
              <div key={field.id} className="relative grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-border rounded-lg bg-background">
                <Button type="button" variant="ghost" size="icon" className="absolute -top-3 -right-3 h-6 w-6 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10 bg-background border border-border" onClick={() => removeGrammar(index)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
                <FormField control={form.control} name={`grammar_examples.${index}.grammar`} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Pattern</FormLabel>
                    <FormControl><Input {...field} className="font-serif" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name={`grammar_examples.${index}.sentence`} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Sentence</FormLabel>
                    <FormControl><Input {...field} className="font-serif" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name={`grammar_examples.${index}.romaji`} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Romaji</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name={`grammar_examples.${index}.english`} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">English</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isPending} className="w-full md:w-auto px-8">
            {isPending ? "Saving..." : initialData ? "Update Vocabulary" : "Add Vocabulary"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
