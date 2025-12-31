export type Person = "MANN" | "FRAU";
export type Assignee = "MANN" | "FRAU" | "BEIDE";
export type Priority = "A" | "B" | "C";

export type TagDto = { id: string; name: string };

export type TodoDto = {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
  author: Person;
  assignee: Assignee;
  deadline: string | null;
  priority: Priority;
  tags: TagDto[];
};
