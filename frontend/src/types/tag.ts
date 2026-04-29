export type Tag =
  | { name: string; children: Tag[] }
  | { name: string; data: string };
