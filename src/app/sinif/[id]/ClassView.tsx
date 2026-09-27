"use client";
import Link from "next/link";
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

  const firstTab: Main = isStaff
    ? props.initialTab === "ogrenciler" ? "ogrenciler" : "kitap"
    : props.initialTab === "sinif" ? "sinif" : "kitap";
  const validSubs: Sub[] = isStaff ? ["kitaplar", "giris", "rapor"] : ["kitaplar", "giris"];
  const firstSub: Sub = validSubs.includes(props.initialSub as Sub)
    ? (props.initialSub as Sub)
    : isStaff && pending > 0 ? "giris" : "kitaplar";

  const [main, setMain] = useState<Main>(firstTab);
  const [sub, setSub] = useState<Sub>(firstSub);

  const mainTabs = isStaff
    ? [
        { key: "ogrenciler" as Main, label: `Öğrenciler (${props.members.length})` },
        { key: "kitap" as Main, label: "📚 Kitap Takip", badge: pending },
      ]
    : [
        { key: "sinif" as Main, label: "Sınıf" },
        { key: "kitap" as Main, label: "📚 Kitap Takip" },
      ];

  const subTabs = [
    { key: "kitaplar" as Sub, label: "Kitap Ekleme" },
    { key: "giris" as Sub, label: "Öğrenci Kitap Girişi", badge: isStaff ? pending : 0 },
    ...(isStaff ? [{ key: "rapor" as Sub, label: "Raporlama" }] : []),
  ];

  return (
    <div className="space-y-5">
      <div>
        <Link href={props.backHref} className="text-sm font-semibold text-slate-500 hover:text-slate-800">
          ← Ana sayfa
        </Link>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">{props.className}</h1>
        <p className="text-sm text-slate-600">Öğretmen: {props.teacherName || "—"}</p>
      </div>

      <Tabs items={mainTabs} value={main} onChange={(k) => { setMain(k); setUrl(k, sub); }} />

      {main === "ogrenciler" && isStaff && <StudentsTab members={props.members} readings={readings} />}

      {main === "sinif" && !isStaff && (
        <section className="card space-y-2 p-5">
          <p className="text-sm text-slate-500">Öğrenciniz</p>
          <p className="text-xl font-extrabold">{props.members.map((m) => m.student_name).join(", ")}</p>
          <p className="text-sm text-slate-600">
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
                members={props.members}
                books={props.books}
                readings={readings}
                goToBooks={() => { setSub("kitaplar"); setUrl(main, "kitaplar"); }}
              />
            )}
            {sub === "rapor" && isStaff && <ReportTab className={props.className} members={props.members} readings={readings} />}
          </div>
        </section>
      )}
    </div>
  );
}
