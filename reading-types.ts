export type Book = {
  id: string;
  title: string;
  page_count: number;
  created_by: string | null;
  created_at: string;
};

export type ReadingStatus = "pending" | "approved" | "rejected";

export type Reading = {
  id: string;
  book_id: string;
  member_id: string | null;
  student_name: string;
  read_date: string;
  status: ReadingStatus;
  created_at: string;
  book: { title: string; page_count: number } | null;
};

export type Member = { id: string; student_name: string; parent_id: string; status?: "pending" | "approved"; parent?: { full_name: string; email: string } | null };

export type RankRow = { student_name: string; book_count: number; page_count: number };

export const STATUS_LABEL: Record<ReadingStatus, string> = {
  pending: "Onay bekliyor",
  approved: "Onaylandı",
  rejected: "Reddedildi",
};
