import { useParams } from "wouter";
import { useGetVocab, useGetKanji, getGetVocabQueryKey, getGetKanjiQueryKey } from "@workspace/api-client-react";
import VocabForm from "@/components/forms/vocab-form";
import KanjiForm from "@/components/forms/kanji-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditEntry() {
  const params = useParams();
  const type = params.type;
  const id = params.id;

  const { data: vocab, isLoading: vocabLoading } = useGetVocab(
    type === "vocab" && id ? id : "skip", 
    { query: { enabled: type === "vocab" && !!id, queryKey: type === "vocab" && id ? getGetVocabQueryKey(id) : ["vocab-skip"] } }
  );

  const { data: kanji, isLoading: kanjiLoading } = useGetKanji(
    type === "kanji" && id ? id : "skip", 
    { query: { enabled: type === "kanji" && !!id, queryKey: type === "kanji" && id ? getGetKanjiQueryKey(id) : ["kanji-skip"] } }
  );

  if (type !== "vocab" && type !== "kanji") {
    return <div className="p-8 text-center text-muted-foreground">Invalid entry type.</div>;
  }

  const isLoading = type === "vocab" ? vocabLoading : kanjiLoading;

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl animate-pulse">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl">
      <header className="space-y-2">
        <h1 className="text-3xl font-serif font-bold text-foreground">
          Edit {type === "vocab" ? "Vocabulary" : "Kanji"}
        </h1>
        <p className="text-muted-foreground">Update the details of your study material.</p>
      </header>
      
      {type === "vocab" && vocab && <VocabForm initialData={vocab} />}
      {type === "kanji" && kanji && <KanjiForm initialData={kanji} />}
    </div>
  );
}
