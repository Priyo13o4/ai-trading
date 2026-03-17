import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { FaTelegramPlane, FaDiscord } from "react-icons/fa";

export function CommunityDialog({ children }: { children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="lumina-card border-[#C8935A]/20 text-white p-0 sm:rounded-xl overflow-hidden shadow-2xl shadow-black/50 max-w-md">
        <div className="p-6 sm:p-7">
          <DialogTitle className="text-2xl font-semibold text-[#E0E0E0] text-center">Join Our Community</DialogTitle>
          <p className="mt-2 text-center text-sm text-[#9CA3AF]">
            Get live updates, strategy discussions, and quick support from traders like you.
          </p>

          <div className="mt-6 space-y-3">
            <a
              href="https://t.me/yourtelegram" // Replace with your actual link
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between rounded-xl border border-[#C8935A]/25 bg-[#111315]/55 px-4 py-3 text-left transition-all duration-300 hover:border-[#E2B485]/60 hover:bg-[#16191c]/80 hover:shadow-[0_10px_28px_-18px_rgba(226,180,133,0.75)]"
            >
              <span className="flex items-center gap-3">
                <FaTelegramPlane className="h-5 w-5 text-sky-300/80 transition-colors duration-300 group-hover:text-sky-200" />
                <span className="font-semibold text-[#F3F4F6]">Telegram</span>
              </span>
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-[#E2B485]">Open</span>
            </a>

            <a
              href="https://discord.gg/yourdiscord" // Replace with your actual link
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between rounded-xl border border-[#C8935A]/25 bg-[#111315]/55 px-4 py-3 text-left transition-all duration-300 hover:border-[#E2B485]/60 hover:bg-[#16191c]/80 hover:shadow-[0_10px_28px_-18px_rgba(226,180,133,0.75)]"
            >
              <span className="flex items-center gap-3">
                <FaDiscord className="h-5 w-5 text-indigo-300/80 transition-colors duration-300 group-hover:text-indigo-200" />
                <span className="font-semibold text-[#F3F4F6]">Discord</span>
              </span>
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-[#E2B485]">Open</span>
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
