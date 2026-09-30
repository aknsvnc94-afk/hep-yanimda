"use client";
import Link from "next/link";
import { HUE_CLASSES, hueFor } from "@/lib/game";
import { useState } from "react";
import { Tabs } from "@/components/Tabs";
import type { Book, Member, Reading } from "@/lib/reading-types";
import { BooksTab } from "./BooksTab";
import { EntryTab } from "./EntryTab";
import { ReportTab } from "./ReportTab";
import { StudentsTab } from "./StudentsTab";

type Main = "ogrenciler" | "sinif" | "kitap";
type Sub = "kitaplar" | "giris" | "rapor";

function setUrl(main: Main, sub: Sub) {
  const u = new URL(window.location.href);
  u.searchParams.set("sekme", main);
  u.searchParams.set("alt", sub);
  window.history.replaceState(null, "", u);
}

export function ClassView(props: {
  classId: string;
  className: string;
  teacherName: string;
  isStaff: boolean;
  backHref: string;
  members: Member[];
  books: Book[];
  readings: Reading[];
  initialTab: string;
  initialSub?: string;
}) {
  const { isStaff, readings } = props;
  const pending = readings.filter((r) => r.status === "pending").length;
  const approvedMembers = props.members.filter((m) => m.status !== "pending");
  const pendingMembers = props.members.length - approvedMembers.length;

  const firstTab: Main = isStaff
    ? props.initialTab === "ogrenciler" || (props.initialTab !== "kitap" && pendingMembers > 0) ? "ogrenciler" : "kitap"
    : props.initialTab === "sinif" ? "sinif" : "kitap";
  const validSubs: Sub[] = isStaff ? ["kitaplar", "giris", "rapor"] : ["kitaplar", "giris"];
  const firstSub: Sub = validSubs.includes(props.initialSub as Sub)
    ? (props.initialSub as Sub)
    : isStaff && pending > 0 ? "giris" : "kitaplar";

  const [main, setMain] = useState<Main>(firstTab);
  const [sub, setSub] = useState<Sub>(firstSub);

  const mainTabs = isStaff
    ? [
        { key: "ogrenciler" as Main, label: `Öğrenciler (${approvedMembers.length})`, icon: "🧒", badge: pendingMembers },
        { key: "kitap" as Main, label: "Kitap Takip", icon: "📚", badge: pending },
      ]
    : [
        { key: "sinif" as Main, label: "Sınıf", icon: "🎒" },
        { key: "kitap" as Main, label: "Kitap Takip", icon: "📚" },
      ];

  const subTabs = [
    { key: "kitaplar" as Sub, label: "Kitap Ekleme", icon: "➕" },
    { key: "giris" as Sub, label: "Öğrenci Kitap Girişi", icon: "✍️", badge: isStaff ? pending : 0 },
    ...(isStaff ? [{ key: "rapor" as Sub, label: "Raporlama", icon: "📊" }] : []),
  ];

  return (
    <div className="space-y-5">
      <section className={`relative overflow-hidden rounded-3xl bg-gradient-to-br p-5 text-white sm:p-6 ${HUE_CLASSES[hueFor(props.className)].grad} ${HUE_CLASSES[hueFor(props.className)].shadow}`}>
        <span className="pointer-events-none absolute -right-3 -top-4 text-8xl opacity-20" aria-hidden>📚</span>
        <Link href={props.backHref} className="relative text-sm font-extrabold text-white/85 hover:text-white">
          ← Ana sayfa
        </Link>
        <h1 className="relative mt-1 text-3xl font-black tracking-tight sm:text-4xl">{props.className}</h1>
        <p className="relative text-sm font-bold text-white/90">🍎 {props.teacherName || "—"}</p>
      </section>

      <Tabs items={mainTabs} value={main} onChange={(k) => { setMain(k); setUrl(k, sub); }} />

      {main === "ogrenciler" && isStaff && <StudentsTab members={props.members} readings={readings} />}

      {main === "sinif" && !isStaff && (
        <section className="card space-y-2 p-5">
          <p className="text-sm font-bold text-muted">Öğrenciniz</p>
          <p className="text-2xl font-black text-ink">{props.members.map((m) => m.student_name).join(", ")}</p>
          <p className="text-sm text-ink-2">
            Bu sınıfa kayıtlı. Okuduğu kitapları <b>Kitap Takip</b> sekmesinden girebilirsiniz; öğretmen
            onayladıktan sonra raporlara ve sıralamaya eklenir.
          </p>
        </section>
      )}

      {main === "kitap" && (
        <section className="card p-4 sm:p-5">
          <Tabs variant="secondary" items={subTabs} value={sub} onChange={(k) => { setSub(k); setUrl(main, k); }} />
          <div className="pt-5">
            {sub === "kitaplar" && <BooksTab classId={props.classId} isStaff={isStaff} books={props.books} readings={readings} />}
            {sub === "giris" && (
              <EntryTab
                classId={props.classId}
                isStaff={isStaff}
                members={approvedMembers}
                books={props.books}
                readings={readings}
                goToBooks={() => { setSub("kitaplar"); setUrl(main, "kitaplar"); }}
              />
            )}
            {sub === "rapor" && isStaff && <ReportTab className={props.className} members={approvedMembers} readings={readings} />}
          </div>
        </section>
      )}
    </div>
  );
}
