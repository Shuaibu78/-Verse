export async function loadPiDigits(): Promise<string> {
  const response = await fetch("/pi-1million.txt");
  const text = await response.text();
  return text.replace(/\D/g, ""); // Remove non-digit chars
}

export function getPiSegment(digits: string, start: number, length: number) {
  return digits.slice(start, start + length);
}
