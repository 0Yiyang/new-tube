"use client";
import { Button } from "@/components/ui/button";
import { APP_URL } from "@/constants";
import { SearchIcon, XIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export const SearchInput = () => {
  const router = useRouter();
  // useSearchParams--
  // 如果路由是静态渲染的，则调用 useSearchParams 将导致客户端组件树（直到最近的 Suspense 边界 ）在客户端渲染,不在服务器端渲染，（执行不了）。
  // 这允许 route 的一部分被静态渲染，而使用 useSearchParams 的动态部分被 Client 端渲染。
  // ->页面的大部分可以预先静态生成;只有需要访问查询参数的部分会在客户端渲染;:需要suspense

  // 如果路由是动态渲染的，则 useSearchParams 将在 Client Component 的初始服务器渲染期间在服务器上可用。每次请求渲染
  const searchparams = useSearchParams();
  const query = searchparams.get("query") || "";
  const categoryId = searchparams.get("categoryId") || "";
  const [value, setValue] = useState(query);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const url = new URL("/search", APP_URL);
    const newQuery = value.trim();
    url.searchParams.set("query", encodeURIComponent(newQuery));
    if (categoryId) {
      url.searchParams.set("categoryId", categoryId); //TODO:这一步操作在categories里面也有
    }
    if (newQuery === "") {
      url.searchParams.delete("query");
    }
    setValue(newQuery);
    router.push(url.toString());
  };
  return (
    <form className="flex w-full max-w-[600px]" onSubmit={handleSearch}>
      <div className="relative w-full">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          type="text"
          placeholder="Search"
          className="w-full pl-4 py-2 pr-12 rounded-l-full border focus:outline-none focus:border-blue-500"
        />
        {value && (
          <Button
            disabled={!value.trim()}
            size="icon"
            type="button"
            variant="ghost"
            onClick={() => setValue("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full"
          >
            <XIcon className="text-gray-500" />
          </Button>
        )}
      </div>
      {/* TODO:为什么button和input高一样-->button设置高度，和input一样 */}
      <button
        type="submit"
        className="px-5 py-2.5 bg-gray-100 border border-l-0 rounded-r-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <SearchIcon className="size-5" />
      </button>
    </form>
  );
};
