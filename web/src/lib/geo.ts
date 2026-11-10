const IP_COUNTRY_MAP: Record<string, string> = {
  "64.62.156.159": "United States of America",
  "85.217.149.3": "Canada",
  "64.62.156.154": "United States of America",
  "91.231.89.15": "France",
  "152.32.243.98": "United States of America",
  "65.49.1.96": "United States of America",
  "64.62.156.123": "United States of America",
  "108.157.238.122": "India",
  "79.124.62.134": "United Kingdom",
  "64.62.156.152": "United States of America",
  "108.157.238.4": "India",
  "62.60.130.199": "United Kingdom",
  "45.135.194.60": "Germany",
  "196.18.166.188": "South Africa",
  "85.217.149.44": "Canada",
  "91.231.89.152": "France",
  "64.62.156.131": "United States of America",
  "85.217.149.60": "Canada",
  "91.196.152.17": "United Kingdom",
  "64.62.156.161": "United States of America",
  "198.51.100.55": "Internal Egress Proxy (US)",
  "10.240.0.60": "Internal Sensor (Corporate LAN)",
  "10.240.0.215": "Internal Sensor (Corporate LAN)",
  "114.119.130.199": "Singapore",
  "10.240.0.10": "Internal Gateway (Corporate LAN)",
  "114.119.134.152": "Singapore",
  "198.51.100.14": "Internal Egress Proxy (US)",
  "18.118.18.151": "United States of America",
  "18.97.9.99": "United States of America",
  "10.240.10.115": "Internal Sensor (Corporate LAN)",
  "58.35.80.92": "China",
  "143.55.227.71": "United States of America",
  "31.76.42.237": "Netherlands",
  "40.121.220.169": "United States of America",
  "198.2.182.195": "United States of America",
  "89.41.26.74": "Romania",
  "109.104.120.86": "Germany",
};

export function getGeoCountry(
  srcIp: string,
  triageQuestions?: { format?: string; text?: string; answer?: string }[]
): string {
  if (triageQuestions && triageQuestions.length > 0) {
    const q = triageQuestions.find(
      (item) =>
        item.format?.toUpperCase() === "COUNTRY NAME" ||
        (item.text && item.text.toLowerCase().includes("country"))
    );
    if (q && q.answer) {
      return q.answer;
    }
  }

  return IP_COUNTRY_MAP[srcIp] || "External Threat Source (WAN)";
}
