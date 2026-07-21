import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { useCreateKanji, useUpdateKanji, getListKanjiQueryKey, getGetKanjiQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { Kanji, KanjiInput } from "@workspace/api-client-react";

const kanjiSchema = z.object({
  character: z.string().min(1, "Character is required"),
  on_readings: z.string().optional(), // We'll split by comma
  kun_readings: z.string().optional(),
  meanings: z.string().min(1, "Meanings required"),
  strokes: z.coerce.number().optional(),
  level: z.enum(["N5", "N4", "N3", "N2", "N1"]),
  section: z.coerce.number().min(1),
  chapter: z.coerce.number().min(1),
  examples: z.array(z.object({
    word: z.string().min(1, "Required"),
    reading: z.string().min(1, "Required"),
    meaning: z.string().min(1, "Required"),
  })).default([]),
});

type KanjiFormValues = z.infer<typeof kanjiSchema>;

interface Props {
  initialData?: Kanji;
}

export default function KanjiForm({ initialData }: Props) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const createKanji = useCreateKanji();
  const updateKanji = useUpdateKanji();

  const form = useForm<KanjiFormValues>({
    resolver: zodResolver(kanjiSchema),
    defaultValues: initialData ? {
      ...initialData,
      strokes: initialData.strokes || undefined,
      on_readings: initialData.on_readings?.join(", ") || "",
      kun_readings: initialData.kun_readings?.join(", ") || "",
      meanings: initialData.meanings?.join(", ") || "",
      examples: initialData.examples || [],
    } : {
      character: "",
      on_readings: "",
      kun_readings: "",
      meanings: "",
      strokes: undefined,
      level: "N5",
      section: 1,
      chapter: 1,
      examples: [],
    },
  });

  const { fields: exampleFields, append: appendExample, remove: removeExample } = useFieldArray({
    control: form.control,
    name: "examples"
  });

  function onSubmit(data: KanjiFormValues) {
    const payload: KanjiInput = {
      character: data.character,
      on_readings: data.on_readings ? data.on_readings.split(",").map(s => s.trim()).filter(Boolean) : [],
      kun_readings: data.kun_readings ? data.kun_readings.split(",").map(s => s.trim()).filter(Boolean) : [],
      meanings: data.meanings.split(",").map(s => s.trim()).filter(Boolean),
      strokes: data.strokes || null,
      level: data.level,
      section: data.section,
      chapter: data.chapter,
      examples: data.examples,
    };

    if (initialData) {
      updateKanji.mutate({ id: initialData.id, data: payload }, {
        onSuccess: (updated) => {
          toast({ title: "Kanji updated" });
          queryClient.setQueryData(getGetKanjiQueryKey(updated.id), updated);
          queryClient.invalidateQueries({ queryKey: getListKanjiQueryKey() });
          setLocation("/browse");
        },
        onError: () => {
          toast({ title: "Failed to update", variant: "destructive" });
        }
      });
    } else {
      createKanji.mutate({ data: payload }, {
        onSuccess: () => {
          toast({ title: "Kanji added" });
          queryClient.invalidateQueries({ queryKey: getListKanjiQueryKey() });
          setLocation("/browse");
        },
        onError: () => {
          toast({ title: "Failed to add", variant: "destructive" });
        }
      });
    }
  }

  const isPending = createKanji.isPending || updateKanji.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card className="bg-card shadow-sm border-border">
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="character" render={({ field }) => (
                <FormItem>
                  <FormLabel>Kanji Character</FormLabel>
                  <FormControl><Input {...field} className="font-serif text-3xl h-14 text-center" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="strokes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Stroke Count</FormLabel>
                  <FormControl><Input type="number" {...field} value={field.value ?? ""} className="h-14" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="on_readings" render={({ field }) => (
                <FormItem>
                  <FormLabel>On'yomi (comma separated)</FormLabel>
                  <FormControl><Input {...field} className="font-serif text-lg" placeholder="e.g. ガク, ガッ" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="kun_readings" render={({ field }) => (
                <FormItem>
                  <FormLabel>Kun'yomi (comma separated)</FormLabel>
                  <FormControl><Input {...field} className="font-serif text-lg" placeholder="e.g. まな.ぶ" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            
            <FormField control={form.control} name="meanings" render={({ field }) => (
              <FormItem>
                <FormLabel>Meanings (comma separated)</FormLabel>
                <FormControl><Input {...field} placeholder="e.g. study, learning, science" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        {/* Kanji Examples */}
        <Card className="bg-card shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-lg font-serif">Vocabulary Examples</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => appendExample({ word: "", reading: "", meaning: "" })}>
              <Plus className="w-4 h-4 mr-2" /> Add Word
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {exampleFields.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No words added.</p>}
            {exampleFields.map((field, index) => (
              <div key={field.id} className="relative grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-border rounded-lg bg-background">
                <Button type="button" variant="ghost" size="icon" className="absolute -top-3 -right-3 h-6 w-6 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10 bg-background border border-border" onClick={() => removeExample(index)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
                <FormField control={form.control} name={`examples.${index}.word`} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Word</FormLabel>
                    <FormControl><Input {...field} className="font-serif" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name={`examples.${index}.reading`} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Reading</FormLabel>
                    <FormControl><Input {...field} className="font-serif" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name={`examples.${index}.meaning`} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Meaning</FormLabel>
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
            {isPending ? "Saving..." : initialData ? "Update Kanji" : "Add Kanji"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
