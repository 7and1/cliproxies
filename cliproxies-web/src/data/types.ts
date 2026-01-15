export type Platform = "mac" | "windows" | "linux" | "web";

export interface App {
  id: string;
  name: string;
  description: string;
  platforms: Platform[];
  tags: string[];
  repo: string;
  downloadUrl?: string;
  featured?: boolean;
  isPort?: boolean;
}

export interface Sponsor {
  id: string;
  name: string;
  description: string;
  logo: string;
  url: string;
  coupon?: string;
  discount?: string;
  tier: "gold" | "silver" | "bronze";
}
