import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

const SYSTEM_PROMPT = `Kamu adalah asisten AI untuk aplikasi KINK (Kasir Agen Brilink Pro). 
Aplikasi ini digunakan oleh agen Brilink untuk mencatat transaksi harian, mengelola saldo bank, kas tunai, laba admin, laba ACC, tarik tunai, deposit, kasbon, dan kontak pelanggan.

Fitur utama:
- Mencatat transaksi dengan kategori (BANK_OUT, BANK_IN, LABA_ACC, LABA_ADMIN, NONE)
- Mengelola saldo Bank, Kas, Laba Admin, Laba ACC, Tarik Tunai, Deposit
- Kasbon (hutang piutang) ke pelanggan
- Kontak pelanggan
- Riwayat transaksi harian
- Laporan dan rekap

Bantulah user dengan pertanyaan seputar penggunaan aplikasi, tips pembukuan, atau bantuan lainnya.
Jawab dalam Bahasa Indonesia yang ramah dan singkat (maksimal 3-4 kalimat).`;

export const initGemini = (apiKey: string) => {
  genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
};

export const chatWithGemini = async (message: string): Promise<string> => {
  if (!model) {
    throw new Error("Gemini belum diinisialisasi. Masukkan API Key di Pengaturan.");
  }

  try {
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: SYSTEM_PROMPT }],
        },
        {
          role: "model",
          parts: [{ text: "Baik, saya siap membantu! Silakan tanya tentang KINK atau pembukuan Brilink." }],
        },
      ],
    });

    const result = await chat.sendMessage(message);
    return result.response.text();
  } catch (err: any) {
    if (err.message?.includes("API_KEY_INVALID")) {
      throw new Error("API Key tidak valid. Periksa kembali API Key Gemini Anda.");
    }
    if (err.message?.includes("SAFETY")) {
      throw new Error("Pesan tidak dapat diproses karena filter keamanan.");
    }
    throw new Error("Gagal terhubung ke Gemini. Periksa koneksi internet Anda.");
  }
};

export const isGeminiReady = () => model !== null;
