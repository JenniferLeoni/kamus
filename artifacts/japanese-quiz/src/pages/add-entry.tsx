import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VocabForm from "@/components/forms/vocab-form";
import KanjiForm from "@/components/forms/kanji-form";

export default function AddEntry() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl">
      <header className="space-y-2">
        <h1 className="text-3xl font-serif font-bold text-foreground">Add to Library</h1>
        <p className="text-muted-foreground">Add new vocabulary or kanji to your study collection.</p>
      </header>

      <Tabs defaultValue="vocab" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="vocab">Vocabulary</TabsTrigger>
          <TabsTrigger value="kanji">Kanji</TabsTrigger>
        </TabsList>
        <TabsContent value="vocab" className="mt-6">
          <VocabForm />
        </TabsContent>
        <TabsContent value="kanji" className="mt-6">
          <KanjiForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
