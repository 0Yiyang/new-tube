"use client";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { PlaylistCreateModal } from "../components/playlist-create-modal";
import { PlaylistsSection } from "../sections/playlists-section";

export const PlayListsView = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  return (
    // 每个section有良好的封装，一个出问题不让整个View崩溃
    <div className="max-w-[2400px] mx-auto mb-10 pt-2.5 flex flex-col gap-y-6 border ">
      <PlaylistCreateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Playlists </h1>
          <p className="text-xs text-muted-foreground"> views you playlist</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => setCreateModalOpen(true)}
        >
          <PlusIcon />
        </Button>
      </div>
      <PlaylistsSection />
    </div>
  );
};
