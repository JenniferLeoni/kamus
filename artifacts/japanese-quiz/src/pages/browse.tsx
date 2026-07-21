import { useState } from "react";
import { useListVocab, useListKanji, useDeleteVocab, useDeleteKanji, getListVocabQueryKey, getListKanjiQueryKey } from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Edit, Trash2, BookOpen } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { ListVocabLevel, ListKanjiLevel } from "@workspace/api-client-react";

export default function Browse() {
  const [activeTab, setActiveTab] = useState("vocab");
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<string>("all");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const levelFilter = level !== "all" ? level as any : undefined;

  const { data: vocabList, isLoading: vocabLoading } = useListVocab(
    { search: search || undefined, level: levelFilter },
    { query: { queryKey: getListVocabQueryKey({ search: search || undefined, level: levelFilter }) } }
  );

  const { data: kanjiList, isLoading: kanjiLoading } = useListKanji(
    { search: search || undefined, level: levelFilter },
    { query: { queryKey: getListKanjiQueryKey({ search: search || undefined, level: levelFilter }) } }
  );

  const deleteVocab = useDeleteVocab();
  const deleteKanji = useDeleteKanji();

  const handleDeleteVocab = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (confirm("Are you sure you want to delete this vocabulary?")) {
      deleteVocab.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Deleted vocabulary" });
          queryClient.invalidateQueries({ queryKey: getListVocabQueryKey() });
        }
      });
    }
  };

  const handleDeleteKanji = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (confirm("Are you sure you want to delete this kanji?")) {
      deleteKanji.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Deleted kanji" });
          queryClient.invalidateQueries({ queryKey: getListKanjiQueryKey() });
        }
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl">
      <header className="space-y-2">
        <h1 className="text-3xl font-serif font-bold text-foreground">Library</h1>
        <p className="text-muted-foreground">Manage your vocabulary and kanji collection.</p>
      </header>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search words, meanings, or readings..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className="w-[180px] bg-card">
            <SelectValue placeholder="Filter by Level" />
          </SelectTrigger>
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-sm grid-cols-2">
          <TabsTrigger value="vocab">Vocabulary</TabsTrigger>
          <TabsTrigger value="kanji">Kanji</TabsTrigger>
        </TabsList>
        
        <TabsContent value="vocab" className="mt-6">
          <div className="border border-border rounded-lg bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[120px]">Word</TableHead>
                  <TableHead>Meaning</TableHead>
                  <TableHead className="w-[100px]">Level</TableHead>
                  <TableHead className="w-[100px]">Section</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vocabLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-10" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-16 float-right" /></TableCell>
                    </TableRow>
                  ))
                ) : vocabList?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      No vocabulary found. <Link href="/add" className="text-primary hover:underline">Add one?</Link>
                    </TableCell>
                  </TableRow>
                ) : (
                  vocabList?.map((vocab) => (
                    <TableRow key={vocab.id} className="group">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-serif font-bold text-lg">{vocab.word}</span>
                          <span className="text-xs text-muted-foreground font-serif">{vocab.reading}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{vocab.meaning}</span>
                          <span className="text-xs text-muted-foreground capitalize">{vocab.type}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="font-mono">{vocab.level}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{vocab.section}.{vocab.chapter}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/edit/vocab/${vocab.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => handleDeleteVocab(vocab.id, e)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        <TabsContent value="kanji" className="mt-6">
          <div className="border border-border rounded-lg bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[100px] text-center">Kanji</TableHead>
                  <TableHead>Readings</TableHead>
                  <TableHead>Meaning</TableHead>
                  <TableHead className="w-[100px]">Level</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kanjiLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-10 w-10 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-10" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-16 float-right" /></TableCell>
                    </TableRow>
                  ))
                ) : kanjiList?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      No kanji found. <Link href="/add" className="text-primary hover:underline">Add one?</Link>
                    </TableCell>
                  </TableRow>
                ) : (
                  kanjiList?.map((kanji) => (
                    <TableRow key={kanji.id} className="group">
                      <TableCell className="text-center">
                        <span className="font-serif text-3xl font-bold text-primary">{kanji.character}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm font-serif">
                          {kanji.on_readings && kanji.on_readings.length > 0 && (
                            <span className="text-muted-foreground"><span className="text-xs uppercase mr-1">On:</span> {kanji.on_readings.join("・")}</span>
                          )}
                          {kanji.kun_readings && kanji.kun_readings.length > 0 && (
                            <span className="text-muted-foreground"><span className="text-xs uppercase mr-1">Kun:</span> {kanji.kun_readings.join("・")}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-sm">{kanji.meanings.join(", ")}</span>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="font-mono">{kanji.level}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/edit/kanji/${kanji.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => handleDeleteKanji(kanji.id, e)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
