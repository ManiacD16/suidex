"use client";

import { useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FaTelegramPlane, FaMediumM } from "react-icons/fa"; //FaFacebookF
import { FaXTwitter } from "react-icons/fa6"; //FaInstagram
import Trump from "../assets/videos/Trump_1_0001-0100_1.webm";

const SocialIcon: React.FC<{
  Icon: React.ElementType;
  href: string;
  className?: string;
}> = ({ Icon, href, className = "text-cyan-400 hover:text-green-500" }) => (
  <a href={href} target="_blank" rel="noopener noreferrer">
    <Icon size={20} className={`transition-colors duration-300 ${className}`} />
  </a>
);

export default function Page() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const banners = [
    {
      image: "/1.png",
      alt: "Bad Bunny Tap to Earn",
    },
    {
      image: "/2.png",
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
    <main className="min-h-screen overflow-x-hidden">
      {/* Rotating Banner Section */}
      <section className=" mt-4 relative h-[200px]   ">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {banners.map((banner, index) => (
            <div key={index} className="min-w-full">
              <img
                src={banner.image || "/placeholder.svg"}
                alt={banner.alt}
                className="w-full h-[200px] object-contain"
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
      <section className="py-16 px-8  shadow-lg">
        {/* bg-blue-500/20 */}
        <div className="container mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              <div className="space-y-4">
                <div>Unleashing</div>
                <div className="text-green-500">the Next</div>
                <div>Wave of DeFi on Sui</div>
              </div>
            </h2>

            <p className="text-gray-400 text-lg">
              Pioneering DeFi on Sui blockchain with unparalleled flexibility
              and seamless trading, powered by V2 technology
            </p>
            <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md">
              Swap Now
            </button>
          </div>
          <div className="order-first md:order-last">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full max-w-[500px] mx-auto"
            >
              <source src={Trump} type="video/webm" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </section>

      {/* DEX Section */}
      <section className="py-16 px-4 bg-cyan-500/10 shadow-lg ">
        <div className="container mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div>
            <img
              src="/Suitrump1.png"
              alt="Everyone's Favorite DEX"
              className="w-full max-w-[500px] mx-auto"
            />
          </div>
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold">
              <span className="text-purple-400"> The DEX </span>
              <span className="text-wite">where </span>
              <span className="text-purple-400">Everybody Wins.</span>
            </h2>

            <p className="text-gray-400 text-lg">
              Trade, Earn and Own crypto on SUI, Tremendous Returns.
            </p>
            <div>
              <p className="text-gray-400 text-lg mb-2">Join community</p>

              <div
                className="flex justify-start space-x-5 
  "
              >
                {/* <SocialIcon Icon={FaFacebookF} href="https://facebook.com" /> */}
                <SocialIcon
                  Icon={FaXTwitter}
                  href="https://x.com/SUITRUMPCOIN"
                />
                <SocialIcon
                  Icon={FaTelegramPlane}
                  href="https://t.me/+cFvZCZYolVFiNDk1"
                />
                {/* <SocialIcon Icon={FaInstagram} href="https://instagram.com" /> */}
                <SocialIcon Icon={FaMediumM} href="https://medium.com" />{" "}
                {/* Medium Icon */}
              </div>
            </div>
            <button className="px-4 py-2 bg-cyan-400 hover:bg-cyan-500 text-gray-900 font-semibold rounded-md">
              Trade Now
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
