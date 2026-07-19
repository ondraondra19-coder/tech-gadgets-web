"use client";

import { Instagram } from "lucide-react";

const igPosts = [
  "/images/ig1.png",
  "/images/ig2.png",
  "/images/ig3.png",
  "/images/ig4.png",
  "/images/ig5.png",
  "/images/ig6.png",
];

export default function InstagramFeed() {
  return (
    <section className="py-14">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">
        <div className="flex items-center gap-3 mb-8">
          <Instagram size={20} className="text-primary-ink" />
          <h2 className="text-2xl font-bold text-text-base">@slingr.cz</h2>
        </div>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
          {igPosts.map((src, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg bg-secondary border border-border hover:border-primary/40 overflow-hidden transition-colors duration-200 flex items-center justify-center text-text-subtle text-[10px]"
            >
              {src}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}