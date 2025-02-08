"use client";

import { useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Page() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const banners = [
    {
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-ohiWMOoYNtp3cjJahxsT1wS0T5sLbz.png",
      alt: "Bad Bunny Tap to Earn",
    },
    {
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-ccqHkHYXrv1vXb4ltasFL7kGZ2HX61.png",
      alt: "PancakeSwap v4",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <main className="min-h-screen bg-gray-900">
      {/* Rotating Banner Section */}
      <section className="relative h-[200px] overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {banners.map((banner, index) => (
            <div key={index} className="min-w-full">
              <img
                src={banner.image || "/placeholder.svg"}
                alt={banner.alt}
                className="w-full h-[200px] object-cover"
              />
            </div>
          ))}
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full ${
                currentSlide === index ? "bg-white" : "bg-white/50"
              }`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>

        <button
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full"
          onClick={() =>
            setCurrentSlide(
              (prev) => (prev - 1 + banners.length) % banners.length
            )
          }
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full"
          onClick={() => setCurrentSlide((prev) => (prev + 1) % banners.length)}
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </section>

      {/* SwapX Section */}
      <section className="py-16 px-4 bg-[#0A0A0A]">
        <div className="container mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              Unleashing the Next Wave of DeFi on Sonic.
            </h2>
            <p className="text-gray-400 text-lg">
              Pioneering DeFi on Sonic blockchain with unparalleled flexibility
              and seamless trading, powered by V4 technology.
            </p>
            <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md">
              Swap Now
            </button>
          </div>
          <div className="order-first md:order-last">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-kh3QPvUUwlhaaWYApOaw5Af11Z0LIJ.png"
              alt="SwapX DeFi"
              className="w-full max-w-[500px] mx-auto"
            />
          </div>
        </div>
      </section>

      {/* DEX Section */}
      <section className="py-16 px-4 bg-[#1a1a2e]">
        <div className="container mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div>
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-jRDbejBXJjzZj02fkmH7ts4kFGdg6v.png"
              alt="Everyone's Favorite DEX"
              className="w-full max-w-[500px] mx-auto"
            />
          </div>
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold">
              <span className="text-white">Everyone's </span>
              <span className="text-purple-400">Favorite </span>
              <span className="text-white">DEX</span>
            </h2>
            <p className="text-gray-400 text-lg">
              Trade, earn, and own crypto on the all-in-one multichain DEX
            </p>
            <button className="bg-cyan-400 hover:bg-cyan-500 text-gray-900 font-semibold">
              Trade Now
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
