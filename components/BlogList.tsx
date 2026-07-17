"use client";

import Image from "next/image";
import { ChevronRight, ArrowUpRight } from "lucide-react";
import { useT } from "@/lib/useT";

type ListPost = { slug: string; title: string; date: string; img: string };

function PostCard({ post, sizes, aspect, headingLevel }: {
  post: ListPost;
  sizes: string;
  aspect: string;
  headingLevel: "h2" | "h3";
}) {
  const Heading = headingLevel;
  return (
    <a href={`/blog/${post.slug}`} className={`group relative flex flex-col rounded-2xl overflow-hidden ${aspect}`}>
      {/* alt="" — titulek článku je hned pod obrázkem jako text odkazu.
          unoptimized zůstává: admin může do článku vložit libovolnou URL
          a next/image na doméně mimo remotePatterns spadne. */}
      <Image
        src={post.img}
        alt=""
        fill
        sizes={sizes}
        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        unoptimized={post.img.startsWith("http")}
      />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="bg-white/85 backdrop-blur-sm rounded-xl p-4 flex items-end justify-between gap-3">
          <div>
            <Heading className="text-text-base font-bold text-sm leading-snug mb-1">{post.title}</Heading>
            <p className="text-text-subtle text-xs">{post.date}</p>
          </div>
          <div className="shrink-0 w-9 h-9 rounded-full border border-border flex items-center justify-center text-text-muted group-hover:bg-primary group-hover:border-primary group-hover:text-on-primary transition-all duration-200">
            <ArrowUpRight size={15} aria-hidden="true" />
          </div>
        </div>
      </div>
    </a>
  );
}

export default function BlogList({ posts }: { posts: ListPost[] }) {
  const t = useT("blog");
  const [first, second, ...rest] = posts;

  return (
    <main className="min-h-screen bg-dark">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 py-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-text-subtle mb-8">
          <a href="/" className="hover:text-text-muted transition-colors">{t("home")}</a>
          <ChevronRight size={12} className="text-border" aria-hidden="true" />
          <span className="text-text-muted">{t("title")}</span>
        </nav>

        <h1 className="text-3xl font-extrabold text-text-base tracking-tight mb-8">{t("previewTitle")}</h1>

        {/* Horní dva — roztažené vedle sebe */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {[first, second].filter(Boolean).map((post) => (
            <PostCard
              key={post.slug}
              post={post}
              sizes="(max-width: 768px) 100vw, 50vw"
              aspect="aspect-[16/9]"
              headingLevel="h2"
            />
          ))}
        </div>

        {/* Spodní — po třech */}
        {rest.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rest.map((post) => (
              <PostCard
                key={post.slug}
                post={post}
                sizes="(max-width: 640px) 50vw, 25vw"
                aspect="aspect-square"
                headingLevel="h3"
              />
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
