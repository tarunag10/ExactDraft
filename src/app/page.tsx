import { CreateAgreementForm } from "@/src/components/CreateAgreementForm";
import { NetworkNotice } from "@/src/components/NetworkNotice";
import { SiteHeader } from "@/src/components/SiteHeader";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-5 pb-20 pt-8 lg:px-8">
        <NetworkNotice />
        <section className="grid-rule relative overflow-hidden rounded-[2rem] border border-[#cfd9d0] bg-[#173d35] px-6 py-12 text-white shadow-[0_20px_70px_rgba(23,61,53,0.18)] sm:px-10 lg:px-16 lg:py-16">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full border-[28px] border-[#d9ff78]/20" aria-hidden="true" />
          <div className="absolute -bottom-36 right-24 h-72 w-72 rounded-full border-[1px] border-[#f3a35a]/40" aria-hidden="true" />
          <div className="relative max-w-3xl">
            <p className="mono-label text-[10px] font-bold text-[#d9ff78]">Spark hackathon / Monad testnet</p>
            <h1 className="display-font mt-5 text-6xl leading-[0.9] tracking-[-0.06em] sm:text-8xl">Same file.<br /><span className="text-[#d9ff78]">Two attestations.</span></h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-[#dcebe0] sm:text-lg">ExactDraft lets two wallet holders verify that they possess the exact same document without uploading the document anywhere.</p>
            <div className="mt-8 flex flex-wrap gap-2 text-xs font-bold text-[#173d35]"><span className="rounded-full bg-[#d9ff78] px-3 py-1.5">Local SHA-256</span><span className="rounded-full bg-[#f3a35a] px-3 py-1.5">bytes32 onchain</span><span className="rounded-full bg-white/90 px-3 py-1.5">No backend</span></div>
          </div>
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-start" aria-labelledby="create-heading">
          <div className="lg:sticky lg:top-8">
            <p className="mono-label text-[10px] font-bold text-[#68736d]">01 / Start an attestation</p>
            <h2 id="create-heading" className="display-font mt-3 text-5xl leading-none text-[#173d35]">Register your draft.</h2>
            <p className="mt-5 max-w-md text-sm leading-6 text-[#52625a]">Choose a file, name the other wallet, and put a time window around the check. Your file is read only long enough to compute its digest.</p>
            <div className="mt-8 border-l-2 border-[#f3a35a] pl-4 text-xs leading-5 text-[#68736d]">The only file-derived value that reaches Monad is a SHA-256 digest: 32 bytes that cannot reconstruct the original document.</div>
          </div>
          <div className="paper-card rounded-2xl p-6 sm:p-8"><CreateAgreementForm /></div>
        </section>

        <section className="mt-20 border-t border-[#cfd9d0] pt-10" aria-labelledby="how-heading">
          <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="mono-label text-[10px] font-bold text-[#68736d]">A small protocol for a quiet problem</p><h2 id="how-heading" className="display-font mt-2 text-4xl text-[#173d35]">Proof without custody.</h2></div><p className="max-w-sm text-right text-xs leading-5 text-[#68736d]">Built for draft exchanges where neither party should hand a copy to a third-party service.</p></div>
          <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-[#d5ded6] bg-[#d5ded6] md:grid-cols-3">
            <Step number="01" title="Hash locally" copy="Each holder selects their own local file. The browser calculates SHA-256 in memory." />
            <Step number="02" title="Compare privately" copy="The counterparty sees an exact-match or mismatch state against the registered bytes32 digest." />
            <Step number="03" title="Attest on Monad" copy="Only the designated wallet can accept an exact match. The final record is independently readable." />
          </div>
        </section>

        <footer className="mt-16 flex flex-col gap-3 border-t border-[#cfd9d0] pt-6 text-xs leading-5 text-[#68736d] sm:flex-row sm:items-start sm:justify-between"><p>ExactDraft records wallet attestations and is not itself an electronic-signature or legal-advice service.</p><p className="mono-label text-[9px]">No file upload · No backend · No database</p></footer>
      </div>
    </main>
  );
}

function Step({ number, title, copy }: { number: string; title: string; copy: string }) {
  return <article className="bg-[#fffefa] p-6 sm:p-7"><span className="mono-label text-[10px] font-bold text-[#f3a35a]">{number}</span><h3 className="mt-5 text-xl font-black text-[#173d35]">{title}</h3><p className="mt-3 text-sm leading-6 text-[#68736d]">{copy}</p></article>;
}
