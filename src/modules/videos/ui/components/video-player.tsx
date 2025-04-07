"use client";
import MuxPlayer from "@mux/mux-player-react"; // bun add @mux/mux-player-react@3.2.4
import { THUMBNAIL_FULLBACK } from "../../constant";

interface VideoPlayerProps {
  playbackId?: string | null | undefined;
  thumbnailUrl?: string | null | undefined;
  autoPlay?: boolean;
  onPlay?: () => void;
}

export const VideoPlayerSkeleton = () => {
  return <div className="aspect-video bg-black rounded-xl"></div>;
};
export const VideoPlayer = ({
  playbackId,
  thumbnailUrl,
  autoPlay,
  onPlay,
}: VideoPlayerProps) => {
  // if (!playbackId) {
  //   return null;
  //   //如果视频没有准备好
  // }
  return (
    <MuxPlayer
      playbackId={playbackId || ""}
      poster={thumbnailUrl || THUMBNAIL_FULLBACK}
      playerInitTime={0} //TODO:确认，否则影响水合
      autoPlay={autoPlay}
      thumbnailTime={0}
      onPlay={onPlay}
      //根据容器尺寸自动缩放  object-contain：确保视频内容 a.按比例缩放，b.完整显示元素 在容器内，同时保持宽高比。
      // object-cover:a.保持宽高比 b.填满容器
      className="w-full h-full object-contain"
      accentColor="#FF2056"
    />
  );
};
