// Mock platform users (would come from the backend later). Used by the admin
// Users page and by catalog Access tabs. Frontend-only, in-memory.

export interface UserRow {
  id: number;
  login: string;
  email?: string; // optional
  role: string;
  organization?: string; // optional
  license?: string; // optional
}

export const USERS: UserRow[] = [
  { id: 1, login: "aigerim", email: "aigerim@platform.kz", role: "Admin" },
  { id: 2, login: "daniyar", email: "daniyar@platform.kz", role: "Content editor" },
  { id: 3, login: "saule", email: "saule@platform.kz", role: "Content editor", organization: "School #42" },
  { id: 4, login: "timur", role: "Catalog curator" },
  { id: 5, login: "madina", email: "madina@platform.kz", role: "Reviewer", organization: "Gymnasium #7", license: "PW-CX9D-5J" },
  { id: 6, login: "askar", role: "Org admin", organization: "College #3", license: "PW-JR8E-2M" },
];

export const fetchUsers = (): Promise<UserRow[]> => Promise.resolve(USERS.map((u) => ({ ...u })));

export const findUser = (id: number): UserRow | undefined => USERS.find((u) => u.id === id);
