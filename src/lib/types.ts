export type Guest = {
  id: string;
  token: string;
  name: string;
  organization: string;
  email?: string;
  emailedAt?: string;
  createdAt: string;
};

export type LunchChoice =
  | "Roasted Chicken Cutlets, Tuscan Herb Cream"
  | "Braised Short Ribs, Smokey Chipotle BBQ + Bistecca 4pp"
  | "Market Fish, Sugarloaf & Fennel Slaw, Citrus Vinaigrette";

export const LUNCH_OPTIONS: LunchChoice[] = [
  "Roasted Chicken Cutlets, Tuscan Herb Cream",
  "Braised Short Ribs, Smokey Chipotle BBQ + Bistecca 4pp",
  "Market Fish, Sugarloaf & Fennel Slaw, Citrus Vinaigrette",
];

export type RsvpResponse = {
  id: string;
  guestId: string;
  attending: "yes" | "no";
  lunch: LunchChoice | "";
  dietary: "yes" | "no";
  dietaryDetails: string;
  submittedAt: string;
};

export type Database = {
  guests: Guest[];
  responses: RsvpResponse[];
};

export type GuestWithResponse = Guest & {
  response: RsvpResponse | null;
  inviteUrl: string;
};
