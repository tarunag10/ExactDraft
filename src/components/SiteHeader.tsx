"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { WalletButton } from "@/src/components/WalletButton";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="relative z-30 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="grid h-9 w-9 place-items-center rounded-lg bg-[#d9ff78] text-[#173d35] transition hover:bg-[#c8ef5d]"
          aria-expanded={menuOpen}
          aria-controls="site-navigation"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          {menuOpen ? <X size={19} strokeWidth={2.5} aria-hidden="true" /> : <Menu size={19} strokeWidth={2.5} aria-hidden="true" />}
        </button>
        <Link href="/" className="flex items-center gap-3" aria-label="ExactDraft home" onClick={closeMenu}>
          <span className="text-sm font-black tracking-[0.18em] text-[#173d35]">EXACTDRAFT</span>
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <a href="https://testnet.monadvision.com" target="_blank" rel="noreferrer" className="hidden text-xs font-semibold text-[#68736d] hover:text-[#173d35] sm:block">
          Monad testnet ↗
        </a>
        <WalletButton />
      </div>
      <nav
        id="site-navigation"
        aria-label="Primary navigation"
        className={`${menuOpen ? "block" : "hidden"} absolute left-5 right-5 top-full rounded-2xl border border-[#cfd9d0] bg-[#fffefa] p-3 shadow-[0_18px_50px_rgba(20,32,28,0.14)] sm:left-8 sm:right-8 lg:left-8 lg:right-8`}
      >
        <Link href="/#create-heading" onClick={closeMenu} className="block rounded-xl px-4 py-3 text-sm font-bold text-[#173d35] hover:bg-[#edf1eb]">
          Start an agreement
        </Link>
        <Link href="/#how-it-works" onClick={closeMenu} className="block rounded-xl px-4 py-3 text-sm font-bold text-[#173d35] hover:bg-[#edf1eb]">
          How ExactDraft works
        </Link>
        <a href="https://testnet.monadvision.com" target="_blank" rel="noreferrer" onClick={closeMenu} className="block rounded-xl px-4 py-3 text-sm font-bold text-[#173d35] hover:bg-[#edf1eb]">
          Monad testnet ↗
        </a>
        <Link href="/#legal" onClick={closeMenu} className="block rounded-xl px-4 py-3 text-sm font-bold text-[#173d35] hover:bg-[#edf1eb]">
          Legal disclaimer
        </Link>
      </nav>
    </header>
  );
}
