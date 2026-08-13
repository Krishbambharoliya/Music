export interface Track {
  id: string;
  title: string;
  artist: string;
  film: string;
  year: number;
  duration: number; // in seconds
  videoId: string;   // YouTube Video ID
  fileName?: string; // Optional local filename
  filePath?: string; // Optional local absolute or relative path
}

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
}

export const PLAYLISTS: Playlist[] = [
  {
    id: "raat-ki-paali",
    name: "रात की पाली",
    tracks: [
      { id: "rk-1", title: "Kuch Na Kaho", artist: "Kumar Sanu", film: "1942: A Love Story", year: 1994, duration: 373, videoId: "Kidtrrn4aUM" },
      { id: "rk-2", title: "Jaadu Teri Nazar", artist: "Udit Narayan", film: "Darr", year: 1993, duration: 303, videoId: "FD3vgLOEdgk" },
      { id: "rk-3", title: "Saanson Ki Zaroorat Hai Jaise", artist: "Kumar Sanu", film: "Aashiqui", year: 1990, duration: 357, videoId: "YCuhzjK11iA" },
      { id: "rk-4", title: "Chhupana Bhi Nahi Aata", artist: "Vinod Rathod", film: "Baazigar", year: 1993, duration: 253, videoId: "fg9G1dacXjk" },
      { id: "rk-5", title: "Chitthi Aayi Hai", artist: "Pankaj Udhas", film: "Naam", year: 1986, duration: 460, videoId: "yexZf8g_dJw" },
      { id: "rk-6", title: "Sandese Aate Hain", artist: "Sonu Nigam, Roop Kumar Rathod", film: "Border", year: 1997, duration: 626, videoId: "YczkDMTaek4" }
    ]
  },
  {
    id: "subah-ki-chai",
    name: "सुबह की चाय",
    tracks: [
      { id: "sc-1", title: "Chaiyya Chaiyya", artist: "Sukhwinder Singh, Sapna Awasthi", film: "Dil Se..", year: 1998, duration: 412, videoId: "lZLxjLYyhYQ" },
      { id: "sc-2", title: "Ruk Ja O Dil Deewane", artist: "Udit Narayan", film: "DDLJ", year: 1995, duration: 237, videoId: "jBpRItrod-Q" },
      { id: "sc-3", title: "Koi Na Koi Chahiye", artist: "Kumar Sanu", film: "Deewana", year: 1992, duration: 370, videoId: "_T-NphgkgVc" },
      { id: "sc-4", title: "Jaati Hoon Main", artist: "Kumar Sanu, Alka Yagnik", film: "Karan Arjun", year: 1995, duration: 341, videoId: "l7iTcZ__Ejg" }
    ]
  },
  {
    id: "dopahar-ka-aaram",
    name: "दोपहर का आराम",
    tracks: [
      { id: "da-1", title: "Ghar Se Nikalte Hi", artist: "Udit Narayan", film: "Papa Kehte Hain", year: 1996, duration: 424, videoId: "_IcVb6hFhPs" },
      { id: "da-2", title: "Chand Taare", artist: "Abhijeet", film: "Yes Boss", year: 1997, duration: 298, videoId: "DIAcdeG70IE" },
      { id: "da-3", title: "Akele Hain To Kya Gham Hai", artist: "Udit Narayan, Alka Yagnik", film: "Qayamat Se Qayamat Tak", year: 1988, duration: 280, videoId: "As9DnNT3XZA" },
      { id: "da-4", title: "Jab Koi Baat Bigad Jaye", artist: "Kumar Sanu, Sadhana Sargam", film: "Jurm", year: 1990, duration: 496, videoId: "EhOQvAe6bfM" }
    ]
  },
  {
    id: "shaam-ka-adda",
    name: "शाम का अड्डा",
    tracks: [
      { id: "sa-1", title: "Ab Tere Bin Jee Lenge Hum", artist: "Kumar Sanu", film: "Aashiqui", year: 1990, duration: 340, videoId: "rTatsmUgmiA" },
      { id: "sa-2", title: "Sochenge Tumhe Pyar", artist: "Kumar Sanu", film: "Deewana", year: 1992, duration: 357, videoId: "PUGaSHPdTGg" },
      { id: "sa-3", title: "Chhod Aaye Hum Woh Galiyan", artist: "Hariharan, Suresh Wadkar", film: "Maachis", year: 1996, duration: 292, videoId: "70YFS4GvuQ0" },
      { id: "sa-4", title: "Tu Hi Re", artist: "Hariharan, Kavita Krishnamurthy", film: "Bombay", year: 1995, duration: 425, videoId: "waTwDgK2tkk" },
      { id: "sa-5", title: "Ho Nahi Sakta", artist: "Kumar Sanu", film: "Diljale", year: 1996, duration: 349, videoId: "0vXTVXM6HEE" }
    ]
  }
];
