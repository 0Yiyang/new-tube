"use client";
import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CopyCheckIcon,
  CopyIcon,
  Globe2Icon,
  ImagePlusIcon,
  Loader2Icon,
  LockIcon,
  MoreVerticalIcon,
  RotateCwIcon,
  SparklesIcon,
  TrashIcon,
} from "lucide-react";
import { trpc } from "@/trpc/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  Form,
  FormControl,
  FormLabel,
  FormMessage,
  FormItem,
  FormField,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { z } from "zod";
import { videoUpdateSchema } from "@/db/schema";
import { toast } from "sonner";
import { VideoPlayer } from "@/modules/videos/ui/components/video-player";
import Link from "next/link";
import { snakeCaseToTitle } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { THUMBNAIL_FULLBACK } from "@/modules/videos/constant";
import { ThumbnailUploadModal } from "../components/thumbnail-upload-modal";
import { ThumbnailGenerateModal } from "../components/thumbnail-generate-modal";
import { APP_URL } from "@/constants";

interface FormSectionProps {
  videoId: string;
}
export const FormSection = ({ videoId }: FormSectionProps) => {
  return (
    <Suspense fallback={<FormSectionSkeleton />}>
      <ErrorBoundary fallback={<p>error</p>}>
        <FormSectionSuspense videoId={videoId} />
      </ErrorBoundary>
    </Suspense>
  );
};
const FormSectionSkeleton = () => {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="flex flex-col space-y-8 lg:col-span-3">
          <div className="space-y-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-[220px] w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-[84px] w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="flex flex-col space-y-8 lg:col-span-2">
          <div className="flex flex-col gap-4 bg-[#F9F9F9] rounded-xl overflow-hidden ">
            <Skeleton className=" aspect-video " />
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
const FormSectionSuspense = ({ videoId }: FormSectionProps) => {
  const router = useRouter();
  const utils = trpc.useUtils();

  const [thumbnailModalOpen, setThumbnailModalOpen] = useState(false);
  const [thumbnailGenerateModalOpen, setThumbnailGenerateModalOpen] =
    useState(false);
  // TODO:setThumbnailModalOpen:Dispatch<SetStateAction<boolean>>;
  // (value: boolean | ((prevState: boolean) => boolean)) => void;
  // 这意味着 setThumbnailModalOpen 可以接受： 一个布尔值 或一个函数，该函数接收当前状态并返回一个新的布尔值。

  const [video] = trpc.studio.getOne.useSuspenseQuery({ id: videoId });
  const [categories] = trpc.categories.getmany.useSuspenseQuery();

  const update = trpc.videos.update.useMutation({
    onSuccess: () => {
      utils.studio.getMany.invalidate();
      utils.studio.getOne.invalidate({ id: videoId });
      toast.success("Video updated");
    },
    onError: () => {
      toast.error("Something went wrong");
    },
  });

  // input调用的时候加上
  const remove = trpc.videos.remove.useMutation({
    onSuccess: () => {
      utils.studio.getMany.invalidate();
      toast.success("Video deleted");
      router.push("/studio");
    },
    onError: () => {
      toast.error("Something went wrong");
    },
  });
  const revalidate = trpc.videos.revalidate.useMutation({
    onSuccess: () => {
      utils.studio.getMany.invalidate();
      utils.studio.getOne.invalidate({ id: videoId });
      toast.success("Video revalidated");
      //  router.push("/studio");
    },
    onError: () => {
      toast.error("Something went wrong");
    },
  });

  const restoreThumbnail = trpc.videos.restoreThumbnail.useMutation({
    onSuccess: () => {
      utils.studio.getMany.invalidate();
      utils.studio.getOne.invalidate({ id: videoId });
      toast.success("Thumbnail restored");
    },
    onError: () => {
      toast.error("Something went wrong");
    },
  });

  const genernateTitle = trpc.videos.generateTitle.useMutation({
    onSuccess: () => {
      toast.success("background job is started", {
        description: "it takes a long time",
      });
    },
    onError: () => {
      toast.error("Something went wrong");
    },
  });
  const genernateDescription = trpc.videos.generateDescription.useMutation({
    onSuccess: () => {
      toast.success("background job is started", {
        description: "it takes a long time",
      });
    },
    onError: () => {
      toast.error("Something went wrong");
    },
  });
  const form = useForm<z.infer<typeof videoUpdateSchema>>({
    resolver: zodResolver(videoUpdateSchema), // TODO: resolver
    defaultValues: video, //name:表单字段名称，和defaultValues里的字段名一致
  });

  // const onSubmit = async (data: z.infer<typeof videoUpdateSchema>) => {
  //   // form.formState.isSubmitting如果想用这个查询表单更新状态，必须要等待
  //   await update.mutateAsync(data)
  // };
  const onSubmit = (data: z.infer<typeof videoUpdateSchema>) => {
    update.mutate(data);
    //  这里使用update.isPending检查更新状态
  };

  const fullUrl = `${APP_URL}/videos/${videoId}`;

  const [isCopied, SetIsCopied] = useState(false);

  const onCopy = async () => {
    // TODO:复制
    await navigator.clipboard.writeText(fullUrl);
    SetIsCopied(true);
    setTimeout(() => {
      SetIsCopied(false);
    }, 2000);
  };

  return (
    <>
      <ThumbnailUploadModal
        videoId={videoId}
        open={thumbnailModalOpen}
        // TODO:（value:boolean| ((prevState: boolean) => boolean)）=>void
        onOpenChange={setThumbnailModalOpen}
      />
      <ThumbnailGenerateModal
        videoId={videoId}
        open={thumbnailGenerateModalOpen}
        onOpenChange={setThumbnailGenerateModalOpen}
      />
      {/* // <Form> 提供表单上下文，<form> 处理表单提交。{...form}将useForm 提供的上下文（form）传递给子组件 */}
      {/* // 子组件（如 <FormField>）可以访问表单的状态和方法。 */}
      <Form {...form}>
        {/* 只有通过 handleSubmit类型验证，才会调用onSubmit*/}
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Video details</h1>
              <p className="text-xs text-muted-foreground">
                Manage your video details
              </p>
            </div>
            <div className="flex items-center gap-x-2">
              {/* TODO:更改后可以保存 form.formState.isDirty*/}
              <Button
                type="submit"
                disabled={update.isPending || !form.formState.isDirty}
              >
                Save
              </Button>
              <DropdownMenu>
                {/* DropdownMenuTrigger也是一个button，所以要用asChild */}
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVerticalIcon />
                  </Button>
                </DropdownMenuTrigger>
                {/* align；打开之后，content与trigger end对齐*/}
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => revalidate.mutate({ id: videoId })}
                  >
                    <RotateCwIcon className="size-4 mr-2" />
                    Revalidate
                  </DropdownMenuItem>

                  {/* 回调删除  */}
                  <DropdownMenuItem
                    onClick={() => remove.mutate({ id: videoId })}
                  >
                    <TrashIcon className="size-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {/* grid col span */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="space-y-8 lg:col-span-3">
              {/* title */}
              {/* field 是一个对象，包含以下属性：
            value：字段的当前值。onChange：字段值变化的回调函数。
            onBlur：字段失去焦点的回调函数。ref：字段的引用（用于注册字段）。
            field 的作用是将表单字段与表单上下文绑定。 */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <div className="flex items-center gap-x-2">
                        Title
                        <Button
                          size="icon"
                          variant="outline"
                          type="button"
                          className="rounded-full size-6 [&_svg]:size-3"
                          onClick={() => genernateTitle.mutate({ id: videoId })}
                          disabled={
                            genernateTitle.isPending || !video.muxTrackId
                          }
                        >
                          {genernateTitle.isPending ? (
                            <Loader2Icon className="animate-spin" />
                          ) : (
                            <SparklesIcon />
                          )}
                        </Button>
                      </div>
                      {/* 添加ai生成按钮 */}
                    </FormLabel>
                    <FormControl>
                      {/* field里面包含value不需要手动设置 */}
                      <Input
                        {...field}
                        placeholder="Add a title to your video"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* des */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <div className="flex items-center gap-x-2">
                        Description
                        <Button
                          size="icon"
                          variant="outline"
                          type="button"
                          className="rounded-full size-6 [&_svg]:size-3"
                          onClick={() =>
                            genernateDescription.mutate({ id: videoId })
                          }
                          disabled={
                            genernateDescription.isPending || !video.muxTrackId
                          }
                        >
                          {genernateDescription.isPending ? (
                            <Loader2Icon className="animate-spin" />
                          ) : (
                            <SparklesIcon />
                          )}
                        </Button>
                      </div>
                    </FormLabel>
                    {/* FormControl包裹表单输入组件 */}
                    <FormControl>
                      {/* resize-none：禁止调整缩放文本区域大小，一般默认可以调整*/}
                      {/* 将 field 对象的所有属性展开到 <Textarea> 组件中。 */}
                      <Textarea
                        {...field}
                        // 默认值可能是 null 或 undefined，可以显式设置value.
                        // value 会覆盖 {...field} 中的 value。
                        value={field.value ?? ""}
                        rows={10}
                        className="resize-none pr-10"
                        placeholder="Add a description to your video"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/*缩略图  */}
              <FormField
                name="thumbnailUrl"
                control={form.control}
                render={() => (
                  <FormItem>
                    <FormLabel>Thumbnail</FormLabel>
                    <FormControl>
                      <div className="p-0.5 border border-dashed border-neutral-400 relative h-[84px] w-[153px] group">
                        <Image
                          src={video.thumbnailUrl ?? THUMBNAIL_FULLBACK}
                          // TODO:fill不保证宽高比，完全填充，object-cover：保证宽高比，完全填满
                          className="object-cover"
                          fill
                          alt="thumbnailUrl"
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              size="icon"
                              className="bg-black/50 hover:bg-black/50 absolute top-1 right-1 
                          rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            >
                              {/*记住0就是没有，1就是有 opacity-0：隐藏元素 大于md透明，TODO: group-hover:和group-[hover]:区别*/}
                              <MoreVerticalIcon className="text-white" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" side="right">
                            <DropdownMenuItem
                              onClick={() => setThumbnailModalOpen(true)}
                            >
                              <ImagePlusIcon className="size-4 mr-1" />
                              Change
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                setThumbnailGenerateModalOpen(true)
                              }
                            >
                              <SparklesIcon className="size-4 mr-1" />
                              AI-generated
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                restoreThumbnail.mutate({ id: videoId })
                              }
                            >
                              <RotateCwIcon className="size-4 mr-1" />
                              Restore
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
              {/* category */}
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value ?? undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          // value 是 <SelectItem> 的唯一标识符，用于标识用户选择的选项,所以用id。
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-col gap-y-8 lg:col-span-2">
              {/*h-fit高度有内容决定*/}
              {/* MuxPalyer部分 */}
              <div className="flex flex-col gap-4 bg-[#F9F9F9] rounded-xl overflow-hidden h-fit">
                <div className=" aspect-video overflow-hidden relative">
                  <VideoPlayer
                    playbackId={video.muxPlaybackId}
                    thumbnailUrl={video.thumbnailUrl}
                  />
                </div>
              </div>
              {/* 细节部分 */}
              <div className="flex flex-col p-4 gap-y-6">
                <div className="flex items-center justify-between gap-x-2">
                  <div className="flex flex-col gap-y-1">
                    <p className="text-xs text-muted-foreground">Video link</p>
                    <div className="flex  items-center gap-x-2">
                      <Link prefetch href={`/videos/${video.id}`}>
                        <p className="line-clamp-1 text-sm text-blue-500 ">
                          {fullUrl}
                        </p>
                      </Link>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon" //大小
                        onClick={onCopy}
                        disabled={isCopied}
                        className="shrink-0"
                      >
                        {isCopied ? <CopyCheckIcon /> : <CopyIcon />}
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-y-1">
                    <p className="text-xs text-muted-foreground">
                      Video Status
                    </p>
                    <p className="text-sm">
                      {snakeCaseToTitle(video.muxStatus || "preparing")}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-y-1">
                    <p className="text-xs text-muted-foreground">
                      Subtitles status
                    </p>
                    <p className="text-sm">
                      {snakeCaseToTitle(video.muxTrackStatus || "no_audio")}
                    </p>
                  </div>
                </div>
              </div>
              {/* visibility */}
              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visibility</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value ?? undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="public">
                          <div className="flex items-center">
                            <Globe2Icon className="size-4 mr-2" />
                            public
                          </div>
                        </SelectItem>
                        <SelectItem value="private">
                          <div className="flex items-center">
                            <LockIcon className="size-4 mr-2" />
                            private
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </form>
      </Form>
    </>
  );
};
