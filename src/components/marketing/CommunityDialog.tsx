import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FaTelegramPlane, FaDiscord } from "react-icons/fa";

export function CommunityDialog({ children }: { children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-slate-800/95 border-slate-600 text-white p-0 sm:rounded-xl overflow-hidden backdrop-blur-lg shadow-2xl shadow-black/50 max-w-md">
        <div className="p-6">
          <DialogTitle className="text-2xl mb-4 text-center">Join Our Community</DialogTitle>
          <div className="flex flex-col gap-6 items-center">
            <a
              href="https://t.me/yourtelegram" // Replace with your actual link
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-lg font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              <FaTelegramPlane className="w-7 h-7" /> Telegram
            </a>
            <a
              href="https://discord.gg/yourdiscord" // Replace with your actual link
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-lg font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <FaDiscord className="w-7 h-7" /> Discord
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
