import Link from "next/link";
import { WalletButton } from "@/src/components/WalletButton";

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
      <Link href="/" className="flex items-center gap-3" aria-label="ExactDraft home">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#d9ff78] text-lg font-black text-[#173d35]">≡</span>
        <span className="text-sm font-black tracking-[0.18em] text-[#173d35]">EXACTDRAFT</span>
      </Link>
      <div className="flex items-center gap-4">
        <a href="https://testnet.monadvision.com" target="_blank" rel="noreferrer" className="hidden text-xs font-semibold text-[#68736d] hover:text-[#173d35] sm:block">
          Monad testnet ↗
        </a>
        <WalletButton />
      </div>
    </header>
  );
}
