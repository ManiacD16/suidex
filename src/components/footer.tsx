"use client";

import { FaFacebookF, FaTelegramPlane, FaMediumM } from "react-icons/fa";
import { FaXTwitter, FaInstagram } from "react-icons/fa6";

const SocialIcon: React.FC<{ Icon: React.ElementType; href: string }> = ({
  Icon,
  href,
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="text-gray-400 hover:text-slate-300 transition-colors duration-300"
  >
    <Icon size={20} />
  </a>
);

export default function Footer() {
  return (
    <footer className="text-white px-6 w-full">
      <div className="w-full bottom-0 lg:mt-0 lg:mb-0 mb-2 mt-4 mx-auto flex flex-col md:flex-row justify-between items-center md:items-start">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-4 md:space-y-0 md:items-start">
          <div className="flex items-center space-x-4">
            <span className="text-xl sm:text-2xl font-bold text-cyan-500/90">
              SuiDe
              <span className="text-xl sm:text-2xl font-bold text-green-500/90">
                X
              </span>
            </span>
          </div>
        </div>

        {/* Social Icons (Always Horizontal) */}
        <div className="flex justify-center md:justify-end space-x-5 mt-2 md:mt-0">
          <SocialIcon Icon={FaFacebookF} href="https://facebook.com" />
          <SocialIcon Icon={FaXTwitter} href="https://x.com/SUITRUMPCOIN" />
          <SocialIcon
            Icon={FaTelegramPlane}
            href="https://t.me/+cFvZCZYolVFiNDk1"
          />
          <SocialIcon Icon={FaInstagram} href="https://instagram.com" />
          <SocialIcon Icon={FaMediumM} href="https://medium.com" />{" "}
          {/* Medium Icon */}
        </div>
      </div>

      {/* Footer bottom */}
      {/* <div className="text-center mt-6 text-sm text-gray-400">
        <p>&copy; {new Date().getFullYear()} SuiDe X. All rights reserved.</p>
      </div> */}
    </footer>
  );
}
