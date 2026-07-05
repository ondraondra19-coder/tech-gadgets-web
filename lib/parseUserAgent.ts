// lib/parseUserAgent.ts
// Lehký heuristický rozklad User-Agent stringu — nejde o dokonalý parser,
// ale pro admin přehled ("z jakého zařízení") to bohatě stačí.

export function parseUserAgent(ua: string | undefined): string {
  if (!ua) return "Neznámé zařízení";

  let os = "Neznámý systém";
  if (/iPhone/i.test(ua)) os = "iPhone";
  else if (/iPad/i.test(ua)) os = "iPad";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/Macintosh|Mac OS X/i.test(ua)) os = "Mac";
  else if (/Windows/i.test(ua)) os = "Windows";
  else if (/Linux/i.test(ua)) os = "Linux";

  let browser = "";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/OPR\/|Opera/i.test(ua)) browser = "Opera";
  else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) browser = "Chrome";
  else if (/CriOS/i.test(ua)) browser = "Chrome"; // Chrome na iOS
  else if (/FxiOS/i.test(ua)) browser = "Firefox"; // Firefox na iOS
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Safari\//i.test(ua)) browser = "Safari";

  return browser ? `${os} · ${browser}` : os;
}